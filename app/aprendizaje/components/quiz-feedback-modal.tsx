"use client";

import styles from "@/app/aprendizaje/aprendizaje.module.css";

type FeedbackData = {
  status: "correct" | "incorrect";
  title: string;
  message: string;
  cardName: string;
  orientationLabel: string;
  selectedAnswer: string;
  correctAnswer: string;
  meaning: string;
};

type QuizFeedbackModalProps = {
  open: boolean;
  feedback: FeedbackData | null;
  onContinue: () => void;
  isFinishing?: boolean;
};

export function QuizFeedbackModal({ open, feedback, onContinue, isFinishing = false }: QuizFeedbackModalProps) {
  if (!open || !feedback) {
    return null;
  }

  const variantClass = feedback.status === "correct" ? styles.modalCorrect : styles.modalIncorrect;

  return (
    <div className={styles.feedbackOverlay} role="presentation">
      <section className={`${styles.feedbackModal} ${variantClass}`} role="dialog" aria-modal="true">
        <h3 className={styles.feedbackTitle}>{feedback.title}</h3>
        <p className={styles.feedbackMessage}>{feedback.message}</p>

        <div className={styles.feedbackCardMeta}>
          <span className={styles.badge}>{feedback.cardName}</span>
          <span className={styles.badge}>{feedback.orientationLabel}</span>
        </div>

        <div className={styles.feedbackBlock}>
          <p><strong>Tu respuesta:</strong> {feedback.selectedAnswer}</p>
          <p><strong>Respuesta correcta:</strong> {feedback.correctAnswer}</p>
          <p><strong>Significado breve:</strong> {feedback.meaning}</p>
        </div>

        <button type="button" className={styles.primaryButton} onClick={onContinue}>
          {isFinishing ? "Ver resultados" : "Continuar"}
        </button>
      </section>
    </div>
  );
}
