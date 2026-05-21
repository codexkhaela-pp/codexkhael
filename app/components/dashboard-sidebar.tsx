import Link from "next/link";
import styles from "./dashboard-sidebar.module.css";

type SidebarItem = {
  key: string;
  label: string;
  href: string;
  icon: string;
};

const SIDEBAR_ITEMS: SidebarItem[] = [
  { key: "inicio", label: "Inicio", href: "/dashboard-preview", icon: "🔮" },
  { key: "cartas", label: "Cartas", href: "/cartas", icon: "🃏" },
  { key: "tiradas", label: "Tiradas", href: "/tiradas", icon: "🗺" },
  { key: "bitacora", label: "Bitácora", href: "/diario", icon: "✍" },
  { key: "repaso", label: "Repaso", href: "/aprendizaje", icon: "🔄" },
  { key: "desafios", label: "Desafíos", href: "/desafios", icon: "🏆" },
];

type DashboardSidebarProps = {
  logoSrc?: string;
  activeKey?: string;
  footerMessage?: string;
  collapsed?: boolean;
};

export function DashboardSidebar({
  logoSrc = "/assets/logo/logo-codex.png",
  activeKey = "inicio",
  footerMessage,
  collapsed = false,
}: DashboardSidebarProps) {
  const sidebarWidth = collapsed ? 86 : 260;

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}
      style={{
        width: `${sidebarWidth}px`,
        minWidth: `${sidebarWidth}px`,
        maxWidth: `${sidebarWidth}px`,
        flexBasis: `${sidebarWidth}px`,
      }}
    >
      <div className={styles.top}>
        <Link href="/dashboard-preview" className={styles.logoArea} aria-label="Ir a inicio">
          <img src={logoSrc} alt="Codex Khael" className={styles.logoImage} />
        </Link>

        <ul className={styles.navLinks}>
          {SIDEBAR_ITEMS.map((item) => (
            <li key={item.key} className={item.key === activeKey ? styles.active : undefined}>
              <Link
                href={item.href}
                className={styles.navLink}
                data-label={item.label}
                aria-label={item.label}
                title={collapsed ? item.label : undefined}
              >
                <span className={styles.navIcon} aria-hidden="true">{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.sidebarFooterCard}>
        <p>
          {footerMessage ??
            '"El tarot no predice el futuro, ilumina el camino para que tomes mejores decisiones hoy."'}
        </p>
      </div>
    </aside>
  );
}
