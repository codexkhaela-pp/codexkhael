import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { ensureUserProfile, resolveLevelByXp, syncUserLevel } from "@/lib/xp/service";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { profile } = await syncUserLevel(user.id);
  const level = await resolveLevelByXp(profile.totalXp);
  const normalizedProfile = profile ?? (await ensureUserProfile(user.id));

  const xpCurrentLevel = level.requiredTotalXp;
  const xpNextLevel = level.nextLevelRequiredXp;
  const denominator = Math.max(1, xpNextLevel - xpCurrentLevel);
  const numerador = Math.max(0, normalizedProfile.totalXp - xpCurrentLevel);
  const xpProgressPercent = Math.min(100, Math.max(0, Math.round((numerador / denominator) * 10000) / 100));

  return NextResponse.json({
    totalXp: normalizedProfile.totalXp,
    currentLevel: normalizedProfile.currentLevel,
    currentStreak: normalizedProfile.currentStreak,
    bestStreak: normalizedProfile.bestStreak,
    levelTitle: level.title,
    levelDescription: level.description,
    xpCurrentLevel,
    xpNextLevel,
    xpProgressPercent,
  });
}
