import { BackButton } from "@/app/components/back-button";
import styles from "../cartas.module.css";

export function CartasHeader() {
  return (
    <section className={styles.headerSection}>
      <div className={styles.headerTop}>
        <BackButton />
        <p className={styles.kicker}>Biblioteca</p>
      </div>
      <h1 className={styles.title}>Cartas</h1>
      <p className={styles.description}>Explora el mazo local y filtra por nombre, número, código o tipo de mazo.</p>
    </section>
  );
}
