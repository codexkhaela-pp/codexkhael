"use client";

import styles from "../cartas.module.css";
import type { TarotDeck } from "@/src/data/tarotCards";

type DeckOption = { value: TarotDeck | "all"; label: string };

type CartasFiltersProps = {
  query: string;
  deck: TarotDeck | "all";
  onQueryChange: (value: string) => void;
  onDeckChange: (value: TarotDeck | "all") => void;
  options: DeckOption[];
};

export function CartasFilters({ query, deck, onQueryChange, onDeckChange, options }: CartasFiltersProps) {
  return (
    <section className={styles.filtersCard} aria-label="Buscador de cartas">
      <div className={styles.fieldGroup}>
        <label htmlFor="cards-search" className={styles.fieldLabel}>Buscar</label>
        <div className={styles.searchField}>
          <input
            id="cards-search"
            type="text"
            className={styles.searchInput}
            placeholder='Ej: "El Loco", "XIV", "10 de KN", "PJ"'
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
          <span className={styles.searchIcon} aria-hidden="true">⌕</span>
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Mazo</label>
        <select
          className={styles.deckSelect}
          value={deck}
          onChange={(event) => onDeckChange(event.target.value as TarotDeck | "all")}
          aria-label="Seleccionar mazo"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
