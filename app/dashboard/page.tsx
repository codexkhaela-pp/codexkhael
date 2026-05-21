import { Cinzel, Inter, Playfair_Display } from "next/font/google";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { resolveLevelByXp } from "@/lib/xp/service";
import styles from "./dashboard.module.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["italic"],
  variable: "--font-italic",
});

const navItems = [
  { label: "Inicio", icon: "??", active: true },
  { label: "Cursos", icon: "??" },
  { label: "Cartas", icon: "??" },
  { label: "Tiradas", icon: "??" },
  { label: "Bitácora", icon: "?" },
  { label: "Repaso", icon: "??" },
  { label: "Desafíos", icon: "??" },
  { label: "Comunidad", icon: "??" },
  { label: "Recursos", icon: "??" },
  { label: "Ajustes", icon: "?" },
];

const practices = [
  { icon: "??", title: "Tirada de la Cruz Celta", sub: "Práctica libre", date: "12 Nov" },
  { icon: "??", title: "Tirada de 3 Cartas", sub: "Amor y Relaciones", date: "10 Nov" },
  { icon: "?", title: "Tirada Si o No", sub: "Pregunta concreta", date: "8 Nov" },
];

const quickActions = [
  { title: "Nueva Tirada", sub: "Aleatoria" },
  { title: "Bitácora", sub: "Registrar día" },
  { title: "Mis Cursos", sub: "Continuar" },
  { title: "Repaso", sub: "Memoria" },
];

