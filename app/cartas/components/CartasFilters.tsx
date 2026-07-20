"use client";

import styles from "../cartas.module.css";
import type { TarotDeck } from "@/src/data/tarotCards";
import type { OrientationFilter, StatusFilter, TypeFilter, ViewMode } from "../cards-browser";

type DeckOption = { value: TarotDeck | "all"; label: string };
type TypeOption = { value: TypeFilter; label: string };
type StatusOption = { value: StatusFilter; label: string };
type OrientationOption = { value: OrientationFilter; label: string };

type CartasFiltersProps = {
  query: string;
  deck: TarotDeck | "all";
  typeFilter: TypeFilter;
  statusFilter: StatusFilter;
  orientationFilter: OrientationFilter;
  viewMode: ViewMode;
  onQueryChange: (value: string) => void;
  onDeckChange: (value: TarotDeck | "all") => void;
  onTypeFilterChange: (value: TypeFilter) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onOrientationFilterChange: (value: OrientationFilter) => void;
  onViewModeChange: (value: ViewMode) => void;
  options: DeckOption[];
  typeOptions: TypeOption[];
  statusOptions: StatusOption[];
  orientationOptions: OrientationOption[];
};

export function CartasFilters({
  query,
  deck,
  typeFilter,
  statusFilter,
  orientationFilter,
  viewMode,
  onQueryChange,
  onDeckChange,
  onTypeFilterChange,
  onStatusFilterChange,
  onOrientationFilterChange,
  onViewModeChange,
  options,
  typeOptions,
  statusOptions,
  orientationOptions,
}: CartasFiltersProps) {
  return (
    <section className={styles.filtersShell} aria-label="Filtros de cartas">
      <div className={styles.filtersGrid}>
        <div className={`${styles.filterBlock} ${styles.filterBlockWide}`}>
          <label htmlFor="cards-search" className={styles.filterLabel}>Buscar</label>
          <div className={styles.searchField}>
            <input
              id="cards-search"
              type="text"
              className={styles.searchInput}
              placeholder="Buscar por nombre, número o palabra clave..."
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
            />
            <span className={styles.searchIcon} aria-hidden="true">⌕</span>
          </div>
        </div>

        <div className={styles.filterBlock}>
          <label className={styles.filterLabel} htmlFor="cards-deck">Mazo</label>
          <select
            id="cards-deck"
            className={styles.filterSelect}
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

        <div className={styles.filterBlock}>
          <label className={styles.filterLabel} htmlFor="cards-type">Tipo</label>
          <select
            id="cards-type"
            className={styles.filterSelect}
            value={typeFilter}
            onChange={(event) => onTypeFilterChange(event.target.value as TypeFilter)}
            aria-label="Filtrar por tipo"
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={`${styles.filterBlock} ${styles.filterBlockStates}`}>
          <span className={styles.filterLabel}>Estado</span>
          <div className={styles.chipRow} role="tablist" aria-label="Filtrar por estado">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.filterChip} ${statusFilter === option.value ? styles.filterChipActive : ""}`}
                onClick={() => onStatusFilterChange(option.value)}
                aria-pressed={statusFilter === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.filterBlock}>
          <label className={styles.filterLabel} htmlFor="cards-orientation">Orientación</label>
          <select
            id="cards-orientation"
            className={styles.filterSelect}
            value={orientationFilter}
            onChange={(event) => onOrientationFilterChange(event.target.value as OrientationFilter)}
            aria-label="Filtrar por orientación"
          >
            {orientationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterBlock}>
          <span className={styles.filterLabel}>Vista</span>
          <div className={styles.viewToggle} role="tablist" aria-label="Cambiar vista">
            <button
              type="button"
              className={`${styles.viewButton} ${viewMode === "grid" ? styles.viewButtonActive : ""}`}
              onClick={() => onViewModeChange("grid")}
              aria-label="Vista en cuadrícula"
              aria-pressed={viewMode === "grid"}
            >
              ⊞
            </button>
            <button
              type="button"
              className={`${styles.viewButton} ${viewMode === "list" ? styles.viewButtonActive : ""}`}
              onClick={() => onViewModeChange("list")}
              aria-label="Vista en lista"
              aria-pressed={viewMode === "list"}
            >
              ☰
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
