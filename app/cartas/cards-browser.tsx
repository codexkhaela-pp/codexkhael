"use client";

import { useEffect, useMemo, useState } from "react";
import type { TarotCard, TarotDeck } from "@/src/data/tarotCards";
import { CartasFilters } from "./components/CartasFilters";
import { CartasGrid } from "./components/CartasGrid";
import styles from "./cartas.module.css";
import { TarotCardModal } from "@/components/tarot/TarotCardModal";
import { PracticeQuizModal } from "./components/PracticeQuizModal";
import type {
  CardPracticeProgress,
  PracticeFilterStatus,
  PracticeQuestionResult,
  PracticeStatus,
} from "@/lib/cartas-study";
import {
  getCardProgress,
  getFilterStatus,
  loadPracticeStore,
  recordPracticeAttempt,
  savePracticeStore,
  toggleFavorite,
} from "@/lib/cartas-study";

type CardsBrowserProps = {
  cards: TarotCard[];
  userId: string;
};

type TypeFilter = "all" | TarotCard["suit"];
type StatusFilter = "all" | PracticeFilterStatus | "favorites";
type OrientationFilter = "both" | "upright" | "reversed";
type ViewMode = "grid" | "list";

type ExtendedTarotCard = TarotCard & {
  masteryPercent?: number | null;
  studyStatus?: string | null;
  isFavorite?: boolean | null;
  lastReviewedAt?: string | Date | null;
  orientation?: "upright" | "reversed" | "both" | null;
  studyProgress?:
    | {
        masteryPercent?: number | null;
        status?: string | null;
        isFavorite?: boolean | null;
        lastReviewedAt?: string | Date | null;
      }
    | null;
};

type CardUiMeta = {
  masteryPercent: number;
  studyStatus: PracticeStatus;
  filterStatus: PracticeFilterStatus;
  isFavorite: boolean;
  lastReviewedAt: string | Date | null;
  orientation: "upright" | "reversed" | "both" | null;
  attempts: number;
};

const SUIT_CODE_MAP: Record<TarotCard["suit"], string> = {
  major: "AM",
  pentacles: "AO",
  cups: "AC",
  wands: "AB",
  swords: "AE",
};

const RANK_CODE_MAP: Record<string, NonNullable<TarotCard["rank"]>> = {
  PJ: "page",
  CB: "knight",
  RN: "queen",
  RY: "king",
};

const DECK_LABELS: Record<TarotDeck, string> = {
  "rider-waite": "Rider-Waite",
  marsella: "Marsella",
  egipcio: "Egipcio",
};

const DECK_OPTIONS: Array<{ value: TarotDeck | "all"; label: string }> = [
  { value: "all", label: "Todos los mazos" },
  { value: "rider-waite", label: DECK_LABELS["rider-waite"] },
  { value: "marsella", label: DECK_LABELS.marsella },
  { value: "egipcio", label: DECK_LABELS.egipcio },
];

const TYPE_OPTIONS: Array<{ value: TypeFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "major", label: "Arcanos Mayores" },
  { value: "cups", label: "Copas" },
  { value: "pentacles", label: "Oros" },
  { value: "wands", label: "Bastos" },
  { value: "swords", label: "Espadas" },
];

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "learned", label: "Aprendidas" },
  { value: "pending", label: "Pendientes" },
  { value: "review", label: "Repaso" },
  { value: "favorites", label: "Favoritas" },
];

const ORIENTATION_OPTIONS: Array<{ value: OrientationFilter; label: string }> = [
  { value: "both", label: "Ambas" },
  { value: "upright", label: "Derecho" },
  { value: "reversed", label: "Invertido" },
];

function suitByCode(code: string): TarotCard["suit"] | null {
  const normalized = code.toUpperCase();
  if (normalized === "AM") return "major";
  if (normalized === "AO") return "pentacles";
  if (normalized === "AC") return "cups";
  if (normalized === "AB") return "wands";
  if (normalized === "AE") return "swords";
  return null;
}

