import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DashboardPageHeader } from "@/app/components/dashboard-page-header";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { orientationLabel } from "@/lib/aprendizaje/quiz-engine";
import { tarotCards } from "@/src/data/tarotCards";
import { RetryFailedButton } from "@/app/aprendizaje/components/retry-failed-button";
import styles from "@/app/aprendizaje/aprendizaje.module.css";

type ResultsPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: "Resultados Quiz | Codex Khael",
  description: "Resumen de resultados de una sesión de aprendizaje.",
};

export default async function AprendizajeResultadosPage({ params }: ResultsPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  const session = await prisma.learningQuizSession.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      questions: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  if (!session) {
    notFound();
  }

  const cardMap = new Map(tarotCards.map((card) => [card.id, card]));

  const answered = session.questions.filter((question) => question.isCorrect !== null);
  const failedQuestions = answered.filter((question) => question.isCorrect === false);
  const uprightAnswered = answered.filter((question) => question.orientation === "UPRIGHT");
  const reversedAnswered = answered.filter((question) => question.orientation === "REVERSED");
  const uprightCorrect = uprightAnswered.filter((question) => question.isCorrect).length;
  const reversedCorrect = reversedAnswered.filter((question) => question.isCorrect).length;

  const failedPairs = failedQuestions.map((question) => ({
    cardId: question.cardId,
    orientation: question.orientation,
  }));

  const difficultProgress = await prisma.cardLearningProgress.findMany({
    where: {
      userId: user.id,
      OR: [
        {
          currentIncorrectStreak: {
            gt: 0,
          },
        },
        {
          incorrectCount: {
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
    take: 8,
  });

  const scoreLabel =
    session.scorePercent >= 90 ? "Excelente precisión" : session.scorePercent >= 75 ? "Buen rendimiento" : "Necesita refuerzo";

  return (
    <div className={styles.activePageWrapper}>
      <main className={styles.resultsWrapper}>
        <header className={styles.activeHeader} style={{ marginBottom: "16px" }}>
          <p className={styles.activeKicker}>Aprendizaje</p>
          <h1 className={styles.activeTitle}>Resultados de sesión</h1>
          <p className={styles.activeSubtitle}>Resumen final, errores detectados y recomendaciones de refuerzo.</p>
        </header>

        <section className={styles.resultsGridMain}>
          {/* COLUMNA IZQUIERDA */}
          <div>
            {/* KPIs */}
            <div className={styles.resultsKpisRow}>
              <article className={styles.resultsKpiCard}>
                <div className={styles.resultsKpiHeader}>
                  <div className={styles.resultsKpiIcon}>◎</div>
                  <h3 className={styles.resultsKpiLabel}>Puntaje final</h3>
                </div>
                <p className={styles.resultsKpiValue}>{session.scorePercent.toFixed(2)}%</p>
                <p className={styles.resultsKpiSub}>{scoreLabel}</p>
              </article>

              <article className={styles.resultsKpiCard}>
                <div className={styles.resultsKpiHeader}>
                  <div className={styles.resultsKpiIcon}>✓</div>
                  <h3 className={styles.resultsKpiLabel}>Correctas / Incorrectas</h3>
                </div>
                <p className={styles.resultsKpiValue}>
                  {session.totalCorrect}/{session.totalIncorrect}
                </p>
                <p className={styles.resultsKpiSub}>Total respondidas: {answered.length}</p>
              </article>

              <article className={styles.resultsKpiCard}>
                <div className={styles.resultsKpiHeader}>
                  <div className={styles.resultsKpiIcon}>✕</div>
                  <h3 className={styles.resultsKpiLabel}>Cartas falladas</h3>
                </div>
                <p className={styles.resultsKpiValue}>{failedQuestions.length}</p>
                {failedQuestions.length > 0 ? (
                  <p className={styles.resultsKpiSubNeutral}>Prioridad para refuerzo</p>
                ) : null}
              </article>
            </div>

            {/* CARTAS FALLADAS GRID */}
            <h2 className={styles.resultsSectionTitle}>✦ Cartas falladas</h2>
            {failedQuestions.length === 0 ? (
              <p className={styles.emptyState}>No hubo fallas en esta sesión.</p>
            ) : (
              <div className={styles.resultsFailedGrid}>
                {failedQuestions.map((question) => (
                  <article key={question.id} className={styles.resultsFailedCard}>
                    <div className={styles.resultsFailedTop}>
                      <span className={styles.resultsFailedNum}>#{question.order}</span>
                      <span className={styles.feedbackChip}>{orientationLabel(question.orientation)}</span>
                    </div>
                    <h3 className={styles.resultsFailedName}>
                      {cardMap.get(question.cardId)?.nameEs ?? question.cardId}
                    </h3>
                    <p className={styles.resultsFailedMeta}>
                      <span className={styles.resultsFailedLabelNeutral}>Tu respuesta:</span> {question.selectedAnswer ?? "-"}
                    </p>
                    <p className={styles.resultsFailedMeta}>
                      <span className={styles.resultsFailedLabelRed}>Correcta:</span> {question.correctAnswer}
                    </p>
                  </article>
                ))}
              </div>
            )}

            {/* DETALLE DE SESION */}
            <h2 className={styles.resultsSectionTitle}>✦ Detalle de sesión</h2>
            <div className={styles.resultsTableWrap}>
              <table className={styles.resultsTable}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Carta</th>
                    <th>Orientación</th>
                    <th>Tu respuesta</th>
                    <th>Correcta</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {answered.map((question) => (
                    <tr key={question.id}>
                      <td>{question.order}</td>
                      <td>{cardMap.get(question.cardId)?.nameEs ?? question.cardId}</td>
                      <td>{orientationLabel(question.orientation)}</td>
                      <td>{question.selectedAnswer ?? "-"}</td>
                      <td>{question.correctAnswer}</td>
                      <td>
                        {question.isCorrect ? (
                          <span className={styles.resultsStatusCorrect}><span aria-hidden="true">✓</span> Correcta</span>
                        ) : (
                          <span className={styles.resultsStatusIncorrect}><span aria-hidden="true">✕</span> Incorrecta</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* COLUMNA DERECHA */}
          <aside className={styles.resultsRightPanel}>
            <div>
              <h2 className={styles.resultsRightTitle}>✦ Rendimiento por orientación</h2>
              <div className={styles.resultsOrientationList}>
                <div className={styles.resultsOrientationItem}>
                  <div className={styles.resultsOrientationTop}>
                    <div>
                      <p className={styles.resultsOrientationName}>Al derecho</p>
                      <p className={styles.resultsOrientationSub}>{uprightCorrect} aciertos de {uprightAnswered.length}</p>
                    </div>
                    <span className={styles.resultsOrientationPct}>
                      {uprightAnswered.length > 0 ? `${Math.round((uprightCorrect / uprightAnswered.length) * 100)}%` : "0%"}
                    </span>
                  </div>
                  <div className={styles.resultsBarTrack}>
                    <div 
                      className={styles.resultsBarFill} 
                      style={{ width: uprightAnswered.length > 0 ? `${(uprightCorrect / uprightAnswered.length) * 100}%` : "0%" }} 
                    />
                  </div>
                </div>

                <div className={styles.resultsOrientationItem}>
                  <div className={styles.resultsOrientationTop}>
                    <div>
                      <p className={styles.resultsOrientationName}>Invertida</p>
                      <p className={styles.resultsOrientationSub}>{reversedCorrect} aciertos de {reversedAnswered.length}</p>
                    </div>
                    <span className={styles.resultsOrientationPct}>
                      {reversedAnswered.length > 0 ? `${Math.round((reversedCorrect / reversedAnswered.length) * 100)}%` : "0%"}
                    </span>
                  </div>
                  <div className={styles.resultsBarTrack}>
                    <div 
                      className={styles.resultsBarFill} 
                      style={{ width: reversedAnswered.length > 0 ? `${(reversedCorrect / reversedAnswered.length) * 100}%` : "0%" }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className={styles.resultsRightTitle}>✦ Cartas de mayor dificultad</h2>
              {difficultProgress.length === 0 ? (
                <p className={styles.emptyState}>Sin cartas difíciles registradas.</p>
              ) : (
                <div className={styles.resultsHardList}>
                  {difficultProgress.map((progress) => {
                    const card = cardMap.get(progress.cardId);
                    return (
                      <article key={progress.id} className={styles.resultsHardItem}>
                        {card?.image ? (
                          <img 
                            src={card.image} 
                            alt={card.nameEs} 
                            className={styles.resultsHardThumb}
                            style={progress.orientation === "REVERSED" ? { transform: "rotate(180deg)" } : undefined}
                          />
                        ) : (
                          <div className={styles.resultsHardThumb} style={{ background: "rgba(215,173,105,.1)" }} />
                        )}
                        <div className={styles.resultsHardBody}>
                          <p className={styles.resultsHardName}>{card?.nameEs ?? progress.cardId}</p>
                          <p className={styles.resultsHardMeta}>
                            {orientationLabel(progress.orientation)} · errores: {progress.incorrectCount}
                          </p>
                        </div>
                        <span className={styles.resultsHardWeight}>peso {progress.weight.toFixed(2)}</span>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={styles.resultsActionsGroup}>
              {failedPairs.length > 0 && (
                <RetryFailedButton
                  sessionId={session.id}
                  customPairs={failedPairs}
                  label="↻ Reintentar falladas"
                  className={styles.resultsBtnGhost}
                />
              )}
              <Link href="/aprendizaje/nuevo" className={styles.resultsBtnPrimary}>
                ＋ Nuevo quiz
              </Link>
              <Link href="/aprendizaje" className={styles.resultsBtnGhost} style={{ border: "none", background: "transparent", opacity: 0.8 }}>
                ← Volver al módulo
              </Link>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

