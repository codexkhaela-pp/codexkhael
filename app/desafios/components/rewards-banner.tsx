import styles from "@/app/desafios/desafios.module.css";

export function RewardsBanner() {
  return (
    <section className={styles.rewardsBanner}>
      <div className={styles.rewardsIcon} aria-hidden="true">
        🎁
      </div>
      <div className={styles.rewardsBody}>
        <h2>Completa desafíos y gana recompensas</h2>
        <p>Acumula XP, mantén tu racha y desbloquea insignias exclusivas.</p>
      </div>
      <button type="button" className={styles.tertiaryAction}>
        Ver mis recompensas <span aria-hidden="true">→</span>
      </button>
    </section>
  );
}
