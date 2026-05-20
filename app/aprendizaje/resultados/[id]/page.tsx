import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
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
    <DashboardShell activeKey="repaso">
      <main className={`app-shell dashboard-preview-bg ${styles.pageMain}`}>
        <DashboardPageHeader
          kicker="Aprendizaje"
          title="Resultados de sesión"
          description="Resumen final, errores detectados y recomendaciones de refuerzo."
        />

        <section className={styles.learningLayout}>
          <section className={styles.leftArea}>
            <section className={styles.topStats}>
              <article className={styles.statCardCompact}>
                <p className={styles.summaryLabel}>Puntaje final</p>
                <p className={styles.statValueCompact}>{session.scorePercent.toFixed(2)}%</p>
                <p className={styles.statSubCompact}>{scoreLabel}</p>
              </article>
              <article className={styles.statCardCompact}>
                <p className={styles.summaryLabel}>Correctas / incorrectas</p>
                <p className={styles.statValueCompact}>
                  {session.totalCorrect}/{session.totalIncorrect}
                </p>
                <p className={styles.statSubCompact}>Total respondidas: {answered.length}</p>
              </article>
              <article className={styles.statCardCompact}>
                <p className={styles.summaryLabel}>Cartas falladas</p>
                <p className={styles.statValueCompact}>{failedQuestions.length}</p>
                <p className={styles.statSubCompact}>Prioridad para reintento</p>
              </article>
            </section>

            <section className={styles.surface}>
              <div className={styles.surfaceHeader}>
                <h2 className={styles.surfaceTitle}>Cartas falladas</h2>
              </div>

              {failedQuestions.length === 0 ? (
                <p className={styles.emptyState}>No hubo fallas en esta sesión.</p>
              ) : (
                <div className={styles.failedCardsGrid}>
                  {failedQuestions.map((question) => (
                    <article key={question.id} className={styles.failedCard}>
                      <div className={styles.failedCardTop}>
                        <span className={styles.badge}>#{question.order}</span>
                        <span className={styles.badge}>{orientationLabel(question.orientation)}</span>
                      </div>
                      <p className={styles.failedCardName}>
                        {cardMap.get(question.cardId)?.nameEs ?? question.cardId}
                      </p>
                      <p className={styles.failedCardMeta}>
                        <strong>Tu respuesta:</strong> {question.selectedAnswer ?? "-"}
                      </p>
                      <p className={styles.failedCardMeta}>
                        <strong>Correcta:</strong> {question.correctAnswer}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className={styles.surface}>
              <div className={styles.surfaceHeader}>
                <h2 className={styles.surfaceTitle}>Detalle de sesión</h2>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
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
                        <td>{question.isCorrect ? "✅ Correcta" : "❌ Incorrecta"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </section>

          <aside className={styles.problemPanel}>
            <h2 className={styles.problemPanelTitle}>Rendimiento por orientación</h2>
            <div className={styles.progressList}>
              <div className={styles.progressItem}>
                <div>
                  <p className={styles.progressName}>Al derecho</p>
                  <p className={styles.progressMeta}>
                    {uprightCorrect} aciertos de {uprightAnswered.length}
                  </p>
                </div>
                <span className={styles.badge}>
                  {uprightAnswered.length > 0 ? `${Math.round((uprightCorrect / uprightAnswered.length) * 100)}%` : "0%"}
                </span>
              </div>
              <div className={styles.progressItem}>
                <div>
                  <p className={styles.progressName}>Invertida</p>
                  <p className={styles.progressMeta}>
                    {reversedCorrect} aciertos de {reversedAnswered.length}
                  </p>
                </div>
                <span className={styles.badge}>
                  {reversedAnswered.length > 0
                    ? `${Math.round((reversedCorrect / reversedAnswered.length) * 100)}%`
                    : "0%"}
                </span>
              </div>
            </div>

            <h2 className={styles.problemPanelTitle}>Cartas de mayor dificultad</h2>
            {difficultProgress.length === 0 ? (
              <p className={styles.emptyState}>Sin cartas difíciles registradas por ahora.</p>
            ) : (
              <div className={styles.problemList}>
                {difficultProgress.map((progress) => {
                  const card = cardMap.get(progress.cardId);
                  return (
                    <article key={progress.id} className={styles.problemItem}>
                      <div className={styles.problemCardThumb}>
                        {card?.image ? <img src={card.image} alt={card.nameEs} /> : null}
                      </div>
                      <div className={styles.problemCardBody}>
                        <p className={styles.problemCardName}>{card?.nameEs ?? progress.cardId}</p>
                        <p className={styles.problemCardMeta}>
                          {orientationLabel(progress.orientation)} • errores: {progress.incorrectCount}
                        </p>
                      </div>
                      <span className={styles.problemWeight}>peso {progress.weight.toFixed(2)}</span>
                    </article>
                  );
                })}
              </div>
            )}

            <div className={styles.problemActionWrap}>
              <RetryFailedButton
                sessionId={session.id}
                customPairs={failedPairs}
                label="⟳ Reintentar falladas"
                className={styles.problemActionButton}
              />
            </div>

            <div className={styles.resultsActions}>
              <Link href="/aprendizaje/nuevo" className={styles.primaryButton}>
                ＋ Nuevo quiz
              </Link>
              <Link href="/aprendizaje" className={styles.secondaryButton}>
                ← Volver al módulo
              </Link>
              {session.finishedAt ? null : (
                <Link href={`/aprendizaje/sesion/${session.id}`} className={styles.ghostButton}>
                  ▶ Continuar sesión
                </Link>
              )}
            </div>
          </aside>
        </section>
      </main>
    </DashboardShell>
  );
}
