"use client";

import styles from "../cartas.module.css";
import type { TarotCard } from "@/src/data/tarotCards";
import { CartaCard } from "./CartaCard";

type CartasGridProps = {
  cards: TarotCard[];
  onOpen: (card: TarotCard) => void;
};

export function CartasGrid({ cards, onOpen }: CartasGridProps) {
  return (
    <section className={styles.gridSection} aria-label="Listado de cartas">
      {cards.map((card) => (
        <CartaCard key={card.id} card={card} onOpen={onOpen} />
      ))}
    </section>
  );
}
