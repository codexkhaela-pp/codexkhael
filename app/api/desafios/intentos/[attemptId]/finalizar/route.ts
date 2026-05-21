import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { finalizeAttemptScoring, resolveChallengeAwardXp } from "@/lib/desafios/service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ attemptId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { attemptId } = await context.params;
  const attempt = await prisma.userChallengeAttempt.findFirst({
    where: {
      id: attemptId,
      userId: user.id,
    },
    include: {
      challenge: true,
    },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Intento no encontrado" }, { status: 404 });
  }

  if (attempt.status === "COMPLETED") {
    return NextResponse.json({
      message: "Intento ya finalizado",
      attempt,
      xp: {
        awarded: attempt.earnedXp,
        reason: "ALREADY_COMPLETED",
        transactionId: null,
      },
    });
  }

  const scoredAttempt = await finalizeAttemptScoring({
    attempt,
    status: "COMPLETED",
  });

  if (scoredAttempt.alreadyCompleted) {
    return NextResponse.json({
      message: "Intento ya finalizado",
      attempt: scoredAttempt.attempt,
      xp: {
        awarded: scoredAttempt.attempt.earnedXp,
        reason: "ALREADY_COMPLETED",
        transactionId: null,
      },
    });
  }

  const xpResult = await resolveChallengeAwardXp({
    userId: user.id,
    attemptId: attempt.id,
    challengeTitle: attempt.challenge.title,
    correctAnswers: scoredAttempt.correctCount,
    totalQuestions: scoredAttempt.totalQuestions,
  });

  const updatedAttempt = await prisma.userChallengeAttempt.update({
    where: { id: attempt.id },
    data: {
      earnedXp: xpResult.awardedXp,
    },
  });

  return NextResponse.json({
    attempt: updatedAttempt,
    xp: {
      awarded: xpResult.awardedXp,
      reason: xpResult.reason,
      transactionId: xpResult.transaction?.id ?? null,
    },
    profile: xpResult.profile
      ? {
          totalXp: xpResult.profile.totalXp,
          currentLevel: xpResult.profile.currentLevel,
          currentStreak: xpResult.profile.currentStreak,
          bestStreak: xpResult.profile.bestStreak,
        }
      : null,
    level: xpResult.level,
    score: scoredAttempt.score,
  });
}