export const metadata = {
  title: "Panel | Codex Khael",
  description: "Dashboard Codex Khael",
};

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  const [profile, userRow] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { userId: currentUser.id },
      select: {
        displayName: true,
        totalXp: true,
        currentLevel: true,
        level: true,
        currentStreak: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { name: true, email: true },
    }),
  ]);

  const totalXp = profile?.totalXp ?? 0;
  const levelConfig = await resolveLevelByXp(totalXp);
  const currentLevel = profile?.currentLevel ?? profile?.level ?? levelConfig.level;
  const currentStreak = profile?.currentStreak ?? 0;
  const displayName = profile?.displayName?.trim() || userRow?.name?.trim() || userRow?.email?.split("@")[0] || "CodexKhael.app";

  const currentRangeXp = levelConfig.requiredTotalXp;
  const nextRangeXp = levelConfig.nextLevelRequiredXp;
  const progressPercent =
    nextRangeXp > currentRangeXp
      ? Math.round((Math.max(0, totalXp - currentRangeXp) / Math.max(1, nextRangeXp - currentRangeXp)) * 100)
      : 100;

  return (
    <div className={`${styles.dashboardViewport} ${cinzel.variable} ${inter.variable} ${playfair.variable}`}>
      <aside className={styles.sidebar}>
        <div>
          <div className={styles.logoArea}>
            <div className={styles.logoSymbol}>K</div>
            <div className={styles.logoText}>
              <h1>CODEX KHAEL</h1>
              <span>Tarotista</span>
            </div>
          </div>

          <ul className={styles.navLinks}>
            {navItems.map((item) => (
              <li key={item.label} className={item.active ? styles.active : ""}>
                <a href="#">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.sidebarFooterCard}>
          <p>"El tarot no predice el futuro, ilumina el camino para que tomes mejores decisiones hoy."</p>
        </div>
      </aside>

      <div className={styles.contentContainer}>
        <header className={styles.topHeader}>
          <button className={styles.menuToggleBtn} type="button">?</button>
          <div className={styles.headerRight}>
            <button className={styles.headerIcon} type="button">??</button>
            <button className={styles.headerIcon} type="button">
              ??
              <span className={styles.notifBadge}>3</span>
            </button>
            <div className={styles.userMiniAvatar}>??</div>
          </div>
        </header>

        <main className={styles.mainArea}>
          <section className={styles.welcomeBanner}>
            <div className={styles.userProfile}>
              <div className={styles.avatarContainer}>
                <div className={styles.avatarImg}>??</div>
                  <div className={styles.levelBadge}>NIVEL {currentLevel}</div>
              </div>

              <div className={styles.welcomeText}>
                <h2>Bienvenida de nuevo,</h2>
                <h1>{displayName}</h1>
                <p>Sigue tu camino. Cada carta es una enseñanza.</p>
              </div>
            </div>

            <div className={styles.mysticMoonSvg} aria-hidden="true">
              <svg width="60" height="60" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#c5a880" strokeWidth="1" strokeDasharray="2 3" opacity="0.3" />
                <path d="M40,20 A30,30 0 1,0 80,60 A26,26 0 1,1 40,20 Z" fill="#c5a880" opacity="0.8" />
                <circle cx="50" cy="15" r="1.5" fill="#e5c9a3" />
                <circle cx="85" cy="50" r="1.5" fill="#e5c9a3" />
                <circle cx="15" cy="50" r="1.5" fill="#e5c9a3" />
              </svg>
            </div>

            <div className={styles.streakCard}>
              <span>Racha de Aprendizaje</span>
              <div className={styles.streakNumber}>
                <i className={styles.streakFire}>??</i>
                {currentStreak}
                <span className={styles.streakUnit}>días</span>
              </div>
              <div className={styles.streakProgressContainer}>
                <div className={styles.streakProgressBar} />
              </div>
            </div>
          </section>

          <section className={styles.dashboardGrid}>
            <article className={styles.card}>
              <div className={styles.cardTitle}>?? Mi Progreso</div>
              <div>
                <div className={styles.progressContentWrapper}>
                  <div className={styles.progressTextBlock}>
                    <h3>Nivel actual</h3>
                    <h2>{levelConfig.title}</h2>
                  </div>
                  <div className={styles.circleProgressBox}>
                    <div className={styles.circleVisualRender}>
                      <div className={styles.circleInnerMask}>{progressPercent}%</div>
                    </div>
                  </div>
                </div>

                <div className={styles.horizontalBarDecor}>
                  <div className={styles.horizontalBarFill} />
                </div>

                <div className={styles.statsStrip}>
                  <div className={styles.statNode}><span>Módulos</span><strong>18<span className={styles.statSub}>/28</span></strong></div>
                  <div className={styles.statNode}><span>Lecciones</span><strong>142<span className={styles.statSub}>/250</span></strong></div>
                  <div className={styles.statNode}><span>Cartas</span><strong>46<span className={styles.statSub}>/78</span></strong></div>
                </div>
              </div>
              <button type="button" className={styles.btnActionTrigger}>Ver mi progreso</button>
            </article>

            <article className={styles.card}>
              <div className={styles.cardTitle}>?? Mis Prácticas Recientes</div>
              <div className={styles.practiceItemsStack}>
                {practices.map((practice) => (
                  <div key={practice.title} className={styles.practiceNode}>
                    <div className={styles.practiceLeftGroup}>
                      <div className={styles.miniTarotCardRender}><span className={styles.miniTarotArt}>{practice.icon}</span></div>
                      <div className={styles.nodeDetails}>
                        <h4>{practice.title}</h4>
                        <p>{practice.sub}</p>
                      </div>
                    </div>
                    <div className={styles.nodeDate}>{practice.date}</div>
                  </div>
                ))}
              </div>
              <button type="button" className={styles.btnActionTrigger}>Ver todas mis Prácticas</button>
            </article>

            <article className={styles.card}>
              <div className={styles.cardTitle}>? Mi Bitácora</div>
              <div className={styles.parchmentContainer}>
                <div className={styles.parchmentContent}>
                  <span>Última entrada • 12 Nov</span>
                  <h3>Reflexión Diaria</h3>
                  <p>Hoy conecté profundamente con La Estrella. Me recuerda que después de tiempos difíciles, siempre hay esperanza y guía...</p>
                </div>
                <div className={styles.tarotCardRightMock}>
                  <div className={styles.cardMockTitle}>XVII</div>
                  <div className={styles.cardMockArt}>?</div>
                  <div className={styles.cardMockTitle}>Estrella</div>
                </div>
              </div>
              <button type="button" className={styles.btnActionTrigger}>Ir a mi Bitácora</button>
            </article>
          </section>

          <section className={styles.bottomLayoutGrid}>
            <article className={styles.card}>
              <div className={styles.cardTitle}>?? Cartas para Repasar</div>
              <div className={styles.miniCardsRowFlex}>
                <div className={styles.repasoNodeCard}><div className={styles.repasoCardSymbol}>??</div><span className={styles.statusIndicator}><i className={`${styles.dot} ${styles.dotRed}`} />Mal</span></div>
                <div className={styles.repasoNodeCard}><div className={styles.repasoCardSymbol}>??</div><span className={styles.statusIndicator}><i className={`${styles.dot} ${styles.dotOrange}`} />Ver</span></div>
                <div className={styles.repasoNodeCard}><div className={styles.repasoCardSymbol}>??</div><span className={styles.statusIndicator}><i className={`${styles.dot} ${styles.dotOrange}`} />Ver</span></div>
                <div className={styles.repasoNodeCard}><div className={styles.repasoCardSymbol}>??</div><span className={styles.statusIndicator}><i className={`${styles.dot} ${styles.dotGreen}`} />OK</span></div>
              </div>
              <button type="button" className={styles.btnActionTrigger}>Ver todas las cartas</button>
            </article>

            <article className={styles.card}>
              <div className={styles.cardTitle}>? Accesos Rapidos</div>
              <div className={styles.quickActionsQuad}>
                {quickActions.map((action) => (
                  <div key={action.title} className={styles.actionNode}>
                    <h4>{action.title}</h4>
                    <p>{action.sub}</p>
                  </div>
                ))}
              </div>
              <button type="button" className={styles.btnActionTrigger}>Explorar Atajos</button>
            </article>

            <article className={styles.card}>
              <div className={styles.cardTitle}>? Mi Próximo Desafio</div>
              <div className={styles.challengeContainerBox}>
                <span className={styles.challengeSub}>Desafio Semanal</span>
                <h3>Interpretación Intuitiva</h3>
                <p className={styles.challengeDesc}>Realiza 5 tiradas intuitivas completas y registra tus impresiones.</p>
                <div className={styles.challengeProgressMeta}><span>Progreso</span><span>3 / 5</span></div>
                <div className={styles.challengeBarBg}><div className={styles.challengeBarFill} /></div>
              </div>
              <button type="button" className={styles.btnActionTrigger}>Ver Desafíos</button>
            </article>
          </section>

          <footer className={styles.footerArea}>
            <p><span className={styles.decorativeStar}>?</span>"No necesitas memorizar el tarot, necesitas comprender el lenguaje del alma."<span className={styles.decorativeStar}>?</span></p>
          </footer>
        </main>
      </div>
    </div>
  );
}





