import styles from "@/app/aprendizaje/aprendizaje.module.css";

type LearningDashboardProps = {
  totalLearned: number;
  totalInProgress: number;
  totalHard: number;
};

export function LearningDashboard({ totalLearned, totalInProgress, totalHard }: LearningDashboardProps) {
  return (
    <section className={styles.summaryGrid}>
      <article className={styles.summaryCard}>
        <p className={styles.summaryLabel}>Total cartas aprendidas</p>
        <p className={styles.summaryValue}>{totalLearned}</p>
      </article>
      <article className={styles.summaryCard}>
        <p className={styles.summaryLabel}>Cartas en progreso</p>
        <p className={styles.summaryValue}>{totalInProgress}</p>
      </article>
      <article className={styles.summaryCard}>
        <p className={styles.summaryLabel}>Cartas difíciles</p>
        <p className={styles.summaryValue}>{totalHard}</p>
      </article>
    </section>
  );
}
