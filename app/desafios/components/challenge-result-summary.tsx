import styles from "@/app/desafios/desafios.module.css";
import type { ChallengeAttemptPayload, UserProgressData } from "@/app/desafios/components/types";

type ChallengeResultSummaryProps = {
  attempt: ChallengeAttemptPayload;
  progress: UserProgressData | null;
};

export function ChallengeResultSummary({ attempt, progress }: ChallengeResultSummaryProps) {
  return (
    <section className={styles.resultSummary}>
      <article className={styles.summaryCard}>
        <p className={styles.summaryLabel}>Score</p>
        <p className={styles.summaryValue}>{attempt.score.toFixed(2)}%</p>
      </article>
      <article className={styles.summaryCard}>
        <p className={styles.summaryLabel}>Correctas / Incorrectas</p>
        <p className={styles.summaryValue}>
          {attempt.correctCount} / {attempt.incorrectCount}
        </p>
      </article>
      <article className={styles.summaryCard}>
        <p className={styles.summaryLabel}>XP ganado</p>
        <p className={styles.summaryValue}>{attempt.earnedXp}</p>
      </article>
      <article className={styles.summaryCard}>
        <p className={styles.summaryLabel}>Racha actual</p>
        <p className={styles.summaryValue}>{progress?.currentStreak ?? 0} días</p>
      </article>
      <article className={styles.summaryCard}>
        <p className={styles.summaryLabel}>Nivel actual</p>
        <p className={styles.summaryValue}>{progress?.currentLevel ?? 1}</p>
      </article>
      <article className={styles.summaryCard}>
        <p className={styles.summaryLabel}>Progreso al siguiente nivel</p>
        <p className={styles.summaryValue}>{progress?.xpProgressPercent.toFixed(2) ?? "0.00"}%</p>
      </article>
    </section>
  );
}
