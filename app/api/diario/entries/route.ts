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
  if (!spreadType) {
    return NextResponse.json({ error: "spreadType es obligatorio" }, { status: 400 });
  }

  const question = body.metadata?.question?.trim() ?? "";
  const readingDate = toDateOnlyDateTime(body.metadata?.date);
  const readingTime = body.metadata?.time?.trim() || null;
  const notes = body.notes?.trim() || body.reflection?.personalInterpretation?.trim() || null;
  const cardsJson = buildCardsJsonFromBody(body);

  const created = await prisma.bitacoraEntry.create({
    data: {
      userId: user.id,
      spreadType,
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
