"use client";

import Image from "next/image";
import styles from "../cartas.module.css";
import type { TarotCard } from "@/src/data/tarotCards";

type CartaCardProps = {
  card: TarotCard;
  onOpen: (card: TarotCard) => void;
};

function toRoman(value?: number): string {
  if (typeof value !== "number") return "—";
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
  return out || "—";
}

function suitGlyph(card: TarotCard): string {
  if (card.suit === "major") return "✦";
  if (card.suit === "cups") return "☾";
  if (card.suit === "wands") return "☀";
  if (card.suit === "swords") return "⚔";
  return "◉";
}

export function CartaCard({ card, onOpen }: CartaCardProps) {
  return (
    <article className={styles.cartaCardWrap}>
      <button
        type="button"
        className={styles.cartaCard}
        onClick={() => onOpen(card)}
        aria-label={`Ver detalle de ${card.nameEs}`}
      >
        <div className={styles.cartaImageFrame}>
          <div className={styles.cartaImageInner}>
            <Image
              src={card.image}
              alt={card.nameEs}
              width={260}
              height={450}
              className={styles.cartaImage}
              sizes="(max-width: 700px) 88vw, (max-width: 1024px) 44vw, (max-width: 1400px) 30vw, 23vw"
            />
          </div>
        </div>

        <div className={styles.cartaMeta}>
          <div className={styles.cartaSubMeta}>
            <span className={styles.cartaTitleLine}>
              <span className={styles.cartaRoman}>{toRoman(card.number)}</span>
              <span className={styles.cartaName}>{card.nameEs}</span>
            </span>
            <span className={styles.cartaGlyph} aria-hidden="true">{suitGlyph(card)}</span>
          </div>
        </div>
      </button>
    </article>
  );
}
