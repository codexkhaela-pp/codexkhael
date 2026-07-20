import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import {
  buildCardsJsonFromBody,
  mapBitacoraEntryToJournalEntry,
  toDateOnlyDateTime,
  type ApiCreateBitacoraBody,
} from "@/app/api/diario/_lib/bitacora-mapper";
import { resetIfNeeded } from "@/lib/usage/reset";
import { canCreateBitacoraEntry } from "@/lib/usage/limits";
import { resolvePlanTier } from "@/lib/plans";
import { canUseManualSpreadCardCount, canUseSpread, MANUAL_SPREAD_ID } from "@/lib/features";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
  
  const entries = await prisma.bitacoraEntry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { reReadings: { orderBy: { createdAt: "asc" } } },
  });

  const limitCheck = profile 
    ? canCreateBitacoraEntry(profile, entries.length) 
    : { allowed: true };

  return NextResponse.json({ 
    entries: entries.map(mapBitacoraEntryToJournalEntry),
    canCreateNew: limitCheck.allowed,
    limitReason: limitCheck.reason || null
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // ── Usage guard ────────────────────────────────────────────────────────────
  const profile = await getOrCreateProfile(user.id);
  const freshProfile = await resetIfNeeded(profile);

  const currentCount = await prisma.bitacoraEntry.count({ where: { userId: user.id } });
  const check = canCreateBitacoraEntry(freshProfile, currentCount);
  if (!check.allowed) {
    return NextResponse.json(
      { error: "LIMIT_REACHED", reason: check.reason, plan: resolvePlanTier(freshProfile.userPlan), limit: check.limit },
      { status: 403 }
    );
  }
  // ── End usage guard ────────────────────────────────────────────────────────

  let body: ApiCreateBitacoraBody;
  try {
    body = (await request.json()) as ApiCreateBitacoraBody;
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const spreadType = body.metadata?.spreadType?.trim() ?? "";
  const spreadId = body.canvas?.spreadId?.trim() || spreadType;
  if (!spreadType && !spreadId) {
    return NextResponse.json({ error: "spreadType es obligatorio" }, { status: 400 });
  }

  // Feature limit guard
  const manualPlacements = Array.isArray(body.canvas?.placements) ? body.canvas.placements.length : 0;
  const isManualSpread = spreadId === "free" || spreadId === MANUAL_SPREAD_ID;

  if (isManualSpread) {
    if (!canUseManualSpreadCardCount(freshProfile.userPlan, manualPlacements)) {
      return NextResponse.json(
        {
          error: "FEATURE_NOT_ALLOWED",
          feature: "SPREAD",
          spreadType: spreadId,
          requiredPlan: "BASIC"
        },
        { status: 403 }
      );
    }
  } else if (!canUseSpread(freshProfile.userPlan, spreadId)) {
    return NextResponse.json(
      {
        error: "FEATURE_NOT_ALLOWED",
        feature: "SPREAD",
        spreadType: spreadId,
        requiredPlan: "BASIC" // This is generic, but meets the requirement.
      },
      { status: 403 }
    );
  }

  const question = body.metadata?.question?.trim() ?? "";
  const readingDate = toDateOnlyDateTime(body.metadata?.date);
  const readingTime = body.metadata?.time?.trim() || null;
  const notes = body.notes?.trim() || body.reflection?.personalInterpretation?.trim() || null;
  const cardsJson = buildCardsJsonFromBody(body);

  const created = await prisma.bitacoraEntry.create({
    data: {
      userId: user.id,
      spreadType: spreadId,
      question,
      readingDate,
      readingTime,
      notes,
      cardsJson,
    },
    include: { reReadings: { orderBy: { createdAt: "asc" } } },
  });

  // Log the reading usage with plan snapshot
  await prisma.usageLog.create({
    data: { userId: user.id, type: "READING", planSnapshot: resolvePlanTier(freshProfile.userPlan) },
  });

  return NextResponse.json({ entry: mapBitacoraEntryToJournalEntry(created) }, { status: 201 });
}

/** Finds or creates a UserProfile for the given userId. Always returns a non-null profile. */
async function getOrCreateProfile(userId: string) {
  const existing = await prisma.userProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.userProfile.create({ data: { userId } });
}
