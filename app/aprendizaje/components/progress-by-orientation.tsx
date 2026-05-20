import styles from "@/app/aprendizaje/aprendizaje.module.css";

type OrientationProgressRow = {
  cardId: string;
  cardName: string;
  uprightPercent: number;
  reversedPercent: number;
  uprightCorrect: number;
  uprightTotal: number;
  reversedCorrect: number;
  reversedTotal: number;
};

type ProgressByOrientationProps = {
  rows: OrientationProgressRow[];
};

export function ProgressByOrientation({ rows }: ProgressByOrientationProps) {
  return (
    <section className={styles.surface}>
      <div className={styles.surfaceHeader}>
        <h2 className={styles.surfaceTitle}>Progreso por orientación</h2>
      </div>

      {rows.length === 0 ? (
        <p className={styles.emptyState}>Aún no hay datos suficientes por orientación.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Carta</th>
                <th>UPRIGHT</th>
                <th>REVERSED</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.cardId}>
                  <td>{row.cardName}</td>
                  <td>
                    {row.uprightPercent}% ({row.uprightCorrect}/{row.uprightTotal})
                  </td>
                  <td>
                    {row.reversedPercent}% ({row.reversedCorrect}/{row.reversedTotal})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
