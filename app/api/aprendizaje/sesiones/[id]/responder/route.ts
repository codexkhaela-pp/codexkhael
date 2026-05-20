import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import {
  applyAnswerToProgress,
  buildProgressKey,
  getCardMeaningByOrientation,
  orientationLabel,
  type CardOrientation,
  type ProgressSnapshot,
} from "@/lib/aprendizaje/quiz-engine";
import { tarotCards } from "@/src/data/tarotCards";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type AnswerBody = {
  questionId?: string;
  selectedAnswer?: string;
};

function toSnapshot(params: {
  userId: string;
  cardId: string;
  orientation: CardOrientation;
  row?: {
    id: string;
    correctCount: number;
    incorrectCount: number;
    currentCorrectStreak: number;
    currentIncorrectStreak: number;
    bestCorrectStreak: number;
    masteryLevel: number;
    isMastered: boolean;
    weight: number;
    lastSeenAt: Date | null;
    lastCorrectAt: Date | null;
    lastIncorrectAt: Date | null;
  };
}): ProgressSnapshot {
  const { userId, cardId, orientation, row } = params;
  if (!row) {
    return {
      userId,
      cardId,
      orientation,
      correctCount: 0,
      incorrectCount: 0,
      currentCorrectStreak: 0,
      currentIncorrectStreak: 0,
      bestCorrectStreak: 0,
      masteryLevel: 0,
      isMastered: false,
      weight: 1,
      lastSeenAt: null,
      lastCorrectAt: null,
      lastIncorrectAt: null,
    };
  }

  return {
    id: row.id,
    userId,
    cardId,
    orientation,
    correctCount: row.correctCount,
    incorrectCount: row.incorrectCount,
    currentCorrectStreak: row.currentCorrectStreak,
    currentIncorrectStreak: row.currentIncorrectStreak,
    bestCorrectStreak: row.bestCorrectStreak,
    masteryLevel: row.masteryLevel,
    isMastered: row.isMastered,
    weight: row.weight,
    lastSeenAt: row.lastSeenAt,
    lastCorrectAt: row.lastCorrectAt,
    lastIncorrectAt: row.lastIncorrectAt,
  };
}

