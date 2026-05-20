import styles from "./dashboard-top-header.module.css";

type DashboardTopHeaderProps = {
  avatarSrc?: string;
};

export function DashboardTopHeader({ avatarSrc = "/assets/avatar/mago1.png" }: DashboardTopHeaderProps) {
  return (
    <header className={styles.topHeader}>
      <button className={styles.menuToggleBtn} type="button" aria-label="Menú">
        ☰
      </button>

      <div className={styles.headerRight}>
        <button className={styles.headerIcon} type="button" aria-label="Buscar">
          🔍
        </button>
        <button className={styles.headerIcon} type="button" aria-label="Notificaciones">
          🔔
          <span className={styles.notifBadge}>3</span>
        </button>
        <div className={styles.userMiniAvatar}>
          <img src={avatarSrc} alt="Avatar" />
        </div>
      </div>
    </header>
  );
}
