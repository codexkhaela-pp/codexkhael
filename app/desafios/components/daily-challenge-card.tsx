import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import styles from "@/app/desafios/desafios.module.css";
import type { ChallengeDetail } from "@/app/desafios/components/types";
import { cardIdToImage, cardIdToLabel, cleanQuestionText, cleanDescription } from "@/app/desafios/components/challenge-mappers";

type DailyChallengeCardProps = {
  challenge: ChallengeDetail | null;
  onReset?: () => void;
};

export function DailyChallengeCard({ challenge, onReset }: DailyChallengeCardProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: "00", minutes: "00", seconds: "00" });
  const lastTriggeredResetRef = useRef<string | null>(null);

  useEffect(() => {
    if (!challenge?.nextResetAt) return;

    const targetTime = new Date(challenge.nextResetAt).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft({ hours: "00", minutes: "00", seconds: "00" });
        if (lastTriggeredResetRef.current !== (challenge.nextResetAt ?? null)) {
          lastTriggeredResetRef.current = challenge.nextResetAt ?? null;
          onReset?.();
        }
        return false;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
      });
      return true;
    };

    const active = updateTimer();
    if (!active) return;

    const intervalId = setInterval(updateTimer, 1000);
    return () => clearInterval(intervalId);
  }, [challenge?.nextResetAt, onReset]);

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

  const countdownUnits = [
    { value: timeLeft.hours, label: "Horas" },
    { value: timeLeft.minutes, label: "Minutos" },
    { value: timeLeft.seconds, label: "Segundos" },
  ];

  return (
    <section className={styles.dailyCard}>
      <div className={styles.dailyLeft}>
        <h2 className={styles.sectionTitle}>🔥 Desafío del día</h2>
        <p className={styles.dailyLabel}>Nuevo desafío disponible en:</p>

        <div className={styles.countdownGrid}>
          {countdownUnits.map((unit) => (
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
            <img
              src={cardIdToImage(card.cardId)}
              alt={cardIdToLabel(card.cardId)}
              style={card.orientation === "REVERSED" ? { transform: "rotate(180deg)" } : undefined}
            />
            <span>{cardIdToLabel(card.cardId)}</span>
          </article>
        ))}
      </div>

      <div className={styles.dailyRight}>
        <span className={styles.difficultyBadge}>Dificultad: {challenge.difficulty}</span>
        <h3 className={styles.dailyQuestion}>
          {cleanQuestionText(firstQuestion?.questionText ?? "¿Qué mensaje general transmite esta tirada?", challenge.isDaily)}
        </h3>
        <p className={styles.dailyBody}>{cleanDescription(challenge.description, challenge.isDaily)}</p>
        <Link href={`/desafios/${challenge.id}`} className={styles.primaryAction}>
          Resolver desafío <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
