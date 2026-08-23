"use client";

import styles from "@/app/aprendizaje/aprendizaje.module.css";

type FeedbackData = {
  status: "correct" | "incorrect";
  title: string;
  message: string;
  cardName: string;
  cardImage: string | null;
  orientationLabel: string;
  orientation: "UPRIGHT" | "REVERSED";
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

  const isCorrect = feedback.status === "correct";
  const titleClass = isCorrect ? styles.feedbackStatusTitleCorrect : styles.feedbackStatusTitleIncorrect;
  const labelClass = isCorrect ? styles.feedbackRowLabelCorrect : styles.feedbackRowLabelIncorrect;

  return (
    <div className={styles.feedbackOverlayPremium} role="presentation">
      <section className={styles.feedbackModalPremium} role="dialog" aria-modal="true" aria-labelledby="feedback-title">
        {/* PANEL IZQUIERDO: CARTA */}
        <div className={styles.feedbackLeft}>
          <div className={styles.feedbackCardWrap}>
            {feedback.cardImage ? (
              <img
                src={feedback.cardImage}
                alt={feedback.cardName}
                className={styles.feedbackCardImage}
                style={feedback.orientation === "REVERSED" ? { transform: "rotate(180deg)" } : undefined}
              />
            ) : null}
          </div>
          <h2 className={styles.feedbackLeftName}>{feedback.cardName}</h2>
          <div className={styles.feedbackLeftOrientation}>
            {feedback.orientationLabel}
            <span
              className={`${styles.orientationDot} ${feedback.orientation === "UPRIGHT" ? styles.dotUpright : styles.dotReversed}`}
            />
          </div>
        </div>

        {/* PANEL DERECHO: RESULTADO */}
        <div className={styles.feedbackRight}>
          <header className={styles.feedbackHeader}>
            <span className={isCorrect ? styles.feedbackIconCorrect : styles.feedbackIconIncorrect} aria-hidden="true">
              {isCorrect ? "✓" : "✕"}
            </span>
            <h3 id="feedback-title" className={`${styles.feedbackStatusTitle} ${titleClass}`}>
              {isCorrect ? "Correcto" : "Incorrecto"}
            </h3>
          </header>

          <p className={styles.feedbackMessagePremium}>{feedback.message}</p>

          <div className={styles.feedbackDivider}>✦</div>

          <div className={styles.feedbackMetaChips}>
            <span className={styles.feedbackChip}>{feedback.cardName}</span>
            <span className={styles.feedbackChip}>{feedback.orientationLabel}</span>
          </div>

          <div className={styles.feedbackBox}>
            <div className={styles.feedbackRow}>
              <span className={`${styles.feedbackRowLabel} ${labelClass}`}>
                <span aria-hidden="true">👤</span> Tu respuesta:
              </span>
              <p className={styles.feedbackRowValue}>{feedback.selectedAnswer}</p>
            </div>
            <div className={styles.feedbackRow}>
              <span className={`${styles.feedbackRowLabel} ${styles.feedbackRowLabelCorrect}`}>
                <span aria-hidden="true">🎯</span> Respuesta correcta:
              </span>
              <p className={styles.feedbackRowValue}>{feedback.correctAnswer}</p>
            </div>
            {feedback.meaning ? (
              <div className={styles.feedbackRow}>
                <span className={`${styles.feedbackRowLabel} ${styles.feedbackRowLabelNeutral}`}>
                  <span aria-hidden="true">✦</span> Significado breve:
                </span>
                <p className={styles.feedbackRowValue}>{feedback.meaning}</p>
              </div>
            ) : null}
          </div>

          <div className={styles.feedbackCtaWrap}>
            <button type="button" className={styles.feedbackBtnPrimary} onClick={onContinue}>
              {isFinishing ? "Ver resultados →" : "Continuar →"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
