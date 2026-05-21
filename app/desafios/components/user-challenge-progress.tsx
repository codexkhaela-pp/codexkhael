import styles from "@/app/desafios/desafios.module.css";

export function UserChallengeProgress() {
  return (
    <section className={`${styles.sideCard} ${styles.progressCard}`}>
      <h2 className={styles.sideTitle}>📈 Tu progreso</h2>

      <div className={styles.progressTop}>
        <div className={styles.levelRing}>
          <span>Nivel</span>
          <strong>12</strong>
          <small>Aprendiz</small>
        </div>

        <div className={styles.progressMeta}>
          <p>
            XP actual <strong>1,250</strong>
          </p>
          <div className={styles.progressBar}>
            <span style={{ width: "62%" }} />
          </div>
          <p>
            XP para siguiente nivel <strong>750</strong>
          </p>
        </div>
      </div>

      <div className={styles.progressStats}>
        <article>
          <span>🔥</span>
          <p>Racha actual</p>
          <strong>7 días</strong>
        </article>
        <article>
          <span>🎯</span>
          <p>Desafíos completados</p>
          <strong>28</strong>
        </article>
        <article>
          <span>🏅</span>
          <p>Puntaje promedio</p>
          <strong>85%</strong>
        </article>
      </div>
    </section>
  );
}
