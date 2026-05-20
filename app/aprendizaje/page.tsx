import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { orientationLabel } from "@/lib/aprendizaje/quiz-engine";
import { tarotCards } from "@/src/data/tarotCards";
import { RetryFailedButton } from "@/app/aprendizaje/components/retry-failed-button";
import styles from "@/app/aprendizaje/aprendizaje.module.css";

export const metadata = {
  title: "Aprendizaje | Codex Khael",
  description: "Módulo de quiz por carta y orientación (derecho / invertida).",
};

function modeToEs(value: string): string {
  if (value === "MIXED") return "Mixto";
  if (value === "IMAGE_TO_MEANING") return "Imagen a texto";
  if (value === "MEANING_TO_CARD") return "Texto a carta";
  return value;
}

function scopeToEs(value: string): string {
  if (value === "FULL_DECK") return "Todo el mazo";
  if (value === "MAJOR_ARCANA") return "Arcanos mayores";
  if (value === "MINOR_ARCANA") return "Arcanos menores";
  if (value === "WANDS") return "Bastos";
  if (value === "CUPS") return "Copas";
  if (value === "SWORDS") return "Espadas";
  if (value === "PENTACLES") return "Oros";
  if (value === "COURT") return "Corte";
  if (value === "CUSTOM") return "Personalizado";
  return value;
}

function orientationToEs(value: string): string {
  if (value === "BOTH") return "Ambos";
  if (value === "UPRIGHT_ONLY") return "Solo al derecho";
  if (value === "REVERSED_ONLY") return "Solo invertidas";
  return value;
}

