import Link from "next/link";
import { redirect } from "next/navigation";
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
    redirect("/login?next=/aprendizaje");
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
    <div style={{ background: "#030509", flex: 1, display: "flex", flexDirection: "column" }}>
      <main className={styles.dashWrapper} style={{ paddingTop: "48px" }}>
        
        {/* CABECERA Y KPIs */}
        <section className={styles.dashTopArea}>
          <div className={styles.dashTitleBlock}>
            <h1 className={styles.dashTitle}>Aprendizaje / Quiz</h1>
            <p className={styles.dashSubtitle}>
              Sistema inteligente por orientación con refuerzo de errores y repaso temporal.
            </p>
          </div>
          
          <div className={styles.dashKpisRow}>
            <article className={styles.dashKpiCard}>
              <div className={styles.dashKpiHeader}>
                <div className={styles.dashKpiIcon} aria-hidden="true">🕮</div>
                <h2 className={styles.dashKpiLabel}>Total cartas aprendidas</h2>
              </div>
              <p className={styles.dashKpiValue}>{masteredCount}</p>
              <p className={styles.dashKpiSub}>+ 12 esta semana</p>
            </article>
            
            <article className={styles.dashKpiCard}>
              <div className={styles.dashKpiHeader}>
                <div className={styles.dashKpiIcon} aria-hidden="true">🎓</div>
                <h2 className={styles.dashKpiLabel}>Total cartas en progreso</h2>
              </div>
              <p className={styles.dashKpiValue}>{inProgressCount}</p>
              <p className={styles.dashKpiSub}>En aprendizaje activo</p>
            </article>
            
            <article className={styles.dashKpiCard}>
              <div className={styles.dashKpiHeader}>
                <div className={styles.dashKpiIcon} aria-hidden="true">⌖</div>
                <h2 className={styles.dashKpiLabel}>Total cartas difíciles</h2>
              </div>
              <p className={styles.dashKpiValue}>{hardCount}</p>
              <p className={styles.dashKpiSub}>Requieren más práctica</p>
            </article>
          </div>
        </section>

        {/* CONTENIDO PRINCIPAL */}
        <section className={styles.dashMainLayout}>
          
          {/* SESIONES RECIENTES */}
          <div className={styles.dashRecentPanel}>
            <header className={styles.dashRecentHeader}>
              <h2 className={styles.dashRecentTitle}>
                <span aria-hidden="true">◷</span> Sesiones recientes
              </h2>
              <div className={styles.dashRecentActions}>
                <span className={styles.dashAvgScore}>Promedio {avgScore}%</span>
                <Link href="/aprendizaje/nuevo" className={styles.dashBtnPrimary}>
                  Nuevo quiz <span aria-hidden="true">✧</span>
                </Link>
              </div>
            </header>

            {sessions.length === 0 ? (
              <p className={styles.dashEmpty}>
                Aún no tienes sesiones registradas. Inicia tu primer quiz para generar progreso por orientación.
              </p>
            ) : (
              <div className={styles.dashTableWrap}>
                <table className={styles.dashTable}>
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
                        <td>
                          {session.finishedAt ? (
                            <><span className={`${styles.dashStatusDot} ${styles.finalizada}`}></span>Finalizada</>
                          ) : (
                            <><span className={`${styles.dashStatusDot} ${styles.activa}`}></span>Activa</>
                          )}
                        </td>
                        <td>
                          <Link
                            href={session.finishedAt ? `/aprendizaje/resultados/${session.id}` : `/aprendizaje/sesion/${session.id}`}
                            className={styles.dashBtnRow}
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

            <div className={styles.dashViewAll}>Ver todas las sesiones ↓</div>
          </div>

          {/* CARTAS PROBLEMÁTICAS */}
          <aside className={styles.dashProblemPanel}>
            <h2 className={styles.dashProblemTitle}>
              <span aria-hidden="true">✦</span> Cartas problemáticas del día
            </h2>
            
            {problemCards.length === 0 ? (
              <p className={styles.dashEmpty}>No hay cartas problemáticas para mostrar.</p>
            ) : (
              <div className={styles.dashProblemList}>
                {problemCards.map((card) => (
                  <article key={`${card.cardId}-${card.orientation}`} className={styles.dashProblemCard}>
                    <div className={styles.dashProblemThumb}>
                      {card.cardImage ? <img src={card.cardImage} alt={card.cardName} /> : null}
                    </div>
                    <div className={styles.dashProblemBody}>
                      <p className={styles.dashProblemName}>{card.cardName}</p>
                      <p className={styles.dashProblemOrientation}>{card.orientationLabel}</p>
                      <p className={styles.dashProblemStats}>
                        Errores: {card.incorrectCount} · Racha actual: {card.currentIncorrectStreak}
                      </p>
                    </div>
                    <span className={styles.dashProblemWeight}>peso {card.weight.toFixed(2)}</span>
                  </article>
                ))}
              </div>
            )}

            <RetryFailedButton
              customPairs={problemCards.map((card) => ({ cardId: card.cardId, orientation: card.orientation }))}
              label="Practicar estas cartas →"
              className={styles.dashProblemActionBtn}
            />
          </aside>

        </section>
      </main>
    </div>
  );
}

