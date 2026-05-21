import styles from "@/app/desafios/desafios.module.css";

export function DesafiosHero() {
  return (
    <header className={styles.hero}>
      <div className={styles.heroIcon} aria-hidden="true">
        🏆
      </div>
      <div>
        <h1 className={styles.heroTitle}>Desafíos</h1>
        <p className={styles.heroDescription}>
          Pon a prueba tu interpretación, desarrolla tu intuición y gana recompensas.
        </p>
      </div>
    </header>
  );
}