function rankByCode(code: string): NonNullable<TarotCard["rank"]> | null {
  return RANK_CODE_MAP[code.toUpperCase()] ?? null;
}

function clampPercent(value: number | null | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeStudyStatus(value: string | null | undefined, masteryPercent: number): PracticeStatus {
  const normalized = (value ?? "").trim().toLowerCase();

  if (
    normalized === "learned" ||
    normalized === "aprendida" ||
    normalized === "aprendido" ||
    normalized === "mastered" ||
    normalized === "dominada" ||
    normalized === "dominado"
  ) {
    return "learned";
  }

  if (normalized === "review" || normalized === "repaso" || normalized === "revisar") {
    return masteryPercent >= 50 ? "review" : masteryPercent > 0 ? "studied" : "pending";
  }

  if (normalized === "studied" || normalized === "estudiada" || normalized === "estudiado") {
    return masteryPercent >= 50 ? "review" : masteryPercent > 0 ? "studied" : "pending";
  }

  if (masteryPercent >= 80) return "learned";
  if (masteryPercent >= 50) return "review";
  if (masteryPercent > 0) return "studied";
  return "pending";
}

function resolveCardMeta(
  card: TarotCard,
  favoriteIds: Set<string>,
  progressByCard: Record<string, CardPracticeProgress>,
  userId: string,
): CardUiMeta {
  const extended = card as ExtendedTarotCard;
  const existingProgress = extended.studyProgress ?? null;
  const localProgress = progressByCard[card.id] ?? getCardProgress({ version: 1, favorites: [], progress: progressByCard }, userId, card.id);
  const hasLocalProgress = localProgress.attempts > 0;

  const masteryPercent = clampPercent(
    hasLocalProgress ? localProgress.masteryPercent : extended.masteryPercent ?? existingProgress?.masteryPercent ?? 0,
  );
  const studyStatus = normalizeStudyStatus(
    hasLocalProgress ? localProgress.studyStatus : extended.studyStatus ?? existingProgress?.status,
    masteryPercent,
  );
  const isFavorite = favoriteIds.has(card.id) || Boolean(extended.isFavorite ?? existingProgress?.isFavorite ?? false);
  const lastReviewedAt = hasLocalProgress
    ? localProgress.lastReviewedAt
    : extended.lastReviewedAt ?? existingProgress?.lastReviewedAt ?? null;
  const orientation = extended.orientation ?? null;

  return {
    masteryPercent,
    studyStatus,
    filterStatus: getFilterStatus(masteryPercent),
    isFavorite,
    lastReviewedAt,
    orientation,
    attempts: localProgress.attempts,
  };
}

function formatDateLabel(value: string | Date | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("es-PE", { day: "numeric", month: "short" });
}

export function CardsBrowser({ cards, userId }: CardsBrowserProps) {
  const [query, setQuery] = useState("");
  const [deck, setDeck] = useState<TarotDeck | "all">("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [orientationFilter, setOrientationFilter] = useState<OrientationFilter>("both");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedCard, setSelectedCard] = useState<TarotCard | null>(null);
  const [practiceCard, setPracticeCard] = useState<TarotCard | null>(null);
  const [practiceStore, setPracticeStore] = useState(() => loadPracticeStore(userId));

  useEffect(() => {
    setPracticeStore(loadPracticeStore(userId));
  }, [userId]);

  const favoriteIds = useMemo(() => new Set(practiceStore.favorites), [practiceStore.favorites]);
  const availableDecks = useMemo(() => new Set(cards.map((card) => card.deck)), [cards]);

  const deckOptions = useMemo(
    () => DECK_OPTIONS.filter((option) => option.value === "all" || availableDecks.has(option.value)),
    [availableDecks],
  );

  const cardsWithMeta = useMemo(
    () =>
      cards.map((card) => {
        const meta = resolveCardMeta(card, favoriteIds, practiceStore.progress, userId);
        return {
          card,
          meta: {
            ...meta,
            lastReviewedAt: formatDateLabel(meta.lastReviewedAt),
          },
        };
      }),
    [cards, favoriteIds, practiceStore.progress, userId],
  );

  const studySummary = useMemo(() => {
    const totalCards = cardsWithMeta.length;
    const majorCards = cardsWithMeta.filter(({ card }) => card.suit === "major").length;
    const minorCards = totalCards - majorCards;
    const learnedCards = cardsWithMeta.filter(({ meta }) => meta.filterStatus === "learned").length;
    const pendingCards = cardsWithMeta.filter(({ meta }) => meta.filterStatus === "pending").length;
    const reviewCards = cardsWithMeta.filter(({ meta }) => meta.filterStatus === "review").length;
    const totalMastery = cardsWithMeta.reduce((sum, { meta }) => sum + meta.masteryPercent, 0);
    const masteryPercent = totalCards > 0 ? Math.round(totalMastery / totalCards) : 0;

    return {
      totalCards,
      majorCards,
      minorCards,
      learnedCards,
      pendingCards,
      reviewCards,
      masteryPercent,
    };
  }, [cardsWithMeta]);

  const filteredCards = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    const upperTokens = tokens.map((token) => token.toUpperCase());

    const suitToken = upperTokens.find((token) => suitByCode(token));
    const rankToken = upperTokens.find((token) => rankByCode(token));
    const suitFromCode = suitToken ? suitByCode(suitToken) : null;
    const rankFromCode = rankToken ? rankByCode(rankToken) : null;

    const rawNumber = tokens.find((token) => /^\d+$/.test(token));
    const numberFromToken = rawNumber ? Number(rawNumber) : null;
    const hasNumberToken = typeof numberFromToken === "number" && Number.isFinite(numberFromToken);

    return cardsWithMeta.filter(({ card, meta }) => {
      if (deck !== "all" && card.deck !== deck) return false;
      if (typeFilter !== "all" && card.suit !== typeFilter) return false;

      if (statusFilter === "favorites" && !meta.isFavorite) return false;
      if (statusFilter !== "all" && statusFilter !== "favorites" && meta.filterStatus !== statusFilter) return false;

      if (orientationFilter !== "both") {
        const currentOrientation = meta.orientation;
        if (currentOrientation && currentOrientation !== "both" && currentOrientation !== orientationFilter) {
          return false;
        }
      }

      if (!normalizedQuery) return true;

      if (suitFromCode && card.suit !== suitFromCode) return false;
      if (rankFromCode && card.rank !== rankFromCode) return false;

      if (suitFromCode || rankFromCode) {
        if (hasNumberToken) return card.number === numberFromToken;
        return true;
      }

      if (hasNumberToken && card.number === numberFromToken) return true;

      const searchArea = [
        card.nameEs,
        card.nameEn,
        card.slug,
        SUIT_CODE_MAP[card.suit],
        card.number ? String(card.number) : "",
        card.rank ?? "",
        card.keywordsUpright,
        card.keywordsReversed,
      ]
        .join(" ")
        .toLowerCase();

      return searchArea.includes(normalizedQuery);
    });
  }, [cardsWithMeta, deck, orientationFilter, query, statusFilter, typeFilter]);

  const handleOpenCard = (card: TarotCard) => {
    setSelectedCard(card);
  };

  const handleOpenPractice = (card: TarotCard) => {
    setPracticeCard(card);
  };

  const handlePracticeComplete = (cardId: string, results: PracticeQuestionResult[]) => {
    setPracticeStore((prev) => {
      const next = recordPracticeAttempt(prev, userId, cardId, results);
      savePracticeStore(userId, next);
      return next;
    });
  };

  const handleToggleFavorite = (cardId: string) => {
    setPracticeStore((prev) => {
      const next = toggleFavorite(prev, cardId);
      savePracticeStore(userId, next);
      return next;
    });
  };

  return (
    <>
      <section className={styles.heroSection} aria-labelledby="cartas-title">
        <div className={styles.heroCopy}>
          <p className={styles.heroKicker}>Biblioteca privada</p>
          <h1 id="cartas-title" className={styles.heroTitle}>Biblioteca del Tarot</h1>
          <div className={styles.heroDivider} aria-hidden="true">
            <i />
            <span>✦</span>
            <i />
          </div>
        </div>
      </section>

      <section className={styles.summaryBar} aria-label="Resumen de estudio">
        <article className={styles.summaryItem}>
          <span className={styles.summaryIcon}>◔</span>
          <div>
            <strong>{studySummary.totalCards}</strong>
            <p>Cartas Totales</p>
          </div>
        </article>
        <article className={styles.summaryItem}>
          <span className={styles.summaryIcon}>✶</span>
          <div>
            <strong>{studySummary.majorCards}</strong>
            <p>Arcanos Mayores</p>
          </div>
        </article>
        <article className={styles.summaryItem}>
          <span className={styles.summaryIcon}>◇</span>
          <div>
            <strong>{studySummary.minorCards}</strong>
            <p>Arcanos Menores</p>
          </div>
        </article>
        <article className={styles.summaryItem}>
          <span className={styles.summaryIcon}>✦</span>
          <div>
            <strong>{studySummary.learnedCards}</strong>
            <p>Aprendidas</p>
          </div>
        </article>
        <article className={styles.summaryItem}>
          <span className={styles.summaryIcon}>⌛</span>
          <div>
            <strong>{studySummary.pendingCards}</strong>
            <p>Pendientes</p>
          </div>
        </article>
        <article className={styles.summaryItem}>
          <span className={styles.summaryIcon}>↺</span>
          <div>
            <strong>{studySummary.reviewCards}</strong>
            <p>En Repaso</p>
          </div>
        </article>
        <article className={`${styles.summaryItem} ${styles.summaryProgress}`}>
          <div className={styles.summaryProgressLabelRow}>
            <p>Dominio General</p>
            <strong>{studySummary.masteryPercent}%</strong>
          </div>
          <div className={styles.summaryProgressTrack} aria-hidden="true">
            <div className={styles.summaryProgressFill} style={{ width: `${studySummary.masteryPercent}%` }} />
          </div>
        </article>
      </section>

      <CartasFilters
        query={query}
        deck={deck}
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        orientationFilter={orientationFilter}
        viewMode={viewMode}
        onQueryChange={setQuery}
        onDeckChange={setDeck}
        onTypeFilterChange={setTypeFilter}
        onStatusFilterChange={setStatusFilter}
        onOrientationFilterChange={setOrientationFilter}
        onViewModeChange={setViewMode}
        options={deckOptions}
        typeOptions={TYPE_OPTIONS}
        statusOptions={STATUS_OPTIONS}
        orientationOptions={ORIENTATION_OPTIONS}
      />

      <div className={styles.resultsBar}>
        <p className={styles.resultsText}>
          {filteredCards.length} carta{filteredCards.length === 1 ? "" : "s"} en esta vista
        </p>
      </div>

      <CartasGrid
        cards={filteredCards}
        viewMode={viewMode}
        onOpen={handleOpenCard}
        onStudy={handleOpenPractice}
        onToggleFavorite={handleToggleFavorite}
      />

      <TarotCardModal
        isOpen={selectedCard !== null}
        onClose={() => setSelectedCard(null)}
        cardId={selectedCard?.slug ?? null}
        imageUrl={selectedCard?.image}
      />

      <PracticeQuizModal
        isOpen={practiceCard !== null}
        card={practiceCard}
        progressByCard={practiceStore.progress}
        onClose={() => setPracticeCard(null)}
        onComplete={handlePracticeComplete}
      />
    </>
  );
}

export type {
  CardUiMeta,
  ExtendedTarotCard,
  OrientationFilter,
  StatusFilter,
  TypeFilter,
  ViewMode,
};
export { formatDateLabel, resolveCardMeta };
