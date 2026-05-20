import styles from "./dashboard-sidebar.module.css";

type SidebarItem = {
  key: string;
  label: string;
  href: string;
  icon: string;
};

const SIDEBAR_ITEMS: SidebarItem[] = [
  { key: "inicio", label: "Inicio", href: "#", icon: "🔮" },
  { key: "cursos", label: "Cursos", href: "#", icon: "📖" },
  { key: "cartas", label: "Cartas", href: "/cartas", icon: "🃏" },
  { key: "tiradas", label: "Tiradas", href: "/tiradas", icon: "🗺" },
  { key: "bitacora", label: "Bitácora", href: "/diario", icon: "✍" },
  { key: "repaso", label: "Repaso", href: "/aprendizaje", icon: "🔄" },
  { key: "desafios", label: "Desafíos", href: "#", icon: "🏆" },
  { key: "comunidad", label: "Comunidad", href: "#", icon: "👥" },
  { key: "recursos", label: "Recursos", href: "#", icon: "📂" },
  { key: "ajustes", label: "Ajustes", href: "#", icon: "⚙" },
];

type DashboardSidebarProps = {
  logoSrc?: string;
  activeKey?: string;
  footerMessage?: string;
};

export function DashboardSidebar({
  logoSrc = "/assets/logo/logo-codex.png",
  activeKey = "inicio",
  footerMessage,
}: DashboardSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.top}>
        <div className={styles.logoArea}>
          <img src={logoSrc} alt="Codex Khael" className={styles.logoImage} />
        </div>

        <ul className={styles.navLinks}>
          {SIDEBAR_ITEMS.map((item) => (
            <li key={item.key} className={item.key === activeKey ? styles.active : undefined}>
              <a href={item.href} className={styles.navLink}>
                {item.icon} {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.sidebarFooterCard}>
        <p>
          {footerMessage ??
            "\"El tarot no predice el futuro, ilumina el camino para que tomes mejores decisiones hoy.\""}
        </p>
      </div>
    </aside>
  );
}
