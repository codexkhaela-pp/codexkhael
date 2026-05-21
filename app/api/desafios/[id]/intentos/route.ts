import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id: challengeId } = await context.params;
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: { questions: { select: { id: true } } },
  });

  if (!challenge || !challenge.isActive) {
    return NextResponse.json({ error: "Desafío no disponible" }, { status: 404 });
  }

  const attempt = await prisma.userChallengeAttempt.create({
    data: {
      userId: user.id,
      challengeId: challenge.id,
      status: "IN_PROGRESS",
      score: 0,
      correctCount: 0,
      incorrectCount: 0,
      earnedXp: 0,
    },
  });

  return NextResponse.json(
    {
      attemptId: attempt.id,
      challengeId: challenge.id,
      questionCount: challenge.questions.length,
    },
    { status: 201 },
  );
}
