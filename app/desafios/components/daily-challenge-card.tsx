import Link from "next/link";
import styles from "@/app/desafios/desafios.module.css";
import type { ChallengeDetail } from "@/app/desafios/components/types";
import { cardIdToImage, cardIdToLabel } from "@/app/desafios/components/challenge-mappers";

type DailyChallengeCardProps = {
  challenge: ChallengeDetail | null;
};

const countdown = [
  { value: "14", label: "Horas" },
  { value: "25", label: "Minutos" },
  { value: "47", label: "Segundos" },
];

export function DailyChallengeCard({ challenge }: DailyChallengeCardProps) {
  if (!challenge) {
    return (
      <section className={styles.dailyCard}>
        <h2 className={styles.sectionTitle}>🔥 Desafío del día</h2>
        <p className={styles.emptyState}>No hay desafío diario disponible por ahora.</p>
      </section>
    );
  }

  const firstQuestion = challenge.questions[0];
  const cards = (firstQuestion?.cardsJson ?? []).slice(0, 3);

  return (
    <section className={styles.dailyCard}>
      <div className={styles.dailyLeft}>
        <h2 className={styles.sectionTitle}>🔥 Desafío del día</h2>
        <p className={styles.dailyLabel}>Nuevo desafío disponible en:</p>

        <div className={styles.countdownGrid}>
          {countdown.map((unit) => (
            <article key={unit.label} className={styles.countdownItem}>
              <strong>{unit.value}</strong>
              <span>{unit.label}</span>
            </article>
          ))}
        </div>
      </div>

      <div className={styles.dailyCardsShowcase}>
        {cards.map((card) => (
          <article key={`${card.cardId}-${card.orientation}`} className={styles.tarotPreviewCard}>
            <img src={cardIdToImage(card.cardId)} alt={cardIdToLabel(card.cardId)} />
            <span>{cardIdToLabel(card.cardId)}</span>
          </article>
        ))}
      </div>

      <div className={styles.dailyRight}>
        <span className={styles.difficultyBadge}>Dificultad: {challenge.difficulty}</span>
        <h3 className={styles.dailyQuestion}>
          {firstQuestion?.questionText ?? "¿Qué mensaje general transmite esta tirada?"}
        </h3>
        <p className={styles.dailyBody}>{challenge.description}</p>
        <Link href={`/desafios/${challenge.id}`} className={styles.primaryAction}>
          Resolver desafío <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
