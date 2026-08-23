import styles from "@/app/desafios/desafios-hub.module.css";

export function HowItWorksPanel() {
  return (
    <section className={styles.sideCard}>
      <div className={styles.howItWorksPanel}>
        <div className={styles.howItWorksIllustration}>
          <img src="/assets/logo/logo-codex.png" alt="Sello de Codex Khael" loading="lazy" />
        </div>
        
        <div className={styles.howItWorksContent}>
          <h2 className={styles.sideTitle}>♜ ¿CÓMO FUNCIONAN LOS DESAFÍOS?</h2>
          
          <div className={styles.infoContent}>
            <div className={styles.infoItem}>
              <span aria-hidden="true">✦</span>
              <p>Resuelve desafíos diarios o de catálogo para ganar XP.</p>
            </div>
            <div className={styles.infoItem}>
              <span aria-hidden="true">✦</span>
              <p>Mejora tu racha resolviendo de forma constante cada día.</p>
            </div>
            <div className={styles.infoItem}>
              <span aria-hidden="true">✦</span>
              <p>Sube de nivel a medida que ganas experiencia en tu camino.</p>
            </div>
            <div className={styles.infoItem}>
              <span aria-hidden="true">✦</span>
              <p>Compite con otros intérpretes en el ranking de la comunidad.</p>
            </div>
          </div>
          
          <button type="button" className={`${styles.ghostAction} ${styles.proximamenteBtn}`} aria-disabled="true">
            PRÓXIMAMENTE
          </button>
        </div>
      </div>
    </section>
  );
}
