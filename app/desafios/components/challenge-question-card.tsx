import styles from "@/app/desafios/desafios.module.css";
import type { ChallengeQuestion } from "@/app/desafios/components/types";
import { cardIdToImage, cardIdToLabel } from "@/app/desafios/components/challenge-mappers";

type ChallengeQuestionCardProps = {
  question: ChallengeQuestion;
  selectedOption: string | null;
  onSelectOption: (option: string) => void;
  disabled: boolean;
};

export function ChallengeQuestionCard({
  question,
  selectedOption,
  onSelectOption,
  disabled,
}: ChallengeQuestionCardProps) {
  const cards = Array.isArray(question.cardsJson) ? question.cardsJson : [];
  const hasCards = cards.length > 0;

  return (
    <section className={`${styles.playerCard} ${!hasCards ? styles.playerCardNoCards : ""}`}>
      {hasCards ? (
        <div className={styles.playerCardsRail}>
          {cards.map((card) => (
            <article key={`${card.cardId}-${card.orientation}`} className={styles.playerTarotCard}>
              <img
                src={cardIdToImage(card.cardId)}
                alt={cardIdToLabel(card.cardId)}
                style={card.orientation === "REVERSED" ? { transform: "rotate(180deg)" } : undefined}
              />
              <span>{cardIdToLabel(card.cardId)}</span>
              <small>{card.orientation === "UPRIGHT" ? "Al derecho" : "Invertida"}</small>
            </article>
          ))}
        </div>
      ) : null}

      <div className={styles.playerQuestionArea}>
        <h2 className={styles.playerQuestionTitle}>{question.questionText}</h2>

        <div className={styles.playerOptions}>
          {question.optionsJson.map((option) => {
            const selected = selectedOption === option;
            return (
              <button
                key={option}
                type="button"
                className={`${styles.playerOptionButton} ${selected ? styles.playerOptionSelected : ""}`}
                onClick={() => onSelectOption(option)}
                disabled={disabled}
              >
                <span className={styles.playerOptionRadio} aria-hidden="true" />
                <span>{option}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
