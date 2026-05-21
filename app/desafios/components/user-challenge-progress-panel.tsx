import styles from "@/app/desafios/desafios.module.css";
import type { UserProgressData } from "@/app/desafios/components/types";

type UserChallengeProgressPanelProps = {
  progress: UserProgressData | null;
  loading: boolean;
  error: string | null;
};

export function UserChallengeProgressPanel({ progress, loading, error }: UserChallengeProgressPanelProps) {
  if (loading) {
    return (
      <section className={`${styles.sideCard} ${styles.progressCard}`}>
        <h2 className={styles.sideTitle}>📈 Tu progreso</h2>
        <p className={styles.loading}>Cargando progreso...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className={`${styles.sideCard} ${styles.progressCard}`}>
        <h2 className={styles.sideTitle}>📈 Tu progreso</h2>
        <p className={styles.error}>{error}</p>
      </section>
    );
  }

  if (!progress) {
    return (
      <section className={`${styles.sideCard} ${styles.progressCard}`}>
        <h2 className={styles.sideTitle}>📈 Tu progreso</h2>
        <p className={styles.emptyState}>No hay progreso disponible.</p>
      </section>
    );
  }

  const xpDentroNivel = Math.max(0, progress.totalXp - progress.xpCurrentLevel);
  const xpNivelObjetivo = Math.max(0, progress.xpNextLevel - progress.xpCurrentLevel);
  const progressPercent = Math.max(0, Math.min(100, Number(progress.xpProgressPercent) || 0));

  return (
    <section className={`${styles.sideCard} ${styles.progressCard}`}>
      <h2 className={styles.sideTitle}>📈 Tu progreso</h2>

      <div className={styles.progressTop}>
        <div
          className={styles.levelRing}
          style={{
            background: `conic-gradient(rgba(201,166,107,0.92) 0% ${progressPercent}%, rgba(201,166,107,0.24) ${progressPercent}% 100%)`,
          }}
        >
          <span>Nivel</span>
          <strong>{progress.currentLevel}</strong>
          <small>{progress.levelTitle}</small>
        </div>

        <div className={styles.progressMeta}>
          <p>
            XP actual <strong>{progress.totalXp.toLocaleString("es-PE")}</strong>
          </p>
          <div className={styles.progressBar}>
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <p>
            XP nivel <strong>{`${xpDentroNivel}/${xpNivelObjetivo}`}</strong>
          </p>
        </div>
      </div>

      <div className={styles.progressStats}>
        <article>
          <span>🔥</span>
          <p>Racha actual</p>
          <strong>{progress.currentStreak} días</strong>
        </article>
        <article>
          <span>📈</span>
          <p>Mejor racha</p>
          <strong>{progress.bestStreak} días</strong>
        </article>
        <article>
          <span>🏅</span>
          <p>Nivel actual</p>
          <strong>{progress.currentLevel}</strong>
        </article>
      </div>
    </section>
  );
}
