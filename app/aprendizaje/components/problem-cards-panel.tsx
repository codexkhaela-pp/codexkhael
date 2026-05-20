import styles from "@/app/aprendizaje/aprendizaje.module.css";
import { RetryFailedButton } from "@/app/aprendizaje/components/retry-failed-button";

type ProblemCard = {
  cardId: string;
  cardName: string;
  orientation: "UPRIGHT" | "REVERSED";
  orientationLabel: string;
  incorrectCount: number;
  currentIncorrectStreak: number;
  weight: number;
};

type ProblemCardsPanelProps = {
  cards: ProblemCard[];
};

export function ProblemCardsPanel({ cards }: ProblemCardsPanelProps) {
  const retryPairs = cards.map((card) => ({ cardId: card.cardId, orientation: card.orientation }));

  return (
    <section className={styles.surface}>
      <div className={styles.surfaceHeader}>
        <h2 className={styles.surfaceTitle}>Cartas problemáticas del día</h2>
      </div>

      {cards.length === 0 ? (
        <p className={styles.emptyState}>No se detectaron cartas problemáticas hoy.</p>
      ) : (
        <>
          <div className={styles.progressList}>
            {cards.map((card) => (
              <article key={`${card.cardId}-${card.orientation}`} className={styles.progressItem}>
                <div>
                  <p className={styles.progressName}>{card.cardName}</p>
                  <p className={styles.progressMeta}>
                    {card.orientationLabel} • errores: {card.incorrectCount} • racha: {card.currentIncorrectStreak}
                  </p>
                </div>
                <span className={styles.badge}>peso {card.weight.toFixed(2)}</span>
              </article>
            ))}
          </div>

          <div style={{ marginTop: "12px" }}>
            <RetryFailedButton
              customPairs={retryPairs}
              label="Practicar estas"
            />
          </div>
        </>
      )}
    </section>
  );
}
