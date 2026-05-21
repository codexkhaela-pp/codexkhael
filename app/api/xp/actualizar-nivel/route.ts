import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { syncUserLevel } from "@/lib/xp/service";

export const runtime = "nodejs";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const result = await syncUserLevel(user.id);

  return NextResponse.json({
    profile: {
      totalXp: result.profile.totalXp,
      currentLevel: result.profile.currentLevel,
      currentStreak: result.profile.currentStreak,
      bestStreak: result.profile.bestStreak,
    },
    level: result.level,
  });
}
