import { prisma } from "@/lib/prisma";
import type { Prisma, PrismaClient, UserProfile, XpSourceType } from "@/src/generated/prisma/client";

type DbExecutor = PrismaClient | Prisma.TransactionClient;

function getDateKey(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getYesterdayKey(now: Date, timezone: string): string {
  const nowParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(nowParts.find((part) => part.type === "year")?.value ?? "1970");
  const month = Number(nowParts.find((part) => part.type === "month")?.value ?? "01");
  const day = Number(nowParts.find((part) => part.type === "day")?.value ?? "01");

  const utcMidnight = new Date(Date.UTC(year, month - 1, day));
  utcMidnight.setUTCDate(utcMidnight.getUTCDate() - 1);

  return getDateKey(utcMidnight, "UTC");
}

function computeStreakUpdate(profile: UserProfile, now: Date): Pick<UserProfile, "currentStreak" | "bestStreak" | "lastStreakDate"> {
  const timezone = profile.timezone || "America/Lima";
  const todayKey = getDateKey(now, timezone);
  const yesterdayKey = getYesterdayKey(now, timezone);
  const lastKey = profile.lastStreakDate ? getDateKey(profile.lastStreakDate, timezone) : null;

  if (lastKey === todayKey) {
    return {
      currentStreak: profile.currentStreak,
      bestStreak: profile.bestStreak,
      lastStreakDate: profile.lastStreakDate,
    };
  }

  let currentStreak = 1;
  if (lastKey === yesterdayKey) {
    currentStreak = profile.currentStreak + 1;
  }

  return {
    currentStreak,
    bestStreak: Math.max(profile.bestStreak, currentStreak),
    lastStreakDate: now,
  };
}

export async function ensureUserProfile(userId: string, db: DbExecutor = prisma): Promise<UserProfile> {
  return db.userProfile.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      displayName: null,
      sexo: null,
      avatarType: "mago",
      level: 1,
      learningStreak: 0,
      totalXp: 0,
      currentLevel: 1,
      currentStreak: 0,
      bestStreak: 0,
      timezone: "America/Lima",
    },
  });
}

export async function resolveLevelByXp(totalXp: number, db: DbExecutor = prisma) {
  const levelConfig = await db.levelConfig.findFirst({
    where: {
      isActive: true,
      requiredTotalXp: { lte: totalXp },
    },
    orderBy: {
      level: "desc",
    },
  });

  const fallback = levelConfig ?? (await db.levelConfig.findFirst({ where: { level: 1, isActive: true } }));
  if (!fallback) {
    throw new Error("No existe configuración de niveles activa.");
  }

  const nextLevel = await db.levelConfig.findFirst({
    where: {
      isActive: true,
      level: fallback.level + 1,
    },
  });

  return {
    level: fallback.level,
    title: fallback.title,
    description: fallback.description,
    requiredTotalXp: fallback.requiredTotalXp,
    nextLevelRequiredXp: nextLevel?.requiredTotalXp ?? fallback.requiredTotalXp,
  };
}

export async function syncUserLevel(userId: string, db: DbExecutor = prisma) {
  const profile = await ensureUserProfile(userId, db);
  const levelResolved = await resolveLevelByXp(profile.totalXp, db);

  const updated = await db.userProfile.update({
    where: { userId },
    data: {
      currentLevel: levelResolved.level,
      level: levelResolved.level,
    },
  });

  return {
    profile: updated,
    level: levelResolved,
  };
}

export async function registerXpTransaction(params: {
  userId: string;
  sourceType: XpSourceType;
  sourceId?: string | null;
  xpAmount: number;
  reason?: string | null;
  now?: Date;
}) {
  const { userId, sourceType, sourceId, xpAmount, reason, now = new Date() } = params;
  return prisma.$transaction(async (tx) => {
    const profile = await ensureUserProfile(userId, tx);
    const streakUpdate = xpAmount > 0 ? computeStreakUpdate(profile, now) : null;

    const transaction = await tx.userXpTransaction.create({
      data: {
        userId,
        sourceType,
        sourceId: sourceId ?? null,
        xpAmount,
        reason: reason ?? null,
        createdAt: now,
      },
    });

    const updatedProfile = await tx.userProfile.update({
      where: { userId },
      data: {
        totalXp: { increment: xpAmount },
        ...(streakUpdate
          ? {
              currentStreak: streakUpdate.currentStreak,
              bestStreak: streakUpdate.bestStreak,
              learningStreak: streakUpdate.currentStreak,
              lastStreakDate: streakUpdate.lastStreakDate,
            }
          : {}),
      },
    });

    const levelResolved = await resolveLevelByXp(updatedProfile.totalXp, tx);
    const finalProfile = await tx.userProfile.update({
      where: { userId },
      data: {
        currentLevel: levelResolved.level,
        level: levelResolved.level,
      },
    });

    return {
      transaction,
      profile: finalProfile,
      level: levelResolved,
    };
  });
}

export async function sumUserXpByPeriod(params: {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  db?: DbExecutor;
}) {
  const { userId, startDate, endDate } = params;
  const db = params.db ?? prisma;

  const where: Prisma.UserXpTransactionWhereInput = {
    userId,
    ...(startDate || endDate
      ? {
          createdAt: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          },
        }
      : {}),
  };

  const rows = await db.userXpTransaction.findMany({
    where,
    select: { xpAmount: true },
  });

  return rows.reduce((sum, row) => sum + row.xpAmount, 0);
}
