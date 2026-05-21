import { prisma } from "@/lib/prisma";
import type {
  ChallengeAttemptStatus,
  ChallengeType,
  Prisma,
  PrismaClient,
  UserChallengeAttempt,
} from "@/src/generated/prisma/client";
import { registerXpTransaction } from "@/lib/xp/service";

type DbExecutor = PrismaClient | Prisma.TransactionClient;

const CHALLENGE_BASE_XP = 5;
const CHALLENGE_XP_PER_CORRECT = 10;
const CHALLENGE_PERFECT_BONUS = 20;

export function normalizeChallengeType(type?: string | null): ChallengeType | null {
  if (!type) return null;
  const upper = type.toUpperCase();
  const allowed = new Set([
    "DAILY",
    "GUIDED",
    "COMPLETE_CARD",
    "ERROR_DETECTION",
    "VEIL_READING",
    "HARD_DECISION",
  ]);
  return allowed.has(upper) ? (upper as ChallengeType) : null;
}

export async function resolveChallengeAwardXp(params: {
  userId: string;
  attemptId: string;
  challengeTitle: string;
  correctAnswers: number;
  totalQuestions: number;
  db?: DbExecutor;
  now?: Date;
}) {
  const { userId, attemptId, challengeTitle, now = new Date() } = params;
  const db = params.db ?? prisma;

  const totalQuestions = Math.max(0, Math.floor(params.totalQuestions));
  const boundedCorrect = Math.max(0, Math.floor(params.correctAnswers));
  const correctAnswers = totalQuestions > 0 ? Math.min(boundedCorrect, totalQuestions) : 0;
  const isPerfect = totalQuestions > 0 && correctAnswers === totalQuestions;

  let awardedXp = CHALLENGE_BASE_XP + correctAnswers * CHALLENGE_XP_PER_CORRECT;
  if (isPerfect) {
    awardedXp += CHALLENGE_PERFECT_BONUS;
  }

  const existingTransaction = await db.userXpTransaction.findFirst({
    where: {
      userId,
      sourceType: "CHALLENGE_COMPLETED",
      sourceId: attemptId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (existingTransaction) {
    return {
      awardedXp: existingTransaction.xpAmount,
      reason: "XP ya registrado para este intento.",
      transaction: existingTransaction,
      profile: null,
      level: null,
    };
  }

  const metadata = JSON.stringify({
    correctAnswers,
    totalQuestions,
    isPerfect,
  });

  const result = await registerXpTransaction({
    userId,
    sourceType: "CHALLENGE_COMPLETED",
    sourceId: attemptId,
    xpAmount: awardedXp,
    reason: `XP por desafio (${challengeTitle}) intento ${attemptId} | metadata=${metadata}`,
    now,
  });

  return {
    awardedXp,
    reason: "XP otorgado por desafio.",
    transaction: result.transaction,
    profile: result.profile,
    level: result.level,
  };
}

export async function finalizeAttemptScoring(params: {
  attempt: UserChallengeAttempt;
  status?: ChallengeAttemptStatus;
  db?: DbExecutor;
  now?: Date;
}) {
  const db = params.db ?? prisma;
  const now = params.now ?? new Date();
  const status = params.status ?? "COMPLETED";

  const [answers, totalQuestions] = await Promise.all([
    db.userChallengeAnswer.findMany({
      where: { attemptId: params.attempt.id },
      select: { isCorrect: true },
    }),
    db.challengeQuestion.count({
      where: { challengeId: params.attempt.challengeId },
    }),
  ]);

  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  const incorrectCount = answers.length - correctCount;
  const score = answers.length > 0 ? Math.round((correctCount / answers.length) * 10000) / 100 : 0;

  const updateResult = await db.userChallengeAttempt.updateMany({
    where: {
      id: params.attempt.id,
      status: "IN_PROGRESS",
    },
    data: {
      completedAt: now,
      status,
      correctCount,
      incorrectCount,
      score,
    },
  });

  const persistedAttempt = await db.userChallengeAttempt.findUnique({
    where: { id: params.attempt.id },
  });

  if (!persistedAttempt) {
    throw new Error("Intento no encontrado al finalizar.");
  }

  return {
    attempt: persistedAttempt,
    score: persistedAttempt.score,
    correctCount: persistedAttempt.correctCount,
    incorrectCount: persistedAttempt.incorrectCount,
    totalQuestions,
    alreadyCompleted: updateResult.count === 0,
  };
}

export function parseChallengeAnswer(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseUuid(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
