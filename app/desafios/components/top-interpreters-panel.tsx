import styles from "@/app/desafios/desafios-hub.module.css";
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
  const periodLabel = period === "weekly" ? "SEMANAL" : period === "monthly" ? "MENSUAL" : "GENERAL";
  const top3 = interpreters.slice(0, 3);

  return (
    <section className={styles.sideCard}>
      <header className={styles.rankHeader}>
        <h2 className={styles.sideTitle}>♛ RANKING {periodLabel}</h2>
        <div className={styles.rankSelectWrapper}>
          <select 
            value={period} 
            onChange={(e) => onChangePeriod(e.target.value as any)}
            className={styles.rankSelect}
            aria-label="Seleccionar período del ranking"
          >
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
            <option value="global">General</option>
          </select>
          <span aria-hidden="true" className={styles.rankSelectIcon}>→</span>
        </div>
      </header>

      <div className={styles.rankList}>
        {loading ? (
          <div className={styles.rankLoading}>
            <div className={styles.skeletonRow} />
            <div className={styles.skeletonRow} />
            <div className={styles.skeletonRow} />
          </div>
        ) : error ? (
          <div className={styles.rankError}>
            <p>No pudimos cargar el ranking.</p>
          </div>
        ) : top3.length === 0 ? (
          <div className={styles.rankEmpty}>
            <p>Aún no hay datos de ranking.</p>
            <span>Participa en desafíos para aparecer<br/>entre los mejores intérpretes.</span>
          </div>
        ) : (
          top3.map((item) => {
            let positionClass = "";
            if (item.position === 1) positionClass = styles.gold;
            else if (item.position === 2) positionClass = styles.silver;
            else if (item.position === 3) positionClass = styles.bronze;

            return (
              <article key={item.name} className={styles.rankItem}>
                <span className={`${styles.rankPosition} ${positionClass}`}>{item.position}</span>
                <img src={item.avatar || "/default-avatar.png"} alt={item.name} className={styles.rankAvatar} />
                <p className={styles.rankName}>{item.name}</p>
                <strong className={styles.rankXp}>XP {item.xp.toLocaleString("es-PE")}</strong>
              </article>
            );
          })
        )}
      </div>

      {top3.length > 0 && !loading && !error && (
        <button type="button" className={styles.ghostAction}>
          VER RANKING COMPLETO <span aria-hidden="true">→</span>
        </button>
      )}
    </section>
  );
}
