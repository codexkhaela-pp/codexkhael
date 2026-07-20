import { prisma } from "@/lib/prisma";
import { tarotCards } from "@/src/data/tarotCards";
import { getDailyCardMessage } from "./messages";
import { CardOrientation } from "@/src/generated/prisma/client";

const DEFAULT_TIMEZONE = "America/Lima";
const PUBLIC_CARD_ID_PREFIX = "public-daily-card";
const REFERENCE_DATE_KEY = "2024-01-01";
const DECK_SIZE = tarotCards.length;

type DrawHistoryItem = {
  cardId: string;
  fechaLocal: string;
  orientation: CardOrientation;
};

export type PublicDailyCardSnapshot = {
  id: string;
  cardId: string;
  orientation: CardOrientation;
  fechaLocal: string;
  isRevealed: true;
  mensajeDia: string;
  preguntaReflexion: string;
  timezone: string;
  history: DrawHistoryItem[];
};

function createPRNG(seedString: string) {
  let h = 2166136261 >>> 0;
  for (let index = 0; index < seedString.length; index += 1) {
    h = Math.imul(h ^ seedString.charCodeAt(index), 16777619);
  }

  return function next() {
    let t = (h += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithSeed<T>(items: T[], seed: string): T[] {
  const rng = createPRNG(seed);
  const pool = [...items];

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }

  return pool;
}

function buildUtcDateFromKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, (month || 1) - 1, day || 1, 12, 0, 0));
}

function formatUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shiftDateKey(dateKey: string, deltaDays: number): string {
  const date = buildUtcDateFromKey(dateKey);
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return formatUtcDateKey(date);
}

function getCycleDrawForDate(timezone: string, fechaLocal: string): DrawHistoryItem {
  const currentDate = buildUtcDateFromKey(fechaLocal);
  const referenceDate = buildUtcDateFromKey(REFERENCE_DATE_KEY);
  const dayOffset = Math.floor((currentDate.getTime() - referenceDate.getTime()) / 86_400_000);
  const normalizedIndex = ((dayOffset % DECK_SIZE) + DECK_SIZE) % DECK_SIZE;
  const cycleNumber = Math.floor(dayOffset / DECK_SIZE);
  const orderedDeck = shuffleWithSeed(tarotCards, `daily-card-cycle:${timezone}:${cycleNumber}`);
  const selectedCard = orderedDeck[normalizedIndex];
  const orientationSeed = `daily-card-orientation:${timezone}:${fechaLocal}:${selectedCard.id}`;
  const orientation =
    createPRNG(orientationSeed)() >= 0.5 ? CardOrientation.UPRIGHT : CardOrientation.REVERSED;

  return {
    cardId: selectedCard.id,
    fechaLocal,
    orientation,
  };
}

function getOppositeOrientation(orientation: CardOrientation): CardOrientation {
  return orientation === CardOrientation.UPRIGHT ? CardOrientation.REVERSED : CardOrientation.UPRIGHT;
}

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "P2002");
}

export function normalizeTimezone(timezone?: string | null): string {
  if (!timezone) {
    return DEFAULT_TIMEZONE;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return timezone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

export function getDateKey(date: Date = new Date(), timezone?: string | null): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: normalizeTimezone(timezone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatDateKeyForDisplay(dateKey: string, locale = "es-PE"): string {
  const date = buildUtcDateFromKey(dateKey);
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function getPublicDailyCard(timezone?: string | null): PublicDailyCardSnapshot {
  const resolvedTimezone = normalizeTimezone(timezone);
  const fechaLocal = getDateKey(new Date(), resolvedTimezone);
  const currentDraw = getCycleDrawForDate(resolvedTimezone, fechaLocal);
  const { mensajeDia, preguntaReflexion } = getDailyCardMessage(currentDraw.cardId, currentDraw.orientation);

  return {
    id: `${PUBLIC_CARD_ID_PREFIX}:${encodeURIComponent(resolvedTimezone)}:${fechaLocal}`,
    cardId: currentDraw.cardId,
    orientation: currentDraw.orientation,
    fechaLocal,
    isRevealed: true,
    mensajeDia,
    preguntaReflexion,
    timezone: resolvedTimezone,
    history: [0, 1, 2].map((offset) => getCycleDrawForDate(resolvedTimezone, shiftDateKey(fechaLocal, -offset))),
  };
}

export async function getOrGenerateDailyCard(userId: string, timezone?: string | null) {
  const resolvedTimezone = normalizeTimezone(timezone);
  const fechaLocal = getDateKey(new Date(), resolvedTimezone);

  let carta = await prisma.cartaDelDia.findUnique({
    where: {
      userId_fechaLocal: {
        userId,
        fechaLocal,
      },
    },
  });

  if (carta) {
    return carta;
  }

  const previousDraws = await prisma.cartaDelDia.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { cardId: true, orientation: true, fechaLocal: true },
  });

  const currentCycleCount = previousDraws.length % DECK_SIZE;
  const usedCardIdsThisCycle = new Set(previousDraws.slice(0, currentCycleCount).map((draw) => draw.cardId));
  const availableCards =
    usedCardIdsThisCycle.size === 0
      ? tarotCards
      : tarotCards.filter((card) => !usedCardIdsThisCycle.has(card.id));

  const selectedCard = availableCards[Math.floor(Math.random() * availableCards.length)];
  const lastDrawOfSameCard = previousDraws.find((draw) => draw.cardId === selectedCard.id);
  const orientation = lastDrawOfSameCard
    ? getOppositeOrientation(lastDrawOfSameCard.orientation)
    : Math.random() >= 0.5
      ? CardOrientation.UPRIGHT
      : CardOrientation.REVERSED;

  const { mensajeDia, preguntaReflexion } = getDailyCardMessage(selectedCard.id, orientation);

  try {
    carta = await prisma.cartaDelDia.create({
      data: {
        userId,
        fechaLocal,
        cardId: selectedCard.id,
        orientation,
        mensajeDia,
        preguntaReflexion,
      },
    });

    return carta;
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const existingCard = await prisma.cartaDelDia.findUnique({
      where: {
        userId_fechaLocal: {
          userId,
          fechaLocal,
        },
      },
    });

    if (!existingCard) {
      throw error;
    }

    return existingCard;
  }
}