export async function POST(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id: sessionId } = await context.params;

  let body: AnswerBody;
  try {
    body = (await request.json()) as AnswerBody;
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const questionId = body.questionId?.trim();
  const selectedAnswer = body.selectedAnswer?.trim();

  if (!questionId || !selectedAnswer) {
    return NextResponse.json({ error: "questionId y selectedAnswer son obligatorios" }, { status: 400 });
  }

  const session = await prisma.learningQuizSession.findFirst({
    where: {
      id: sessionId,
      userId: user.id,
    },
    select: {
      id: true,
      questionCount: true,
      finishedAt: true,
      totalCorrect: true,
      totalIncorrect: true,
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
  }

  if (session.finishedAt) {
    return NextResponse.json({ error: "La sesión ya fue finalizada" }, { status: 409 });
  }

  const question = await prisma.learningQuizQuestion.findFirst({
    where: {
      id: questionId,
      sessionId: session.id,
    },
    select: {
      id: true,
      cardId: true,
      orientation: true,
      correctAnswer: true,
      isCorrect: true,
      order: true,
      questionType: true,
    },
  });

  if (!question) {
    return NextResponse.json({ error: "Pregunta no encontrada" }, { status: 404 });
  }

  if (question.isCorrect !== null) {
    return NextResponse.json({ error: "La pregunta ya fue respondida" }, { status: 409 });
  }

  const isCorrect = selectedAnswer.toLowerCase() === question.correctAnswer.trim().toLowerCase();
  const now = new Date();
  const card = tarotCards.find((entry) => entry.id === question.cardId) ?? null;
  const meaning = card ? getCardMeaningByOrientation(card, question.orientation as CardOrientation) : question.correctAnswer;

  const result = await prisma.$transaction(async (tx) => {
    await tx.learningQuizQuestion.update({
      where: {
        id: question.id,
      },
      data: {
        selectedAnswer,
        isCorrect,
        answeredAt: now,
      },
    });

    const progressKey = buildProgressKey(question.cardId, question.orientation as CardOrientation);

    const existingProgress = await tx.cardLearningProgress.findUnique({
      where: {
        userId_cardId_orientation: {
          userId: user.id,
          cardId: question.cardId,
          orientation: question.orientation,
        },
      },
      select: {
        id: true,
        correctCount: true,
        incorrectCount: true,
        currentCorrectStreak: true,
        currentIncorrectStreak: true,
        bestCorrectStreak: true,
        masteryLevel: true,
        isMastered: true,
        weight: true,
        lastSeenAt: true,
        lastCorrectAt: true,
        lastIncorrectAt: true,
      },
    });

    const currentSnapshot = toSnapshot({
      userId: user.id,
      cardId: question.cardId,
      orientation: question.orientation as CardOrientation,
      row: existingProgress ?? undefined,
    });

    const nextSnapshot = applyAnswerToProgress(currentSnapshot, isCorrect, now);

    if (existingProgress) {
      await tx.cardLearningProgress.update({
        where: {
          userId_cardId_orientation: {
            userId: user.id,
            cardId: question.cardId,
            orientation: question.orientation,
          },
        },
        data: {
          correctCount: nextSnapshot.correctCount,
          incorrectCount: nextSnapshot.incorrectCount,
          currentCorrectStreak: nextSnapshot.currentCorrectStreak,
          currentIncorrectStreak: nextSnapshot.currentIncorrectStreak,
          bestCorrectStreak: nextSnapshot.bestCorrectStreak,
          masteryLevel: nextSnapshot.masteryLevel,
          isMastered: nextSnapshot.isMastered,
          weight: nextSnapshot.weight,
          lastSeenAt: nextSnapshot.lastSeenAt,
          lastCorrectAt: nextSnapshot.lastCorrectAt,
          lastIncorrectAt: nextSnapshot.lastIncorrectAt,
        },
      });
    } else {
      await tx.cardLearningProgress.create({
        data: {
          userId: user.id,
          cardId: question.cardId,
          orientation: question.orientation,
          correctCount: nextSnapshot.correctCount,
          incorrectCount: nextSnapshot.incorrectCount,
          currentCorrectStreak: nextSnapshot.currentCorrectStreak,
          currentIncorrectStreak: nextSnapshot.currentIncorrectStreak,
          bestCorrectStreak: nextSnapshot.bestCorrectStreak,
          masteryLevel: nextSnapshot.masteryLevel,
          isMastered: nextSnapshot.isMastered,
          weight: nextSnapshot.weight,
          lastSeenAt: nextSnapshot.lastSeenAt,
          lastCorrectAt: nextSnapshot.lastCorrectAt,
          lastIncorrectAt: nextSnapshot.lastIncorrectAt,
        },
      });
    }

    const totalCorrect = session.totalCorrect + (isCorrect ? 1 : 0);
    const totalIncorrect = session.totalIncorrect + (isCorrect ? 0 : 1);
    const answeredCount = totalCorrect + totalIncorrect;
    const finished = answeredCount >= session.questionCount;
    const scorePercent = answeredCount > 0 ? Math.round((totalCorrect / answeredCount) * 10000) / 100 : 0;

    await tx.learningQuizSession.update({
      where: {
        id: session.id,
      },
      data: {
        totalCorrect,
        totalIncorrect,
        scorePercent,
        finishedAt: finished ? now : null,
      },
    });

    return {
      isCorrect,
      finished,
      answeredCount,
      totalCorrect,
      totalIncorrect,
      scorePercent,
      progressKey,
    };
  });

  return NextResponse.json({
    ...result,
    feedback: {
      status: isCorrect ? "correct" : "incorrect",
      title: isCorrect ? "Correcto" : "Respuesta incorrecta",
      message: isCorrect
        ? "Bien hecho. Continúa con la siguiente carta."
        : "Esta carta aparecerá más seguido para reforzarla.",
      cardName: card?.nameEs ?? question.cardId,
      orientationLabel: orientationLabel(question.orientation as CardOrientation),
      selectedAnswer,
      correctAnswer: question.correctAnswer,
      meaning,
    },
  });
}
