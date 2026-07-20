"use client";

import type { TarotCard } from "@/src/data/tarotCards";
import { tarotCards } from "@/src/data/tarotCards";

export type PracticeScope = "amor" | "trabajo" | "dinero" | "salud" | "viajes" | "espiritual";
export type PracticeOrientation = "derecho" | "invertido";
export type PracticeFilterStatus = "pending" | "review" | "learned";
export type PracticeStatus = PracticeFilterStatus | "studied";
export type PracticeQuestionType =
  | "UPRIGHT_MEANING"
  | "REVERSED_MEANING"
  | "SCOPE_READING"
  | "CARD_COMBINATION"
  | "COMBINATION_CONTRIBUTION";

export type PracticeQuestion = {
  id: string;
  questionType: PracticeQuestionType;
  prompt: string;
  options: string[];
  correctAnswer: string;
  scope?: PracticeScope;
  orientation?: PracticeOrientation;
  pairedCardId?: string;
  pairedCardName?: string;
};

export type PracticeQuestionResult = {
  questionId: string;
  questionType: PracticeQuestionType;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  scope?: PracticeScope;
  orientation?: PracticeOrientation;
  pairedCardId?: string;
};

export type PracticeAttempt = {
  attemptId: string;
  completedAt: string;
  correctAnswers: number;
  totalQuestions: number;
  scorePercent: number;
  masteryPercent: number;
  studyStatus: PracticeStatus;
  quizDetails: PracticeQuestionResult[];
};

export type CardPracticeProgress = {
  userId: string;
  cardId: string;
  attempts: number;
  correctAnswers: number;
  totalQuestions: number;
  scorePercent: number;
  masteryPercent: number;
  studyStatus: PracticeStatus;
  lastStudiedAt: string | null;
  lastReviewedAt: string | null;
  quizDetails: PracticeQuestionResult[];
  history: PracticeAttempt[];
};

type PracticeStore = {
  version: 1;
  favorites: string[];
  progress: Record<string, CardPracticeProgress>;
};

type PracticeCombination = {
  withCardName: string;
  meaning: string;
};

type PracticeCatalogCard = {
  id: string;
  practiceId: string;
  slug: string;
  name: string;
  image: string;
  keywords: Record<PracticeOrientation, string>;
  summaries: Record<PracticeOrientation, string>;
  contributions: Record<PracticeOrientation, string>;
  scopes: Record<PracticeScope, Partial<Record<PracticeOrientation, string>>>;
  combinations: PracticeCombination[];
};

type PracticeCatalog = {
  cards: PracticeCatalogCard[];
  byCardId: Map<string, PracticeCatalogCard>;
  byName: Map<string, PracticeCatalogCard>;
};

type RawModalCard = {
  id?: string;
  nombre?: string;
  keywords?: Partial<Record<PracticeOrientation, string[]>>;
  resumen?: {
    derecho?: string;
    invertido?: string;
    energia_general?: Partial<Record<PracticeOrientation, string>>;
    frase_corta?: Partial<Record<PracticeOrientation, string>>;
  };
  ambitos?: Partial<
    Record<
      PracticeScope,
      Partial<
        Record<
          PracticeOrientation,
          {
            general?: string;
            detalle?: string;
            consejo?: string;
          }
        >
      >
    >
  >;
  ambitos_base?: RawModalCard["ambitos"];
  profundidad_pro?: {
    psicologia_profunda?: Partial<Record<PracticeOrientation, string>>;
    combinaciones?: Array<{ con?: string; significado?: string }>;
  };
};

const STORAGE_PREFIX = "codex-khael:cartas-study";
const PRACTICE_SCOPES: PracticeScope[] = ["amor", "trabajo", "dinero", "salud", "viajes", "espiritual"];
const STUDY_SYNC_NOTE =
  "Frontend fallback persisted in localStorage until a dedicated backend endpoint is wired for /cartas practice.";

let catalogPromise: Promise<PracticeCatalog> | null = null;

function createEmptyStore(): PracticeStore {
  return {
    version: 1,
    favorites: [],
    progress: {},
  };
}

function createAttemptId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `attempt-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
}

function buildStorageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`;
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[randomIndex]] = [next[randomIndex]!, next[index]!];
  }
  return next;
}

