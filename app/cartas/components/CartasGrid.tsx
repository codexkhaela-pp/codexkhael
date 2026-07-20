"use client";

import styles from "../cartas.module.css";
import type { TarotCard } from "@/src/data/tarotCards";
import { CartaCard } from "./CartaCard";
import type { PracticeFilterStatus, PracticeStatus } from "@/lib/cartas-study";

type ViewMode = "grid" | "list";

type CardEntry = {
  card: TarotCard;
  meta: {
    masteryPercent: number;
    studyStatus: PracticeStatus;
    filterStatus: PracticeFilterStatus;
    isFavorite: boolean;
    lastReviewedAt: string | null;
    attempts?: number;
  };
};

type CartasGridProps = {
  cards: CardEntry[];
  viewMode: ViewMode;
  onOpen: (card: TarotCard) => void;
  onStudy: (card: TarotCard) => void;
  onToggleFavorite: (cardId: string) => void;
};

export function CartasGrid({ cards, viewMode, onOpen, onStudy, onToggleFavorite }: CartasGridProps) {
  if (cards.length === 0) {
    return (
      <section className={styles.emptyState} aria-live="polite">
        <h2>No encontramos cartas con esos filtros.</h2>
        <p>Ajusta la búsqueda o cambia el estado para volver a explorar la biblioteca completa.</p>
      </section>
    );
  }

  return (
    <section
      className={viewMode === "list" ? styles.listSection : styles.gridSection}
      aria-label="Listado de cartas"
    >
      {cards.map(({ card, meta }) => (
        <CartaCard
          key={card.id}
          card={card}
          masteryPercent={meta.masteryPercent}
          studyStatus={meta.studyStatus}
          isFavorite={meta.isFavorite}
          lastReviewedAt={meta.lastReviewedAt}
          attempts={meta.attempts ?? 0}
          viewMode={viewMode}
          onOpen={onOpen}
          onStudy={onStudy}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </section>
  );
}
