"use client";

import Image from "next/image";
import styles from "../cartas.module.css";
import type { TarotCard } from "@/src/data/tarotCards";
import { getStatusIcon, getStatusLabel, type PracticeStatus } from "@/lib/cartas-study";

type ViewMode = "grid" | "list";

type CartaCardProps = {
  card: TarotCard;
  masteryPercent: number;
  studyStatus: PracticeStatus;
  isFavorite: boolean;
  lastReviewedAt: string | null;
  attempts: number;
  viewMode: ViewMode;
  onOpen: (card: TarotCard) => void;
  onStudy: (card: TarotCard) => void;
  onToggleFavorite: (cardId: string) => void;
};

function toRoman(value?: number): string {
  if (typeof value !== "number") return "-";
  const map: Array<[number, string]> = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];

  let n = value;
  let out = "";
  for (const [num, sym] of map) {
    while (n >= num) {
      out += sym;
      n -= num;
    }
  }
  return out || "-";
}

function getCardCode(card: TarotCard): string {
  if (card.suit === "major") {
    return card.number === 0 ? "0" : toRoman(card.number);
  }

  if (card.rank === "page") return "PJ";
  if (card.rank === "knight") return "CB";
  if (card.rank === "queen") return "RN";
  if (card.rank === "king") return "RY";
  return typeof card.number === "number" ? String(card.number) : "•";
}

function getCardType(card: TarotCard): string {
  if (card.suit === "major") return "Arcano Mayor";
  if (card.suit === "cups") return "Copas";
  if (card.suit === "pentacles") return "Oros";
  if (card.suit === "wands") return "Bastos";
  return "Espadas";
}

function getStatusClassName(studyStatus: PracticeStatus): string {
  if (studyStatus === "learned") return styles.statusLearned;
  if (studyStatus === "review") return styles.statusReview;
  if (studyStatus === "studied") return styles.statusStudied;
  return styles.statusPending;
}

export function CartaCard({
  card,
  masteryPercent,
  studyStatus,
  isFavorite,
  lastReviewedAt,
  attempts,
  viewMode,
  onOpen,
  onStudy,
  onToggleFavorite,
}: CartaCardProps) {
  const statusIcon = getStatusIcon(studyStatus);
  const statusLabel = getStatusLabel(studyStatus);
  const statusClassName = getStatusClassName(studyStatus);

  return (
    <article className={viewMode === "list" ? styles.cartaListCard : styles.cartaCardWrap}>
      <div className={viewMode === "list" ? styles.cartaListShell : styles.cartaCard}>
        <button
          type="button"
          className={styles.favoriteButton}
          aria-label={isFavorite ? `Quitar ${card.nameEs} de favoritas` : `Marcar ${card.nameEs} como favorita`}
          aria-pressed={isFavorite}
          onClick={() => onToggleFavorite(card.id)}
        >
          {isFavorite ? "★" : "☆"}
        </button>

        <button
          type="button"
          className={viewMode === "list" ? styles.cartaListButton : styles.cartaMainButton}
          onClick={() => onOpen(card)}
          aria-label={`Ver detalle de ${card.nameEs}`}
        >
          <span className={styles.cartaCodeBadge}>{getCardCode(card)}</span>

          <div className={viewMode === "list" ? styles.cartaListMedia : styles.cartaImageFrame}>
            <div className={viewMode === "list" ? styles.cartaListImageInner : styles.cartaImageInner}>
              <Image
                src={card.image}
                alt={card.nameEs}
                width={260}
                height={450}
                className={styles.cartaImage}
                sizes="(max-width: 700px) 88vw, (max-width: 1024px) 44vw, (max-width: 1400px) 24vw, 18vw"
              />
            </div>
          </div>

          <div className={viewMode === "list" ? styles.cartaListBody : styles.cartaMeta}>
            <div className={styles.cartaHeading}>
              <h3 className={styles.cartaName}>{card.nameEs}</h3>
              <p className={styles.cartaType}>{getCardType(card)}</p>
            </div>

            <div className={styles.masteryRow}>
              <div className={styles.masteryTrack} aria-hidden="true">
                <div className={styles.masteryFill} style={{ width: `${masteryPercent}%` }} />
              </div>
              <strong className={styles.masteryValue}>{masteryPercent}%</strong>
            </div>

            <div className={styles.cartaFooterMeta}>
              <span className={`${styles.statusPill} ${statusClassName}`}>
                <i aria-hidden="true">{statusIcon}</i>
                {statusLabel}
              </span>
              {viewMode === "list" && lastReviewedAt ? (
                <span className={styles.lastReviewed}>Ultimo repaso: {lastReviewedAt}</span>
              ) : null}
            </div>

            {viewMode === "grid" ? (
              <p className={styles.attemptCount}>
                {attempts > 0 ? `${attempts} practica${attempts === 1 ? "" : "s"}` : "Sin intentos"}
              </p>
            ) : null}
          </div>
        </button>

        <button
          type="button"
          className={styles.studyButton}
          onClick={(event) => {
            event.stopPropagation();
            onStudy(card);
          }}
          aria-label={`Estudiar ${card.nameEs}`}
        >
          Estudiar
        </button>
      </div>
    </article>
  );
}
