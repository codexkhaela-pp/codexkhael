import type { Prisma } from "@/src/generated/prisma/client";
import type { TarotCard } from "@/src/data/tarotCards";

export const LEARNING_MASTERY_STREAK = 10;
export const BASE_REVIEW_WEIGHT = 10;
export const MIN_REVIEW_WEIGHT = 0.75;
export const TEMPORAL_REVIEW_DAYS = 7;

export type QuizMode = "IMAGE_TO_MEANING" | "MEANING_TO_CARD" | "MIXED";
export type QuizQuestionType = "IMAGE_TO_MEANING" | "MEANING_TO_CARD";
export type DeckScope =
  | "FULL_DECK"
  | "MAJOR_ARCANA"
  | "MINOR_ARCANA"
  | "WANDS"
  | "CUPS"
  | "SWORDS"
  | "PENTACLES"
  | "COURT"
  | "CUSTOM";
export type OrientationScope = "UPRIGHT_ONLY" | "REVERSED_ONLY" | "BOTH";
export type CardOrientation = "UPRIGHT" | "REVERSED";

export type CardOrientationSelector = {
  cardId: string;
  orientation: CardOrientation;
};

export type ProgressSnapshot = {
  id?: string;
  userId: string;
  cardId: string;
  orientation: CardOrientation;
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

export type GeneratedQuestion = {
  cardId: string;
  orientation: CardOrientation;
  questionType: QuizQuestionType;
  promptText: string;
  correctAnswer: string;
  optionsJson: Prisma.InputJsonValue;
  order: number;
};

export type CardOrientationPair = {
  card: TarotCard;
  orientation: CardOrientation;
  progress: ProgressSnapshot;
};

function splitKeywords(raw: string): string[] {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function randomInt(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive);
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function daysBetween(from: Date, to: Date): number {
  const diffMs = to.getTime() - from.getTime();
  return diffMs <= 0 ? 0 : diffMs / (1000 * 60 * 60 * 24);
}

export function orientationLabel(orientation: CardOrientation): string {
  return orientation === "UPRIGHT" ? "Al derecho" : "Invertida";
}

export function getScopeLabel(scope: DeckScope): string {
  switch (scope) {
    case "MAJOR_ARCANA":
      return "Arcanos mayores";
    case "MINOR_ARCANA":
      return "Arcanos menores";
    case "WANDS":
      return "Bastos";
    case "CUPS":
      return "Copas";
    case "SWORDS":
      return "Espadas";
    case "PENTACLES":
      return "Oros";
    case "COURT":
      return "Corte";
    case "CUSTOM":
      return "Combinación personalizada";
    case "FULL_DECK":
    default:
      return "Toda la baraja";
  }
}

export function getOrientationScopeLabel(scope: OrientationScope): string {
  switch (scope) {
    case "UPRIGHT_ONLY":
      return "Solo al derecho";
    case "REVERSED_ONLY":
      return "Solo invertidas";
    case "BOTH":
    default:
      return "Ambas";
  }
}

export function getAllowedOrientations(scope: OrientationScope): CardOrientation[] {
  if (scope === "UPRIGHT_ONLY") return ["UPRIGHT"];
  if (scope === "REVERSED_ONLY") return ["REVERSED"];
  return ["UPRIGHT", "REVERSED"];
}

export function filterCardsByScope(cards: TarotCard[], scope: DeckScope, customCardIds: string[] = []): TarotCard[] {
  switch (scope) {
    case "MAJOR_ARCANA":
      return cards.filter((card) => card.arcana === "major");
    case "MINOR_ARCANA":
      return cards.filter((card) => card.arcana === "minor");
    case "WANDS":
      return cards.filter((card) => card.suit === "wands");
    case "CUPS":
      return cards.filter((card) => card.suit === "cups");
    case "SWORDS":
      return cards.filter((card) => card.suit === "swords");
    case "PENTACLES":
      return cards.filter((card) => card.suit === "pentacles");
    case "COURT":
      return cards.filter((card) =>
        card.rank === "page" || card.rank === "knight" || card.rank === "queen" || card.rank === "king",
      );
    case "CUSTOM": {
      const set = new Set(customCardIds);
      return cards.filter((card) => set.has(card.id));
    }
    case "FULL_DECK":
    default:
      return cards;
  }
}

export function buildProgressKey(cardId: string, orientation: CardOrientation): string {
  return `${cardId}::${orientation}`;
}

export function getTemporalReviewBonus(lastSeenAt: Date | null, now: Date = new Date()): number {
  if (!lastSeenAt) return 0;

  const daysSinceLastSeen = daysBetween(lastSeenAt, now);
  if (daysSinceLastSeen <= TEMPORAL_REVIEW_DAYS) {
    return 0;
  }

  return clamp((daysSinceLastSeen - TEMPORAL_REVIEW_DAYS) * 0.8 + 2, 0, 12);
}

export function normalizeProgressWeight(progress: ProgressSnapshot, now: Date = new Date()): number {
  const temporalBonus = getTemporalReviewBonus(progress.lastSeenAt, now);

  const rawWeight =
    BASE_REVIEW_WEIGHT +
    progress.incorrectCount * 2 +
    progress.currentIncorrectStreak * 3 -
    progress.currentCorrectStreak * 1.5 -
    (progress.isMastered ? 10 : 0) +
    temporalBonus;

  return Math.max(MIN_REVIEW_WEIGHT, Math.round(rawWeight * 100) / 100);
}

export function applyAnswerToProgress(
  current: ProgressSnapshot,
  isCorrect: boolean,
  answeredAt: Date = new Date(),
): ProgressSnapshot {
  const next: ProgressSnapshot = { ...current };

  if (isCorrect) {
    next.correctCount += 1;
    next.currentCorrectStreak += 1;
    next.currentIncorrectStreak = 0;
    next.bestCorrectStreak = Math.max(next.bestCorrectStreak, next.currentCorrectStreak);
    next.lastCorrectAt = answeredAt;
  } else {
    next.incorrectCount += 1;
    next.currentIncorrectStreak += 1;
    next.currentCorrectStreak = 0;
    next.lastIncorrectAt = answeredAt;
  }

  next.lastSeenAt = answeredAt;
  next.isMastered = next.currentCorrectStreak >= LEARNING_MASTERY_STREAK;
  next.masteryLevel = clamp(
    Math.round((next.currentCorrectStreak / LEARNING_MASTERY_STREAK) * 100),
    0,
    100,
  );
  next.weight = normalizeProgressWeight(next, answeredAt);

  return next;
}

function createEmptyProgress(userId: string, cardId: string, orientation: CardOrientation): ProgressSnapshot {
  const base: ProgressSnapshot = {
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

  base.weight = normalizeProgressWeight(base);
  return base;
}

export function buildPairPool(params: {
  userId: string;
  cards: TarotCard[];
  orientations: CardOrientation[];
  existingProgress: ProgressSnapshot[];
  selectedPairs?: CardOrientationSelector[];
  now?: Date;
}): CardOrientationPair[] {
  const { userId, cards, orientations, existingProgress, selectedPairs, now = new Date() } = params;
  const map = new Map(existingProgress.map((entry) => [buildProgressKey(entry.cardId, entry.orientation), entry]));
  const cardById = new Map(cards.map((card) => [card.id, card]));

  const pairSource: CardOrientationSelector[] = selectedPairs && selectedPairs.length > 0
    ? selectedPairs
    : cards.flatMap((card) => orientations.map((orientation) => ({ cardId: card.id, orientation })));

  const seenKeys = new Set<string>();
  const pairs: CardOrientationPair[] = [];

  for (const selector of pairSource) {
    const key = buildProgressKey(selector.cardId, selector.orientation);
    if (seenKeys.has(key)) continue;

    const card = cardById.get(selector.cardId);
    if (!card) continue;

    const progress = map.get(key) ?? createEmptyProgress(userId, selector.cardId, selector.orientation);
    seenKeys.add(key);

    pairs.push({
      card,
      orientation: selector.orientation,
      progress: {
        ...progress,
        weight: normalizeProgressWeight(progress, now),
      },
    });
  }

  return pairs;
}

function pickWeightedIndex(pool: CardOrientationPair[]): number {
  const totalWeight = pool.reduce((acc, pair) => acc + pair.progress.weight, 0);
  if (totalWeight <= 0) {
    return randomInt(pool.length);
  }

  let threshold = Math.random() * totalWeight;
  for (let index = 0; index < pool.length; index += 1) {
    threshold -= pool[index]!.progress.weight;
    if (threshold <= 0) {
      return index;
    }
  }

  return pool.length - 1;
}

function getCardMeaning(card: TarotCard, orientation: CardOrientation): string {
  return orientation === "UPRIGHT" ? card.keywordsUpright : card.keywordsReversed;
}

export function getCardMeaningByOrientation(card: TarotCard, orientation: CardOrientation): string {
  return getCardMeaning(card, orientation);
}

function buildUniqueOptions(correctAnswer: string, candidates: string[], minCount: number = 4): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  const pushUnique = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(trimmed);
  };

  pushUnique(correctAnswer);
  for (const candidate of candidates) {
    if (result.length >= minCount) break;
    pushUnique(candidate);
  }

  return result;
}

function buildMeaningQuestion(
  pair: CardOrientationPair,
  allPairs: CardOrientationPair[],
  distractorPairs: CardOrientationPair[],
  order: number,
): GeneratedQuestion {
  const orientation = pair.orientation;
  const correctAnswer = getCardMeaning(pair.card, orientation);
  const sameOrientation = distractorPairs
    .filter((candidate) => candidate.card.id !== pair.card.id && candidate.orientation === orientation)
    .map((candidate) => getCardMeaning(candidate.card, candidate.orientation));

  const fallbackAnyOrientation = distractorPairs
    .filter((candidate) => candidate.card.id !== pair.card.id)
    .map((candidate) => getCardMeaning(candidate.card, candidate.orientation));

  const pool = shuffle([...sameOrientation, ...fallbackAnyOrientation, ...allPairs.map((candidate) => getCardMeaning(candidate.card, candidate.orientation))]);
  const uniqueOptions = buildUniqueOptions(correctAnswer, pool, 4);
  const options = shuffle(uniqueOptions);

  return {
    cardId: pair.card.id,
    orientation,
    questionType: "IMAGE_TO_MEANING",
    promptText: `${pair.card.nameEs} (${orientationLabel(orientation)})`,
    correctAnswer,
    optionsJson: options,
    order,
  };
}

function buildCardQuestion(
  pair: CardOrientationPair,
  allPairs: CardOrientationPair[],
  distractorPairs: CardOrientationPair[],
  order: number,
): GeneratedQuestion {
  const orientation = pair.orientation;
  const keywordList = splitKeywords(getCardMeaning(pair.card, orientation)).join(", ");

  const correctAnswer = pair.card.nameEs;
  const pool = shuffle([
    ...distractorPairs
      .filter((candidate) => candidate.card.id !== pair.card.id)
      .map((candidate) => candidate.card.nameEs),
    ...allPairs.map((candidate) => candidate.card.nameEs),
  ]);
  const uniqueOptions = buildUniqueOptions(correctAnswer, pool, 4);
  const options = shuffle(uniqueOptions);

  return {
    cardId: pair.card.id,
    orientation,
    questionType: "MEANING_TO_CARD",
    promptText: `¿Qué carta corresponde a: ${keywordList}? (${orientationLabel(orientation)})`,
    correctAnswer,
    optionsJson: options,
    order,
  };
}

export function buildQuizQuestions(params: {
  mode: QuizMode;
  count: number;
  pairPool: CardOrientationPair[];
  distractorPool?: CardOrientationPair[];
}): GeneratedQuestion[] {
  const { mode, count, pairPool, distractorPool } = params;
  if (pairPool.length === 0) {
    return [];
  }
  const effectiveDistractorPool = distractorPool && distractorPool.length > 0 ? distractorPool : pairPool;

  const questions: GeneratedQuestion[] = [];
  let workingPool = [...pairPool];

  for (let i = 0; i < count; i += 1) {
    if (workingPool.length === 0) {
      workingPool = [...pairPool];
    }

    const selectedIndex = pickWeightedIndex(workingPool);
    const pair = workingPool[selectedIndex]!;
    workingPool.splice(selectedIndex, 1);

    const questionType: QuizQuestionType =
      mode === "MIXED" ? (Math.random() > 0.5 ? "IMAGE_TO_MEANING" : "MEANING_TO_CARD") : mode;

    if (questionType === "IMAGE_TO_MEANING") {
      questions.push(buildMeaningQuestion(pair, pairPool, effectiveDistractorPool, i + 1));
    } else {
      questions.push(buildCardQuestion(pair, pairPool, effectiveDistractorPool, i + 1));
    }
  }

  return questions;
}

export function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export function parseCustomPairs(value: unknown): CardOrientationSelector[] {
  if (!Array.isArray(value)) return [];

  const parsed: CardOrientationSelector[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;

    const cardId = typeof (item as { cardId?: unknown }).cardId === "string" ? (item as { cardId: string }).cardId.trim() : "";
    const orientationRaw = (item as { orientation?: unknown }).orientation;
    const orientation = orientationRaw === "UPRIGHT" || orientationRaw === "REVERSED" ? orientationRaw : null;

    if (!cardId || !orientation) continue;
    parsed.push({ cardId, orientation });
  }

  return parsed;
}
