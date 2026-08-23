import styles from "@/app/desafios/desafios.module.css";
import type { ChallengeAttemptPayload, UserProgressData } from "@/app/desafios/components/types";

type ChallengeResultSummaryProps = {
  attempt: ChallengeAttemptPayload;
  progress: UserProgressData | null;
};

export function ChallengeResultSummary({ attempt, progress }: ChallengeResultSummaryProps) {
  return (
    <div className={styles.resultMetricsGrid}>
      <div className={styles.resultMetricCard}>
        <div className={styles.resultMetricIcon} aria-hidden="true">◎</div>
        <div className={styles.resultMetricContent}>
          <p className={styles.resultMetricLabel}>Score</p>
          <p className={styles.resultMetricValue}>{attempt.score.toFixed(2)}%</p>
        </div>
      </div>
      <div className={styles.resultMetricCard}>
        <div className={styles.resultMetricIcon} aria-hidden="true">✓<span style={{ fontSize: "12px", marginLeft: "2px" }}>✕</span></div>
        <div className={styles.resultMetricContent}>
          <p className={styles.resultMetricLabel}>Correctas / Incorrectas</p>
          <p className={styles.resultMetricValue}>
            {attempt.correctCount} / {attempt.incorrectCount}
          </p>
        </div>
      </div>
      <div className={styles.resultMetricCard}>
        <div className={styles.resultMetricIcon} aria-hidden="true">✧</div>
        <div className={styles.resultMetricContent}>
          <p className={styles.resultMetricLabel}>XP ganado</p>
          <p className={`${styles.resultMetricValue} ${styles.resultMetricValueGold}`}>{attempt.earnedXp} XP</p>
        </div>
      </div>
      <div className={styles.resultMetricCard}>
        <div className={styles.resultMetricIcon} aria-hidden="true">🔥</div>
        <div className={styles.resultMetricContent}>
          <p className={styles.resultMetricLabel}>Racha actual</p>
          <p className={styles.resultMetricValue}>
            {progress?.currentStreak ?? 0} {progress?.currentStreak === 1 ? 'día' : 'días'}
          </p>
        </div>
      </div>
      <div className={styles.resultMetricCard}>
        <div className={styles.resultMetricIcon} aria-hidden="true">📊</div>
        <div className={styles.resultMetricContent}>
          <p className={styles.resultMetricLabel}>Nivel actual</p>
          <p className={styles.resultMetricValue}>{progress?.currentLevel ?? 1}</p>
        </div>
      </div>
      <div className={styles.resultMetricCard}>
        <div className={styles.resultMetricIcon} aria-hidden="true">○</div>
        <div className={styles.resultMetricContent}>
          <p className={styles.resultMetricLabel}>Progreso al siguiente nivel</p>
          <p className={styles.resultMetricValue}>{progress?.xpProgressPercent.toFixed(2) ?? "0.00"}%</p>
          {(progress?.xpProgressPercent !== undefined) && (
            <div className={styles.resultMetricProgressBar}>
               <div className={styles.resultMetricProgressFill} style={{ width: `${Math.min(100, Math.max(0, progress.xpProgressPercent))}%` }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
