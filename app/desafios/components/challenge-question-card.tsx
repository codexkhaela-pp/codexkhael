import styles from "@/app/desafios/desafios.module.css";
import type { ChallengeQuestion } from "@/app/desafios/components/types";
import { cardIdToImage, cardIdToLabel } from "@/app/desafios/components/challenge-mappers";
import React from "react";

type ChallengeQuestionCardProps = {
  question: ChallengeQuestion;
  selectedOption: string | null;
  onSelectOption: (option: string) => void;
  disabled: boolean;
  actionArea?: React.ReactNode;
  feedbackArea?: React.ReactNode;
};

export function ChallengeQuestionCard({
  question,
  selectedOption,
  onSelectOption,
  disabled,
  actionArea,
  feedbackArea,
}: ChallengeQuestionCardProps) {
  const cards = Array.isArray(question.cardsJson) ? question.cardsJson : [];
  const hasCards = cards.length > 0;

  return (
    <div className={styles.challengePlayBody}>
      {hasCards ? (
        <div className={styles.challengePlayCardsColumn}>
          <div className={styles.challengePlayCardsList}>
            {cards.map((card) => {
              const isReversed = card.orientation === "REVERSED";
              const orientationLabel = isReversed ? "Invertida" : "Derecho";
              
              return (
                <article key={`${card.cardId}-${card.orientation}`} className={styles.challengePlayCardItem}>
                  <img
                    src={cardIdToImage(card.cardId)}
                    alt={cardIdToLabel(card.cardId)}
                    className={styles.challengePlayCardImage}
                    style={isReversed ? { transform: "rotate(180deg)" } : undefined}
                  />
                  <h3 className={styles.challengePlayCardName}>{cardIdToLabel(card.cardId)}</h3>
                  <p className={styles.challengePlayCardOrientation}>{orientationLabel}</p>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className={styles.challengePlayQuestionColumn}>
        <h2 className={styles.challengePlayQuestionText}>{question.questionText}</h2>

        <div className={styles.challengePlayOptions}>
          {question.optionsJson.map((option) => {
            const selected = selectedOption === option;
            return (
              <button
                key={option}
                type="button"
                className={`${styles.challengePlayOption} ${selected ? styles.challengePlayOptionSelected : ""}`}
                onClick={() => onSelectOption(option)}
                disabled={disabled}
              >
                <div className={styles.challengePlayOptionRadio} aria-hidden="true" />
                <span>{option}</span>
              </button>
            );
          })}
        </div>

        {feedbackArea}
        <div className={styles.challengePlayActionArea}>
          {actionArea}
        </div>
      </div>
    </div>
  );
}
