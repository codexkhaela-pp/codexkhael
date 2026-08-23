import styles from "@/app/desafios/desafios-hub.module.css";
import type { UserProgressData } from "@/app/desafios/components/types";

type UserChallengeProgressPanelProps = {
  progress: UserProgressData | null;
  loading: boolean;
  error: string | null;
};

export function UserChallengeProgressPanel({ progress, loading, error }: UserChallengeProgressPanelProps) {
  if (loading) {
    return (
      <section className={styles.sideCard}>
        <h2 className={styles.sideTitle}>✦ TU CAMINO</h2>
        <p className={styles.loading}>Cargando progreso...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.sideCard}>
        <h2 className={styles.sideTitle}>✦ TU CAMINO</h2>
        <p className={styles.error}>{error}</p>
      </section>
    );
  }

  if (!progress) {
    return (
      <section className={styles.sideCard}>
        <h2 className={styles.sideTitle}>✦ TU CAMINO</h2>
        <p className={styles.emptyState}>No hay progreso disponible.</p>
      </section>
    );
  }

  const xpDentroNivel = Math.max(0, progress.totalXp - progress.xpCurrentLevel);
  const xpNivelObjetivo = Math.max(0, progress.xpNextLevel - progress.xpCurrentLevel);
  const progressPercent = Math.max(0, Math.min(100, Number(progress.xpProgressPercent) || 0));

  return (
    <section className={styles.sideCard}>
      <h2 className={styles.sideTitle}>✦ TU CAMINO</h2>

      <div className={styles.progressTop}>
        <div
          className={styles.levelRing}
          style={{
            background: `conic-gradient(rgba(215,173,105,0.9) 0% ${progressPercent}%, rgba(215,173,105,0.1) ${progressPercent}% 100%)`,
          }}
        >
          <div className={styles.levelRingInner}>
            <span>NIVEL</span>
            <strong>{progress.currentLevel}</strong>
            <small>{progress.levelTitle.toUpperCase()}</small>
          </div>
        </div>

        <div className={styles.progressMeta}>
          <p className={styles.progressXpText}>
            {progress.totalXp.toLocaleString("es-PE")} <span>XP</span>
          </p>
          <div className={styles.progressBar}>
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <p className={styles.progressTarget}>
            {`${xpDentroNivel} / ${xpNivelObjetivo} XP para el siguiente nivel`}
          </p>
        </div>
      </div>

      <div className={styles.progressStats}>
        <article className={styles.progressStatItem}>
          <span aria-hidden="true">🔥</span>
          <p>RACHA ACTUAL</p>
          <strong>{progress.currentStreak} {progress.currentStreak === 1 ? 'día' : 'días'}</strong>
        </article>
        
        <div className={styles.statDivider} />
        
        <article className={styles.progressStatItem}>
          <span aria-hidden="true">↗</span>
          <p>MEJOR RACHA</p>
          <strong>{progress.bestStreak} {progress.bestStreak === 1 ? 'día' : 'días'}</strong>
        </article>
        
        <div className={styles.statDivider} />
        
        <article className={styles.progressStatItem}>
          <span aria-hidden="true">🏅</span>
          <p>DESAFÍOS COMPLETADOS</p>
          <strong>-</strong>
        </article>
      </div>
    </section>
  );
}
