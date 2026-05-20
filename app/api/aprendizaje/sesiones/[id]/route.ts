import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { orientationLabel, getOrientationScopeLabel, getScopeLabel } from "@/lib/aprendizaje/quiz-engine";
import { tarotCards } from "@/src/data/tarotCards";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await context.params;

  const session = await prisma.learningQuizSession.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      questions: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
  }

  const cardMap = new Map(tarotCards.map((card) => [card.id, card]));

  const questions = session.questions.map((question) => {
    const card = cardMap.get(question.cardId);
    const options = Array.isArray(question.optionsJson) ? question.optionsJson : [];

    return {
      id: question.id,
      order: question.order,
      cardId: question.cardId,
      cardName: card?.nameEs ?? question.cardId,
      cardImage: card?.image ?? null,
      orientation: question.orientation,
      orientationLabel: orientationLabel(question.orientation),
      questionType: question.questionType,
      promptText: question.promptText,
      options,
      selectedAnswer: question.selectedAnswer,
      isCorrect: question.isCorrect,
      answeredAt: question.answeredAt,
    };
  });

  return NextResponse.json({
    session: {
      id: session.id,
      mode: session.mode,
      questionCount: session.questionCount,
      selectedDeckScope: session.selectedDeckScope,
      selectedDeckScopeLabel: getScopeLabel(session.selectedDeckScope),
      orientationScope: session.orientationScope,
      orientationScopeLabel: getOrientationScopeLabel(session.orientationScope),
      startedAt: session.startedAt,
      finishedAt: session.finishedAt,
      totalCorrect: session.totalCorrect,
      totalIncorrect: session.totalIncorrect,
      scorePercent: session.scorePercent,
    },
    questions,
  });
}

