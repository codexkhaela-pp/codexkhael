import styles from "@/app/desafios/desafios.module.css";
import type { ChallengeAttemptPayload } from "@/app/desafios/components/types";
import { cardIdToLabel } from "@/app/desafios/components/challenge-mappers";

type ChallengeAnswersReviewProps = {
  attempt: ChallengeAttemptPayload;
};

export function ChallengeAnswersReview({ attempt }: ChallengeAnswersReviewProps) {
  const answerByQuestion = new Map(attempt.answers.map((answer) => [answer.questionId, answer]));

  return (
    <section className={styles.resultReview}>
      <h2 className={styles.sectionTitle}>Revisión pedagógica</h2>

      <div className={styles.reviewList}>
        {attempt.challenge.questions.map((question) => {
          const answer = answerByQuestion.get(question.id);
          const statusClass = answer?.isCorrect ? styles.reviewOk : styles.reviewError;
          const cardsLabel = question.cardsJson
            .map((card) => `${cardIdToLabel(card.cardId)} (${card.orientation === "UPRIGHT" ? "Derecho" : "Invertida"})`)
            .join(" · ");

          return (
            <article key={question.id} className={`${styles.reviewItem} ${statusClass}`}>
              <div className={styles.reviewHeader}>
                <span className={styles.badge}>Pregunta {question.order}</span>
                <span className={styles.badge}>{answer?.isCorrect ? "Correcta" : "Incorrecta"}</span>
              </div>
              <p className={styles.reviewQuestion}>{question.questionText}</p>
              <p className={styles.reviewMeta}>Cartas: {cardsLabel}</p>
              <p className={styles.reviewMeta}>Tu respuesta: {answer?.selectedAnswer ?? "-"}</p>
              <p className={styles.reviewMeta}>Respuesta correcta: {question.correctAnswer}</p>
              <p className={styles.reviewExplanation}>{question.explanation}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