function firstNonEmpty(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "";
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function capitalizeText(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

const MINOR_CARD_REFERENCE_PATTERN =
  /\b(?:As|Dos|Tres|Cuatro|Cinco|Seis|Siete|Ocho|Nueve|Diez|Sota|Caballero|Reina|Rey)\s+de\s+(?:Bastos|Copas|Espadas|Oros)\b/gu;
const SUIT_REFERENCE_PATTERN = /\bde\s+(?:Bastos|Copas|Espadas|Oros)\b/gu;

function sanitizeOptionSource(value: string): string {
  return value
    .replace(MINOR_CARD_REFERENCE_PATTERN, "esta carta")
    .replace(SUIT_REFERENCE_PATTERN, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractOptionHeadline(value: string): string {
  const text = sanitizeOptionSource(value);
  if (!text) return "";

  const patterns = [
    /\bse expresa como\s+(.+?)(?:\.|$)/i,
    /\baparece como\s+(.+?)(?:\.|$)/i,
    /\bactiva\s+(.+?)(?:\.|$)/i,
    /\badvierte sobre\s+(.+?)(?:\.|$)/i,
    /\binvita a\s+(.+?)(?:\.|$)/i,
    /\bfavorece\s+(.+?)(?:\.|$)/i,
    /\bconviene\s+(.+?)(?:\.|$)/i,
    /\bseñala\s+(.+?)(?:\.|$)/i,
    /\brefleja\s+(.+?)(?:\.|$)/i,
    /\bexpresa\s+(.+?)(?:\.|$)/i,
    /\bpropone\s+(.+?)(?:\.|$)/i,
    /\bmuestra\s+(.+?)(?:\.|$)/i,
    /\bpide\s+(.+?)(?:\.|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;

    const headline = capitalizeText(match[1].replace(/[,:;]+$/g, "").trim());
    if (headline) {
      return headline.endsWith(".") ? headline : `${headline}.`;
    }
  }

  const firstSentence = text.split(/(?<=[.!?])\s+/u)[0] ?? text;
  const cleanedSentence = firstSentence
    .replace(/^En [^,]+,\s*/i, "")
    .replace(/^(?:esta carta|la carta)\s+/i, "")
    .trim();

  if (!cleanedSentence) {
    return capitalizeText(text);
  }

  const headline = capitalizeText(cleanedSentence.replace(/[,:;]+$/g, "").trim());
  return /[.!?]$/.test(headline) ? headline : `${headline}.`;
}

function buildUniqueOptions(correctAnswer: string, candidates: string[]): string[] {
  const options: string[] = [];
  const seen = new Set<string>();

  const add = (value: string) => {
    const normalizedValue = value.trim();
    if (!normalizedValue) return;
    const key = normalizeText(normalizedValue);
    if (seen.has(key)) return;
    seen.add(key);
    options.push(normalizedValue);
  };

  add(correctAnswer);
  for (const candidate of candidates) {
    add(candidate);
    if (options.length >= 4) break;
  }

  return options;
}

function classifyStatus(masteryPercent: number): PracticeStatus {
  if (masteryPercent >= 80) return "learned";
  if (masteryPercent >= 50) return "review";
  if (masteryPercent > 0) return "studied";
  return "pending";
}

export function getFilterStatus(masteryPercent: number): PracticeFilterStatus {
  if (masteryPercent >= 80) return "learned";
  if (masteryPercent > 0) return "review";
  return "pending";
}

export function getStatusLabel(status: PracticeStatus): string {
  if (status === "learned") return "Aprendida";
  if (status === "review") return "Repaso";
  if (status === "studied") return "Estudiada";
  return "Pendiente";
}

export function getStatusIcon(status: PracticeStatus): string {
  if (status === "learned") return "◉";
  if (status === "review") return "✦";
  if (status === "studied") return "◌";
  return "○";
}

export function loadPracticeStore(userId: string): PracticeStore {
  if (typeof window === "undefined") {
    return createEmptyStore();
  }

  try {
    const raw = window.localStorage.getItem(buildStorageKey(userId));
    if (!raw) return createEmptyStore();

    const parsed = JSON.parse(raw) as Partial<PracticeStore>;
    return {
      version: 1,
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites.filter((value) => typeof value === "string") : [],
      progress: typeof parsed.progress === "object" && parsed.progress ? (parsed.progress as PracticeStore["progress"]) : {},
    };
  } catch {
    return createEmptyStore();
  }
}

export function savePracticeStore(userId: string, store: PracticeStore) {
  if (typeof window === "undefined") return;

  const payload = {
    ...store,
    note: STUDY_SYNC_NOTE,
  };
  window.localStorage.setItem(buildStorageKey(userId), JSON.stringify(payload));
}

export function toggleFavorite(store: PracticeStore, cardId: string): PracticeStore {
  const favorites = new Set(store.favorites);
  if (favorites.has(cardId)) favorites.delete(cardId);
  else favorites.add(cardId);

  return {
    ...store,
    favorites: [...favorites],
  };
}

export function getCardProgress(store: PracticeStore, userId: string, cardId: string): CardPracticeProgress {
  return (
    store.progress[cardId] ?? {
      userId,
      cardId,
      attempts: 0,
      correctAnswers: 0,
      totalQuestions: 0,
      scorePercent: 0,
      masteryPercent: 0,
      studyStatus: "pending",
      lastStudiedAt: null,
      lastReviewedAt: null,
      quizDetails: [],
      history: [],
    }
  );
}

export function recordPracticeAttempt(
  store: PracticeStore,
  userId: string,
  cardId: string,
  quizDetails: PracticeQuestionResult[],
): PracticeStore {
  const current = getCardProgress(store, userId, cardId);
  const correctAnswers = quizDetails.filter((detail) => detail.isCorrect).length;
  const totalQuestions = quizDetails.length;
  const scorePercent = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const completedAt = new Date().toISOString();

  const history = [
    ...current.history,
    {
      attemptId: createAttemptId(),
      completedAt,
      correctAnswers,
      totalQuestions,
      scorePercent,
      masteryPercent: current.masteryPercent,
      studyStatus: current.studyStatus,
      quizDetails,
    },
  ];

  const lastFiveHistory = history.slice(-5);
  const masteryPercent =
    lastFiveHistory.length > 0
      ? Math.round(lastFiveHistory.reduce((sum, attempt) => sum + attempt.scorePercent, 0) / lastFiveHistory.length)
      : 0;
  const studyStatus = classifyStatus(masteryPercent);

  const updatedHistory = history.map((attempt, index) =>
    index === history.length - 1
      ? {
          ...attempt,
          masteryPercent,
          studyStatus,
        }
      : attempt,
  );

  return {
    ...store,
    progress: {
      ...store.progress,
      [cardId]: {
        userId,
        cardId,
        attempts: current.attempts + 1,
        correctAnswers: current.correctAnswers + correctAnswers,
        totalQuestions: current.totalQuestions + totalQuestions,
        scorePercent,
        masteryPercent,
        studyStatus,
        lastStudiedAt: completedAt,
        lastReviewedAt: completedAt,
        quizDetails,
        history: updatedHistory,
      },
    },
  };
}

function buildPracticeCardRecord(visualCard: TarotCard, rawCard: RawModalCard): PracticeCatalogCard {
  const keywordsUpright = firstNonEmpty(
    rawCard.keywords?.derecho?.join(", "),
    visualCard.keywordsUpright,
  );
  const keywordsReversed = firstNonEmpty(
    rawCard.keywords?.invertido?.join(", "),
    visualCard.keywordsReversed,
  );

  const summaries: Record<PracticeOrientation, string> = {
    derecho: firstNonEmpty(
      rawCard.resumen?.energia_general?.derecho,
      rawCard.resumen?.frase_corta?.derecho,
      rawCard.resumen?.derecho,
      keywordsUpright,
    ),
    invertido: firstNonEmpty(
      rawCard.resumen?.energia_general?.invertido,
      rawCard.resumen?.frase_corta?.invertido,
      rawCard.resumen?.invertido,
      keywordsReversed,
    ),
  };

  const contributions: Record<PracticeOrientation, string> = {
    derecho: firstNonEmpty(
      rawCard.resumen?.energia_general?.derecho,
      rawCard.profundidad_pro?.psicologia_profunda?.derecho,
      rawCard.resumen?.derecho,
      keywordsUpright,
    ),
    invertido: firstNonEmpty(
      rawCard.resumen?.energia_general?.invertido,
      rawCard.profundidad_pro?.psicologia_profunda?.invertido,
      rawCard.resumen?.invertido,
      keywordsReversed,
    ),
  };

  const scopes = PRACTICE_SCOPES.reduce((acc, scope) => {
    const ambito = rawCard.ambitos?.[scope];
    const ambitoBase = rawCard.ambitos_base?.[scope];

    acc[scope] = {
      derecho: firstNonEmpty(
        ambito?.derecho?.detalle,
        ambito?.derecho?.general,
        ambito?.derecho?.consejo,
        ambitoBase?.derecho?.detalle,
        ambitoBase?.derecho?.general,
        ambitoBase?.derecho?.consejo,
      ),
      invertido: firstNonEmpty(
        ambito?.invertido?.detalle,
        ambito?.invertido?.general,
        ambito?.invertido?.consejo,
        ambitoBase?.invertido?.detalle,
        ambitoBase?.invertido?.general,
        ambitoBase?.invertido?.consejo,
      ),
    };

    return acc;
  }, {} as Record<PracticeScope, Partial<Record<PracticeOrientation, string>>>);

  return {
    id: visualCard.id,
    practiceId: rawCard.id ?? visualCard.slug.replace(/_/g, "-"),
    slug: visualCard.slug,
    name: firstNonEmpty(rawCard.nombre, visualCard.nameEs),
    image: visualCard.image,
    keywords: {
      derecho: keywordsUpright,
      invertido: keywordsReversed,
    },
    summaries,
    contributions,
    scopes,
    combinations: (rawCard.profundidad_pro?.combinaciones ?? [])
      .map((item) => ({
        withCardName: firstNonEmpty(item.con),
        meaning: firstNonEmpty(item.significado),
      }))
      .filter((item) => item.withCardName && item.meaning),
  };
}

async function buildPracticeCatalog(): Promise<PracticeCatalog> {
  const [
    majorModule,
    cupsModule,
    pentaclesModule,
    wandsModule,
    swordsModule,
  ] = await Promise.all([
    import("@/src/data/arcanos_mayores_modal_data_PRO_FINAL_v2.json"),
    import("@/src/data/arcanos_menores_copas_modal_data_PRO_FINAL_v1.json"),
    import("@/src/data/arcanos_menores_oros_modal_data_PRO_FINAL_v1.json"),
    import("@/src/data/arcanos_menores_bastos_modal_data_PRO_FINAL_v1.json"),
    import("@/src/data/arcanos_menores_espadas_modal_data_PRO_FINAL_v1.json"),
  ]);

  const rawCards = [
    ...majorModule.default.cartas,
    ...cupsModule.default.cartas,
    ...pentaclesModule.default.cartas,
    ...wandsModule.default.cartas,
    ...swordsModule.default.cartas,
  ] as RawModalCard[];

  const rawByPracticeId = new Map(
    rawCards.map((card) => [firstNonEmpty(card.id), card]),
  );

  const cards = tarotCards
    .map((visualCard) => {
      const practiceId = visualCard.slug.replace(/_/g, "-");
      const rawCard = rawByPracticeId.get(practiceId);
      if (!rawCard) return null;
      return buildPracticeCardRecord(visualCard, rawCard);
    })
    .filter((card): card is PracticeCatalogCard => card !== null);

  return {
    cards,
    byCardId: new Map(cards.map((card) => [card.id, card])),
    byName: new Map(cards.map((card) => [normalizeText(card.name), card])),
  };
}

export async function loadPracticeCatalog(): Promise<PracticeCatalog> {
  if (!catalogPromise) {
    catalogPromise = buildPracticeCatalog();
  }
  return catalogPromise;
}

function buildMeaningOptions(
  currentCard: PracticeCatalogCard,
  catalog: PracticeCatalog,
  orientation: PracticeOrientation,
): string[] {
  const otherOrientation = orientation === "derecho" ? "invertido" : "derecho";
  const distractors = shuffle([
    ...catalog.cards
      .filter((card) => card.id !== currentCard.id)
      .map((card) => card.summaries[orientation]),
    ...catalog.cards
      .filter((card) => card.id !== currentCard.id)
      .map((card) => card.summaries[otherOrientation]),
    currentCard.summaries[otherOrientation],
  ]);

  return buildUniqueOptions(currentCard.summaries[orientation], distractors);
}

function buildScopeOptions(
  currentCard: PracticeCatalogCard,
  catalog: PracticeCatalog,
  scope: PracticeScope,
  orientation: PracticeOrientation,
): string[] {
  const currentMeaning = extractOptionHeadline(currentCard.scopes[scope]?.[orientation] ?? "");
  const oppositeOrientation = orientation === "derecho" ? "invertido" : "derecho";
  const distractors = shuffle([
    ...catalog.cards
      .filter((card) => card.id !== currentCard.id)
      .map((card) => extractOptionHeadline(card.scopes[scope]?.[orientation] ?? ""))
      .filter(Boolean),
    extractOptionHeadline(currentCard.scopes[scope]?.[oppositeOrientation] ?? ""),
    ...PRACTICE_SCOPES.filter((item) => item !== scope)
      .map((item) => extractOptionHeadline(currentCard.scopes[item]?.[orientation] ?? ""))
      .filter(Boolean),
  ]);

  return buildUniqueOptions(currentMeaning, distractors);
}

function findCombinationMeaning(
  currentCard: PracticeCatalogCard,
  pairedCard: PracticeCatalogCard,
  catalog: PracticeCatalog,
): string {
  const direct = currentCard.combinations.find(
    (item) => normalizeText(item.withCardName) === normalizeText(pairedCard.name),
  );
  if (direct?.meaning) return direct.meaning;

  const inverse = pairedCard.combinations.find(
    (item) => normalizeText(item.withCardName) === normalizeText(currentCard.name),
  );
  if (inverse?.meaning) return inverse.meaning;

  const fallbackMatch = catalog.byName.get(normalizeText(pairedCard.name));
  if (!fallbackMatch) return "";
  const fallback = currentCard.combinations.find(
    (item) => normalizeText(item.withCardName) === normalizeText(fallbackMatch.name),
  );
  return fallback?.meaning ?? "";
}

function buildCombinationOptions(
  currentCard: PracticeCatalogCard,
  pairedCard: PracticeCatalogCard,
  catalog: PracticeCatalog,
): string[] {
  const correctMeaning = findCombinationMeaning(currentCard, pairedCard, catalog);
  const distractors = shuffle(
    catalog.cards.flatMap((card) =>
      card.combinations
        .filter(
          (item) =>
            normalizeText(item.meaning) !== normalizeText(correctMeaning) &&
            normalizeText(card.name) !== normalizeText(currentCard.name),
        )
        .map((item) => item.meaning),
    ),
  );
  return buildUniqueOptions(correctMeaning, distractors);
}

function buildContributionOptions(
  currentCard: PracticeCatalogCard,
  catalog: PracticeCatalog,
  orientation: PracticeOrientation,
): string[] {
  const oppositeOrientation = orientation === "derecho" ? "invertido" : "derecho";
  const distractors = shuffle([
    ...catalog.cards
      .filter((card) => card.id !== currentCard.id)
      .map((card) => card.contributions[orientation]),
    currentCard.contributions[oppositeOrientation],
  ]);

  return buildUniqueOptions(currentCard.contributions[orientation], distractors);
}

function buildQuestionId(cardId: string, questionType: PracticeQuestionType, suffix: string) {
  return `${cardId}-${questionType}-${suffix}`;
}

function createScopeQuestion(
  card: PracticeCatalogCard,
  catalog: PracticeCatalog,
  scope: PracticeScope,
  orientation: PracticeOrientation,
  suffix: string,
): PracticeQuestion | null {
  const correctAnswer = extractOptionHeadline(card.scopes[scope]?.[orientation] ?? "");

  return createQuestion({
    card,
    questionType: "SCOPE_READING",
    prompt: `En el ámbito de ${scope}, ¿qué indica ${card.name}?`,
    options: buildScopeOptions(card, catalog, scope, orientation),
    correctAnswer,
    scope,
    orientation,
    suffix,
  });
}

function createQuestion(params: {
  card: PracticeCatalogCard;
  questionType: PracticeQuestionType;
  prompt: string;
  options: string[];
  correctAnswer: string;
  scope?: PracticeScope;
  orientation?: PracticeOrientation;
  pairedCard?: PracticeCatalogCard;
  suffix: string;
}): PracticeQuestion | null {
  const uniqueOptions = shuffle(params.options);
  if (uniqueOptions.length < 3 || !params.correctAnswer.trim()) return null;

  return {
    id: buildQuestionId(params.card.id, params.questionType, params.suffix),
    questionType: params.questionType,
    prompt: params.prompt,
    options: uniqueOptions,
    correctAnswer: params.correctAnswer,
    scope: params.scope,
    orientation: params.orientation,
    pairedCardId: params.pairedCard?.id,
    pairedCardName: params.pairedCard?.name,
  };
}

type BuildQuizParams = {
  cardId: string;
  progressByCard: Record<string, CardPracticeProgress>;
};

export type PracticeQuizPayload = {
  card: PracticeCatalogCard;
  pairedCard: PracticeCatalogCard | null;
  questions: PracticeQuestion[];
};

export async function buildPracticeQuiz(params: BuildQuizParams): Promise<PracticeQuizPayload> {
  const catalog = await loadPracticeCatalog();
  const currentCard = catalog.byCardId.get(params.cardId);

  if (!currentCard) {
    throw new Error("No se encontro la carta seleccionada para practicar.");
  }

  const learnedCandidates = Object.values(params.progressByCard)
    .filter((progress) => progress.cardId !== params.cardId && progress.masteryPercent >= 80)
    .map((progress) => catalog.byCardId.get(progress.cardId))
    .filter((card): card is PracticeCatalogCard => Boolean(card))
    .filter((card) => Boolean(findCombinationMeaning(currentCard, card, catalog)));

  const pairedCard = learnedCandidates.length > 0 ? shuffle(learnedCandidates)[0] ?? null : null;
  const questions: PracticeQuestion[] = [];
  const usedScopes = new Set<PracticeScope>();
  const targetQuestionCount = pairedCard ? 8 : 7;

  const uprightQuestion = createQuestion({
    card: currentCard,
    questionType: "UPRIGHT_MEANING",
    prompt: `¿Cuál representa mejor a ${currentCard.name} al derecho?`,
    options: buildMeaningOptions(currentCard, catalog, "derecho"),
    correctAnswer: currentCard.summaries.derecho,
    orientation: "derecho",
    suffix: "upright",
  });
  if (uprightQuestion) {
    questions.push(uprightQuestion);
  }

  const reversedQuestion = createQuestion({
    card: currentCard,
    questionType: "REVERSED_MEANING",
    prompt: `¿Cuál representa mejor a ${currentCard.name} invertida?`,
    options: buildMeaningOptions(currentCard, catalog, "invertido"),
    correctAnswer: currentCard.summaries.invertido,
    orientation: "invertido",
    suffix: "reversed",
  });
  if (reversedQuestion) {
    questions.push(reversedQuestion);
  }

  const availableScopes = shuffle(
    PRACTICE_SCOPES.filter(
      (scope) =>
        Boolean(currentCard.scopes[scope]?.derecho) || Boolean(currentCard.scopes[scope]?.invertido),
    ),
  );

  const primaryScope = availableScopes[0];
  if (primaryScope) {
    const primaryOrientation: PracticeOrientation =
      Math.random() > 0.5 && currentCard.scopes[primaryScope]?.invertido ? "invertido" : "derecho";
    const primaryQuestion = createQuestion({
      card: currentCard,
      questionType: "SCOPE_READING",
      prompt: `En el ámbito de ${primaryScope}, ¿qué indica ${currentCard.name}?`,
      options: buildScopeOptions(currentCard, catalog, primaryScope, primaryOrientation),
      correctAnswer: extractOptionHeadline(currentCard.scopes[primaryScope]?.[primaryOrientation] ?? ""),
      scope: primaryScope,
      orientation: primaryOrientation,
      suffix: `scope-${primaryScope}`,
    });

    if (primaryQuestion) {
      usedScopes.add(primaryScope);
      questions.push(primaryQuestion);
    }
  }

  if (pairedCard) {
    const combinationMeaning = findCombinationMeaning(currentCard, pairedCard, catalog);
    const combinationQuestion = createQuestion({
      card: currentCard,
      questionType: "CARD_COMBINATION",
      prompt: `¿Cuál es la interpretación más cercana de ${currentCard.name} + ${pairedCard.name}?`,
      options: buildCombinationOptions(currentCard, pairedCard, catalog),
      correctAnswer: combinationMeaning,
      pairedCard,
      suffix: `combo-${pairedCard.id}`,
    });

    if (combinationQuestion) {
      questions.push(combinationQuestion);
    }

    const contributionOrientation: PracticeOrientation =
      Math.random() > 0.5 ? "derecho" : "invertido";
    const contributionQuestion = createQuestion({
      card: currentCard,
      questionType: "COMBINATION_CONTRIBUTION",
      prompt: `En esta combinación, ¿qué aporta ${currentCard.name}?`,
      options: buildContributionOptions(currentCard, catalog, contributionOrientation),
      correctAnswer: currentCard.contributions[contributionOrientation],
      orientation: contributionOrientation,
      pairedCard,
      suffix: `contribution-${pairedCard.id}`,
    });

    if (contributionQuestion) {
      questions.push(contributionQuestion);
    }
  } else {
    const fallbackScope = availableScopes.find((scope) => !usedScopes.has(scope));
    if (fallbackScope) {
      const fallbackOrientation: PracticeOrientation =
        currentCard.scopes[fallbackScope]?.invertido && Math.random() > 0.5 ? "invertido" : "derecho";
      const fallbackQuestion = createQuestion({
        card: currentCard,
        questionType: "SCOPE_READING",
        prompt: `En el ámbito de ${fallbackScope}, ¿qué indica ${currentCard.name}?`,
        options: buildScopeOptions(currentCard, catalog, fallbackScope, fallbackOrientation),
        correctAnswer: extractOptionHeadline(currentCard.scopes[fallbackScope]?.[fallbackOrientation] ?? ""),
        scope: fallbackScope,
        orientation: fallbackOrientation,
        suffix: `scope-extra-${fallbackScope}`,
      });

      if (fallbackQuestion) {
        usedScopes.add(fallbackScope);
        questions.push(fallbackQuestion);
      }
    }
  }

  if (questions.length < 4) {
    for (const scope of availableScopes) {
      if (usedScopes.has(scope)) continue;

      const orientation: PracticeOrientation =
        currentCard.scopes[scope]?.invertido && Math.random() > 0.5 ? "invertido" : "derecho";
      const extraQuestion = createQuestion({
        card: currentCard,
        questionType: "SCOPE_READING",
        prompt: `En el ámbito de ${scope}, ¿qué indica ${currentCard.name}?`,
        options: buildScopeOptions(currentCard, catalog, scope, orientation),
        correctAnswer: extractOptionHeadline(currentCard.scopes[scope]?.[orientation] ?? ""),
        scope,
        orientation,
        suffix: `scope-fill-${scope}`,
      });

      if (extraQuestion) {
        questions.push(extraQuestion);
        usedScopes.add(scope);
      }

      if (questions.length >= 4) break;
    }
  }

  if (questions.length < targetQuestionCount) {
    const usedScopeOrientations = new Set(
      questions
        .filter((question) => question.questionType === "SCOPE_READING" && question.scope && question.orientation)
        .map((question) => `${question.scope}:${question.orientation}`),
    );

    const plannedScopes: Array<{
      scope: PracticeScope;
      orientation: PracticeOrientation;
      suffix: string;
    }> = [];

    for (const scope of availableScopes) {
      const orientations = shuffle(
        (["derecho", "invertido"] as PracticeOrientation[]).filter((orientation) =>
          Boolean(currentCard.scopes[scope]?.[orientation]),
        ),
      );

      for (const orientation of orientations) {
        const key = `${scope}:${orientation}`;
        if (usedScopeOrientations.has(key)) continue;

        plannedScopes.push({
          scope,
          orientation,
          suffix: `scope-extended-${scope}-${orientation}`,
        });
        usedScopeOrientations.add(key);
      }
    }

    for (const plan of plannedScopes) {
      if (questions.length >= targetQuestionCount) break;

      const scopeQuestion = createScopeQuestion(
        currentCard,
        catalog,
        plan.scope,
        plan.orientation,
        plan.suffix,
      );

      if (scopeQuestion) {
        questions.push(scopeQuestion);
      }
    }
  }

  return {
    card: currentCard,
    pairedCard,
    questions: questions.slice(0, targetQuestionCount),
  };
}

export function evaluateQuizResults(
  questions: PracticeQuestion[],
  selectedAnswers: Record<string, string>,
): PracticeQuestionResult[] {
  return questions.map((question) => {
    const selectedAnswer = selectedAnswers[question.id] ?? "";
    const isCorrect = normalizeText(selectedAnswer) === normalizeText(question.correctAnswer);

    return {
      questionId: question.id,
      questionType: question.questionType,
      selectedAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      scope: question.scope,
      orientation: question.orientation,
      pairedCardId: question.pairedCardId,
    };
  });
}