export default async function AprendizajePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const cardMap = new Map(tarotCards.map((card) => [card.id, card]));
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const [sessions, masteredCount, inProgressCount, hardCount, problemTodayRows] = await Promise.all([
    prisma.learningQuizSession.findMany({
      where: { userId: user.id },
      orderBy: { startedAt: "desc" },
      take: 20,
    }),
    prisma.cardLearningProgress.count({
      where: {
        userId: user.id,
        isMastered: true,
      },
    }),
    prisma.cardLearningProgress.count({
      where: {
        userId: user.id,
        isMastered: false,
        OR: [{ correctCount: { gt: 0 } }, { incorrectCount: { gt: 0 } }],
      },
    }),
    prisma.cardLearningProgress.count({
      where: {
        userId: user.id,
        OR: [{ incorrectCount: { gt: 0 } }, { currentIncorrectStreak: { gt: 0 } }],
      },
    }),
    prisma.cardLearningProgress.findMany({
      where: {
        userId: user.id,
        OR: [
          {
            lastIncorrectAt: {
              gte: dayStart,
            },
          },
          {
            currentIncorrectStreak: {
              gt: 0,
            },
          },
        ],
      },
      orderBy: [
        { weight: "desc" },
        { currentIncorrectStreak: "desc" },
        { incorrectCount: "desc" },
      ],
      take: 5,
    }),
  ]);

  const problemCards = problemTodayRows.map((row) => ({
    cardId: row.cardId,
    cardName: cardMap.get(row.cardId)?.nameEs ?? row.cardId,
    cardImage: cardMap.get(row.cardId)?.image ?? null,
    orientation: row.orientation,
    orientationLabel: orientationLabel(row.orientation),
    incorrectCount: row.incorrectCount,
    currentIncorrectStreak: row.currentIncorrectStreak,
    weight: row.weight,
  }));

  const avgScore =
    sessions.length > 0
      ? Math.round(
          (sessions.reduce((acc, session) => acc + session.scorePercent, 0) / sessions.length) * 100,
        ) / 100
      : 0;

  return (
    <DashboardShell activeKey="repaso">
      <main className={`app-shell dashboard-preview-bg ${styles.pageMain}`}>
        <section className={styles.learningLayout}>
          <section className={styles.leftArea}>
            <section className={styles.topStrip}>
              <div className={styles.learningTitleBlock}>
                <h1 className={styles.learningTitle}>Aprendizaje / Quiz</h1>
                <p className={styles.learningSubtitle}>
                  Sistema inteligente por orientación con refuerzo de errores y repaso temporal.
                </p>
              </div>
              <div className={styles.topStats}>
                <article className={styles.statCardCompact}>
                  <p className={styles.summaryLabel}>Total cartas aprendidas</p>
                  <p className={styles.statValueCompact}>{masteredCount}</p>
                  <p className={styles.statSubCompact}>+ 12 esta semana</p>
                </article>
                <article className={styles.statCardCompact}>
                  <p className={styles.summaryLabel}>Total cartas en progreso</p>
                  <p className={styles.statValueCompact}>{inProgressCount}</p>
                  <p className={styles.statSubCompact}>En aprendizaje activo</p>
                </article>
                <article className={styles.statCardCompact}>
                  <p className={styles.summaryLabel}>Total cartas difíciles</p>
                  <p className={styles.statValueCompact}>{hardCount}</p>
                  <p className={styles.statSubCompact}>Requieren más práctica</p>
                </article>
              </div>
            </section>

            <section className={styles.surface}>
              <div className={styles.surfaceHeader}>
                <h2 className={styles.surfaceTitle}>Sesiones recientes</h2>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span className={styles.badge}>Promedio {avgScore}%</span>
                  <Link href="/aprendizaje/nuevo" className={styles.primaryButton}>
                    Nuevo quiz
                  </Link>
                </div>
              </div>

              {sessions.length === 0 ? (
                <p className={styles.emptyState}>
                  Aún no tienes sesiones registradas. Inicia tu primer quiz para generar progreso por orientación.
                </p>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Modo</th>
                        <th>Ámbito</th>
                        <th>Orientación</th>
                        <th>Preguntas</th>
                        <th>Aciertos</th>
                        <th>Errores</th>
                        <th>Puntaje</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((session) => (
                        <tr key={session.id}>
                          <td>{session.startedAt.toLocaleDateString("es-PE")}</td>
                          <td>{modeToEs(session.mode)}</td>
                          <td>{scopeToEs(session.selectedDeckScope)}</td>
                          <td>{orientationToEs(session.orientationScope)}</td>
                          <td>{session.questionCount}</td>
                          <td>{session.totalCorrect}</td>
                          <td>{session.totalIncorrect}</td>
                          <td>{session.scorePercent.toFixed(2)}%</td>
                          <td>{session.finishedAt ? "Finalizada" : "Activa"}</td>
                          <td>
                            <Link
                              href={session.finishedAt ? `/aprendizaje/resultados/${session.id}` : `/aprendizaje/sesion/${session.id}`}
                              className={styles.ghostButton}
                            >
                              {session.finishedAt ? "Ver resultados" : "Continuar"}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className={styles.viewAllSessions}>Ver todas las sesiones ▾</div>
            </section>
          </section>

          <aside className={styles.problemPanel}>
            <h2 className={styles.problemPanelTitle}>Cartas problemáticas del día</h2>
            {problemCards.length === 0 ? (
              <p className={styles.emptyState}>No se detectaron cartas problemáticas hoy.</p>
            ) : (
              <div className={styles.problemList}>
                {problemCards.map((card) => (
                  <article key={`${card.cardId}-${card.orientation}`} className={styles.problemItem}>
                    <div className={styles.problemCardThumb}>
                      {card.cardImage ? <img src={card.cardImage} alt={card.cardName} /> : null}
                    </div>
                    <div className={styles.problemCardBody}>
                      <p className={styles.problemCardName}>
                        {card.cardName}
                      </p>
                      <p className={styles.problemCardName}>
                        {card.orientationLabel}
                      </p>
                      <p className={styles.problemCardMeta}>
                        Errores: {card.incorrectCount} • Racha actual: {card.currentIncorrectStreak}
                      </p>
                    </div>
                    <span className={styles.problemWeight}>peso {card.weight.toFixed(2)}</span>
                  </article>
                ))}
              </div>
            )}

            <div className={styles.problemActionWrap}>
              <RetryFailedButton
                customPairs={problemCards.map((card) => ({ cardId: card.cardId, orientation: card.orientation }))}
                label="Practicar estas cartas"
                className={styles.problemActionButton}
              />
            </div>
          </aside>
        </section>
      </main>
    </DashboardShell>
  );
}
