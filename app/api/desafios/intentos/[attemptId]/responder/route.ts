import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { parseChallengeAnswer, parseUuid } from "@/lib/desafios/service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ attemptId: string }>;
};

type AnswerBody = {
  questionId?: string;
  selectedAnswer?: string;
};

export async function POST(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { attemptId } = await context.params;

  let body: AnswerBody;
  try {
    body = (await request.json()) as AnswerBody;
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const questionId = parseUuid(body.questionId);
  const selectedAnswer = parseChallengeAnswer(body.selectedAnswer);

  if (!questionId || !selectedAnswer) {
    return NextResponse.json({ error: "questionId y selectedAnswer son obligatorios" }, { status: 400 });
  }

  const attempt = await prisma.userChallengeAttempt.findFirst({
    where: {
      id: attemptId,
      userId: user.id,
      status: "IN_PROGRESS",
    },
    include: {
      challenge: true,
    },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Intento no encontrado o ya finalizado" }, { status: 404 });
  }

  const question = await prisma.challengeQuestion.findFirst({
    where: {
      id: questionId,
      challengeId: attempt.challengeId,
    },
  });

  if (!question) {
    return NextResponse.json({ error: "Pregunta no encontrada para este desafío" }, { status: 404 });
  }

  const alreadyAnswered = await prisma.userChallengeAnswer.findUnique({
    where: {
      attemptId_questionId: {
        attemptId: attempt.id,
        questionId: question.id,
      },
    },
  });

  if (alreadyAnswered) {
    return NextResponse.json({ error: "La pregunta ya fue respondida" }, { status: 409 });
  }

  const isCorrect = selectedAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();

  const answer = await prisma.userChallengeAnswer.create({
    data: {
      attemptId: attempt.id,
      questionId: question.id,
      selectedAnswer,
      isCorrect,
    },
  });

  return NextResponse.json({
    answerId: answer.id,
    questionId: question.id,
    isCorrect,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
  });
}
