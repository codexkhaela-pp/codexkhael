import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { registerXpTransaction } from "@/lib/xp/service";
import type { XpSourceType } from "@/src/generated/prisma/client";

export const runtime = "nodejs";

type GrantBody = {
  sourceType?: string;
  sourceId?: string | null;
  xpAmount?: number;
  reason?: string | null;
};

const ALLOWED_SOURCE_TYPES = new Set([
  "CHALLENGE_COMPLETED",
  "QUIZ_COMPLETED",
  "COURSE_LESSON_COMPLETED",
  "JOURNAL_ENTRY_CREATED",
  "STREAK_BONUS",
  "MANUAL_ADJUSTMENT",
]);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: GrantBody;
  try {
    body = (await request.json()) as GrantBody;
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const sourceType = typeof body.sourceType === "string" ? body.sourceType.trim().toUpperCase() : "";
  if (!ALLOWED_SOURCE_TYPES.has(sourceType)) {
    return NextResponse.json({ error: "sourceType inválido" }, { status: 400 });
  }

  const xpAmount = Number(body.xpAmount ?? 0);
  if (!Number.isFinite(xpAmount) || xpAmount <= 0) {
    return NextResponse.json({ error: "xpAmount debe ser mayor a 0" }, { status: 400 });
  }

  const result = await registerXpTransaction({
    userId: user.id,
    sourceType: sourceType as XpSourceType,
    sourceId: body.sourceId ?? null,
    xpAmount: Math.floor(xpAmount),
    reason: body.reason ?? null,
  });

  return NextResponse.json({
    transaction: result.transaction,
    profile: {
      totalXp: result.profile.totalXp,
      currentLevel: result.profile.currentLevel,
      currentStreak: result.profile.currentStreak,
      bestStreak: result.profile.bestStreak,
    },
    level: result.level,
  });
}
