import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { tarotCards } from "@/src/data/tarotCards";
import {
  buildPairPool,
  buildQuizQuestions,
  filterCardsByScope,
  getAllowedOrientations,
  parseCustomPairs,
  parseStringArray,
  type DeckScope,
  type OrientationScope,
  type ProgressSnapshot,
  type QuizMode,
} from "@/lib/aprendizaje/quiz-engine";

export const runtime = "nodejs";

const ALLOWED_MODES = new Set<QuizMode>(["IMAGE_TO_MEANING", "MEANING_TO_CARD", "MIXED"]);
const ALLOWED_SCOPES = new Set<DeckScope>([
  "FULL_DECK",
  "MAJOR_ARCANA",
  "MINOR_ARCANA",
  "WANDS",
  "CUPS",
  "SWORDS",
  "PENTACLES",
  "COURT",
  "CUSTOM",
]);
const ALLOWED_ORIENTATION_SCOPES = new Set<OrientationScope>(["UPRIGHT_ONLY", "REVERSED_ONLY", "BOTH"]);

function clampQuestionCount(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 10;
  return Math.min(40, Math.max(3, Math.round(parsed)));
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const [sessions, masteredCount, hardCount, inProgressCount] = await Promise.all([
    prisma.learningQuizSession.findMany({
      where: { userId: user.id },
      orderBy: { startedAt: "desc" },
      take: 20,
      include: {
        questions: {
          select: {
            id: true,
            isCorrect: true,
          },
        },
      },
    }),
    prisma.cardLearningProgress.count({
      where: {
        userId: user.id,
        isMastered: true,
      },
    }),
    prisma.cardLearningProgress.count({
      where: {
        userId: user.id,
        OR: [{ incorrectCount: { gt: 0 } }, { currentIncorrectStreak: { gt: 0 } }],
      },
    }),
    prisma.cardLearningProgress.count({
      where: {
        userId: user.id,
        isMastered: false,
        correctCount: { gt: 0 },
      },
    }),
  ]);

  const normalized = sessions.map((session) => ({
    id: session.id,
    mode: session.mode,
    questionCount: session.questionCount,
    selectedDeckScope: session.selectedDeckScope,
    orientationScope: session.orientationScope,
    startedAt: session.startedAt,
    finishedAt: session.finishedAt,
    totalCorrect: session.totalCorrect,
    totalIncorrect: session.totalIncorrect,
    scorePercent: session.scorePercent,
    answeredCount: session.questions.filter((q) => q.isCorrect !== null).length,
  }));

  return NextResponse.json({
    sessions: normalized,
    summary: {
      masteredCount,
      inProgressCount,
      hardCount,
    },
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: {
    mode?: QuizMode;
    questionCount?: number;
    selectedDeckScope?: DeckScope;
    orientationScope?: OrientationScope;
    customCardIds?: unknown;
    customPairs?: unknown;
    retrySourceSessionId?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const mode: QuizMode = ALLOWED_MODES.has(body.mode ?? "MIXED") ? (body.mode as QuizMode) : "MIXED";
  const selectedDeckScope: DeckScope = ALLOWED_SCOPES.has(body.selectedDeckScope ?? "FULL_DECK")
    ? (body.selectedDeckScope as DeckScope)
    : "FULL_DECK";
  const orientationScope: OrientationScope = ALLOWED_ORIENTATION_SCOPES.has(body.orientationScope ?? "BOTH")
    ? (body.orientationScope as OrientationScope)
    : "BOTH";

  const customCardIds = parseStringArray(body.customCardIds);
  let customPairs = parseCustomPairs(body.customPairs);

  if (body.retrySourceSessionId?.trim()) {
    const sourceSession = await prisma.learningQuizSession.findFirst({
      where: {
        id: body.retrySourceSessionId.trim(),
        userId: user.id,
      },
      select: {
        questions: {
          where: {
            isCorrect: false,
          },
          select: {
            cardId: true,
            orientation: true,
          },
        },
      },
    });

    if (!sourceSession || sourceSession.questions.length === 0) {
      return NextResponse.json(
        { error: "No hay preguntas falladas para reintentar en esa sesión." },
        { status: 400 },
      );
    }

    customPairs = sourceSession.questions.map((question) => ({
      cardId: question.cardId,
      orientation: question.orientation,
    }));
  }

  const scopedCards = filterCardsByScope(tarotCards, selectedDeckScope, customCardIds);
  const orientations = getAllowedOrientations(orientationScope);

  const effectiveCards = customPairs.length > 0
    ? tarotCards.filter((card) => customPairs.some((pair) => pair.cardId === card.id))
    : scopedCards;

  if (effectiveCards.length === 0) {
    return NextResponse.json(
      { error: "No hay cartas disponibles con los filtros seleccionados" },
      { status: 400 },
    );
  }

  const effectiveQuestionCount = clampQuestionCount(
    body.questionCount ?? (customPairs.length > 0 ? customPairs.length : 10),
  );

  const existingProgressRows = await prisma.cardLearningProgress.findMany({
    where: {
      userId: user.id,
      cardId: {
        in: effectiveCards.map((card) => card.id),
      },
    },
  });

  const progressRows: ProgressSnapshot[] = existingProgressRows.map((row) => ({
    id: row.id,
    userId: row.userId,
    cardId: row.cardId,
    orientation: row.orientation,
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
  }));

  const pairPool = buildPairPool({
    userId: user.id,
    cards: effectiveCards,
    orientations,
    existingProgress: progressRows,
    selectedPairs: customPairs.length > 0 ? customPairs : undefined,
  });

  if (pairPool.length === 0) {
    return NextResponse.json({ error: "No se pudieron preparar pares carta/orientación" }, { status: 400 });
  }

  const distractorCards = customPairs.length > 0 ? tarotCards : scopedCards;
  const distractorPool = buildPairPool({
    userId: user.id,
    cards: distractorCards,
    orientations,
    existingProgress: progressRows,
  });

  const questions = buildQuizQuestions({
    mode,
    count: effectiveQuestionCount,
    pairPool,
    distractorPool,
  });

  if (questions.length === 0) {
    return NextResponse.json({ error: "No se pudieron generar preguntas" }, { status: 400 });
  }

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      displayName: user.email.split("@")[0],
      sexo: null,
      avatarType: "mago",
      level: 1,
      learningStreak: 0,
    },
  });

  const session = await prisma.learningQuizSession.create({
    data: {
      userId: user.id,
      mode,
      questionCount: questions.length,
      selectedDeckScope: customPairs.length > 0 ? "CUSTOM" : selectedDeckScope,
      selectedCardIdsJson:
        customPairs.length > 0
          ? customPairs.map((pair) => `${pair.cardId}::${pair.orientation}`)
          : selectedDeckScope === "CUSTOM"
            ? customCardIds
            : undefined,
      orientationScope,
      questions: {
        create: questions.map((question) => ({
          cardId: question.cardId,
          orientation: question.orientation,
          questionType: question.questionType,
          promptText: question.promptText,
          correctAnswer: question.correctAnswer,
          optionsJson: question.optionsJson,
          order: question.order,
        })),
      },
    },
    include: {
      questions: {
        orderBy: {
          order: "asc",
        },
        take: 1,
      },
    },
  });

  return NextResponse.json(
    {
      sessionId: session.id,
      firstQuestionId: session.questions[0]?.id,
      generatedQuestionCount: questions.length,
    },
    { status: 201 },
  );
}
