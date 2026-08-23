import styles from "@/app/desafios/desafios.module.css";

type ChallengeFeedbackProps = {
  visible: boolean;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
};

export function ChallengeFeedback({ visible, isCorrect, correctAnswer, explanation }: ChallengeFeedbackProps) {
  if (!visible) return null;

  return (
    <div className={`${styles.challengePlayFeedbackBlock} ${isCorrect ? styles.challengePlayFeedbackOk : styles.challengePlayFeedbackError}`}>
      <p className={styles.feedbackTitleText}>{isCorrect ? "Correcto" : "Respuesta incorrecta"}</p>
      {!isCorrect ? (
        <p className={styles.feedbackMessageText}>
          Respuesta correcta: <strong>{correctAnswer}</strong>
        </p>
      ) : null}
      <p className={styles.feedbackMessageText}>{explanation}</p>
    </div>
  );
}
