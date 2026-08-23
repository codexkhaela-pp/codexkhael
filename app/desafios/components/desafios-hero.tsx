import styles from "@/app/desafios/desafios-hub.module.css";

export function DesafiosHero() {
  return (
    <header className={styles.hero}>
      <h1 className={styles.heroTitle}>Desafíos</h1>
      <p className={styles.heroDescription}>
        Pon a prueba tu interpretación, desarrolla tu intuición y gana recompensas.
      </p>
    </header>
  );
}
