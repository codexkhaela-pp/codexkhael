import styles from "@/app/desafios/desafios.module.css";
import type { ChallengeAttemptPayload } from "@/app/desafios/components/types";
import { cardIdToLabel, cardIdToImage, cleanQuestionText } from "@/app/desafios/components/challenge-mappers";

type ChallengeAnswersReviewProps = {
  attempt: ChallengeAttemptPayload;
};

export function ChallengeAnswersReview({ attempt }: ChallengeAnswersReviewProps) {
  const answerByQuestion = new Map(attempt.answers.map((answer) => [answer.questionId, answer]));

  return (
    <div className={styles.resultReviewContainer}>
      <div className={styles.resultReviewTitleArea}>
        <h2 className={styles.resultReviewMainTitle}>
          <span aria-hidden="true">✧</span> Revisión Pedagógica
        </h2>
      </div>

      {attempt.challenge.questions.map((question) => {
        const answer = answerByQuestion.get(question.id);
        const isCorrect = answer?.isCorrect ?? false;
        
        const headerClass = isCorrect ? styles.resultReviewQuestionHeaderOk : styles.resultReviewQuestionHeaderError;
        const icon = isCorrect ? "✓" : "✕";
        const statusText = isCorrect ? "CORRECTA" : "INCORRECTA";

        return (
          <div key={question.id} className={styles.resultReviewBody}>
            <div className={styles.resultReviewCardsColumn}>
              <div className={styles.resultReviewCardsList}>
                {question.cardsJson.map((card) => {
                  const isReversed = card.orientation === "REVERSED";
                  return (
                    <article key={`${card.cardId}-${card.orientation}`} className={styles.resultReviewCardItem}>
                      <img
                        src={cardIdToImage(card.cardId)}
                        alt={cardIdToLabel(card.cardId)}
                        className={styles.resultReviewCardImage}
                        style={isReversed ? { transform: "rotate(180deg)" } : undefined}
                      />
                      <h3 className={styles.resultReviewCardName}>{cardIdToLabel(card.cardId)}</h3>
                      <p className={styles.resultReviewCardOrientation}>
                        ({isReversed ? "Invertida" : "Derecho"})
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className={styles.resultReviewContentColumn}>
              <div className={`${styles.resultReviewQuestionHeader} ${headerClass}`}>
                <span aria-hidden="true">{icon}</span> PREGUNTA {question.order} — {statusText}
              </div>

              <h3 className={styles.resultReviewQuestionText}>
                {cleanQuestionText(question.questionText, attempt.challenge.isDaily)}
              </h3>

              <div className={styles.resultReviewComparison}>
                <div className={styles.resultReviewComparisonBlock}>
                  <p className={isCorrect ? styles.resultReviewComparisonLabelOk : styles.resultReviewComparisonLabelError}>Tu respuesta:</p>
                  <p className={styles.resultReviewComparisonText}>{answer?.selectedAnswer ?? "-"}</p>
                </div>
                
                <div className={styles.resultReviewComparisonBlock}>
                  <p className={styles.resultReviewComparisonLabelOk}>Respuesta correcta:</p>
                  <p className={styles.resultReviewComparisonText}>{question.correctAnswer}</p>
                </div>
              </div>

              {question.explanation && (
                <div className={styles.resultReviewExplanationSection}>
                  <h4 className={styles.resultReviewExplanationTitle}>
                    <span aria-hidden="true">✧</span> Explicación:
                  </h4>
                  <p className={styles.resultReviewExplanationText}>
                    {question.explanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
