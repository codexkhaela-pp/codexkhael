import styles from "@/app/desafios/desafios.module.css";
import type { InterpreterRank } from "@/app/desafios/components/types";

type TopInterpretersPanelProps = {
  interpreters: InterpreterRank[];
  period: "weekly" | "monthly" | "global";
  onChangePeriod: (period: "weekly" | "monthly" | "global") => void;
  loading: boolean;
  error: string | null;
};

export function TopInterpretersPanel({
  interpreters,
  period,
  onChangePeriod,
  loading,
  error,
}: TopInterpretersPanelProps) {
  return (
    <section className={styles.sideCard}>
      <h2 className={styles.sideTitle}>👑 Top intérpretes</h2>

      <div className={styles.rankTabs}>
        <button
          type="button"
          className={`${styles.rankTab} ${period === "weekly" ? styles.rankTabActive : ""}`}
          onClick={() => onChangePeriod("weekly")}
        >
          Semanal
        </button>
        <button
          type="button"
          className={`${styles.rankTab} ${period === "monthly" ? styles.rankTabActive : ""}`}
          onClick={() => onChangePeriod("monthly")}
        >
          Mensual
        </button>
        <button
          type="button"
          className={`${styles.rankTab} ${period === "global" ? styles.rankTabActive : ""}`}
          onClick={() => onChangePeriod("global")}
        >
          General
        </button>
      </div>

      <div className={styles.rankList}>
        {loading ? <p className={styles.loading}>Cargando ranking...</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}
        {!loading && !error && interpreters.length === 0 ? (
          <p className={styles.emptyState}>Aún no hay datos de ranking.</p>
        ) : null}
        {interpreters.map((item) => (
          <article key={item.name} className={styles.rankItem}>
            <span className={styles.rankPosition}>{item.position}</span>
            <img src={item.avatar} alt={item.name} className={styles.rankAvatar} />
            <p className={styles.rankName}>{item.name}</p>
            <strong className={styles.rankXp}>XP {item.xp.toLocaleString("es-PE")}</strong>
          </article>
        ))}
      </div>

      <button type="button" className={styles.tertiaryAction}>
        Ver ranking completo <span aria-hidden="true">→</span>
      </button>
    </section>
  );
}
