import styles from "@/app/desafios/desafios-hub.module.css";
import type { ChallengeCategory } from "@/app/desafios/components/types";

type ChallengeFiltersProps = {
  activeFilter: ChallengeCategory;
  onFilterChange: (filter: ChallengeCategory) => void;
};

const filterOptions: Array<{ key: ChallengeCategory; label: string }> = [
  { key: "TODOS", label: "Todos" },
  { key: "DIARIOS", label: "Diarios" },
  { key: "GUIADOS", label: "Guiados" },
  { key: "QUE_FALTA", label: "¿Qué falta?" },
  { key: "DETECCION_ERRORES", label: "Detección de errores" },
  { key: "INTERPRETACION_LIBRE", label: "Interpretación libre" },
];

export function ChallengeFilters({ activeFilter, onFilterChange }: ChallengeFiltersProps) {
  return (
    <div className={styles.filtersContainer} role="tablist" aria-label="Filtros de desafíos">
      {filterOptions.map((option) => (
        <button
          key={option.key}
          type="button"
          className={`${styles.filterChip} ${activeFilter === option.key ? styles.filterChipActive : ""}`}
          onClick={() => onFilterChange(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
