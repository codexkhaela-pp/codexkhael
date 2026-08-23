import Link from "next/link";
import { useEffect, useState } from "react";
import type { ChallengeDetail } from "@/app/desafios/components/types";
import {
  challengeTypeToLabel,
  challengeTypeToIcon,
  cardIdToImage,
  cardIdToLabel,
  cleanQuestionText,
  cleanDescription
} from "@/app/desafios/components/challenge-mappers";
import styles from "@/app/desafios/desafios.module.css";

type ChallengeDetailPreViewProps = {
  challenge: ChallengeDetail;
  onStartAttempt: () => void;
  loading: boolean;
};

export function ChallengeDetailPreView({ challenge, onStartAttempt, loading }: ChallengeDetailPreViewProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: "00", minutes: "00", seconds: "00" });
  const [isActiveTimer, setIsActiveTimer] = useState(false);

  useEffect(() => {
    if (!challenge.nextResetAt) return;
    const targetTime = new Date(challenge.nextResetAt).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft({ hours: "00", minutes: "00", seconds: "00" });
        setIsActiveTimer(false);
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
      setIsActiveTimer(true);
      return true;
    };

    const active = updateTimer();
    if (!active) return;

    const intervalId = setInterval(updateTimer, 1000);
    return () => clearInterval(intervalId);
  }, [challenge.nextResetAt]);

  const firstQuestion = challenge.questions[0];
  const cards = firstQuestion?.cardsJson ?? [];
  const typeLabel = challengeTypeToLabel(challenge.type);
  const typeIcon = challengeTypeToIcon(challenge.type);
  
  const questionText = firstQuestion 
    ? cleanQuestionText(firstQuestion.questionText, challenge.isDaily) 
    : "¿Cuál es la interpretación más adecuada?";

  return (
    <div className={styles.detailContainer}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/desafios">Desafíos</Link> › <span>{challenge.title}</span>
      </nav>

      <header className={styles.detailHeader}>
        <div className={styles.detailHeaderIcon} aria-hidden="true">
          {typeIcon}
        </div>
        <div className={styles.detailHeaderContent}>
          <h1 className={styles.detailTitle}>{challenge.title}</h1>
          <p className={styles.detailDescription}>{cleanDescription(challenge.description, challenge.isDaily)}</p>
          <div className={styles.detailMetricsTop}>
            <span><span aria-hidden="true" className={styles.metricIconInline}>▥</span> Dificultad: <strong>{challenge.difficulty}</strong></span>
            <span><span aria-hidden="true" className={styles.metricIconInline}>⚜</span> XP base: <strong>{challenge.baseXp}</strong></span>
          </div>
        </div>
      </header>

      <div className={styles.mainCardGrid}>
        <section className={styles.mainCardLeft}>
          <div className={styles.sectionHeading}>
            <h3>✦ LAS CARTAS</h3>
            <span>Analiza la combinación</span>
          </div>
          <div className={styles.previewCardsShowcase}>
            {cards.map((card, idx) => (
              <article key={`${card.cardId}-${idx}`} className={styles.previewTarotCard}>
                <img
                  src={cardIdToImage(card.cardId)}
                  alt={cardIdToLabel(card.cardId)}
                  style={card.orientation === "REVERSED" ? { transform: "rotate(180deg)" } : undefined}
                />
              </article>
            ))}
          </div>
        </section>

        <section className={styles.mainCardRight}>
          <h2 className={styles.questionHeading}>{questionText}</h2>
          <p className={styles.questionInstruction}>
            Analiza la relación entre las cartas y elige la lectura que mejor representa el conjunto.
          </p>
          
          <div className={styles.actionContainer}>
            <button 
              type="button" 
              className={styles.startActionBtn} 
              onClick={onStartAttempt} 
              disabled={loading}
            >
              {loading ? "INICIANDO..." : "INICIAR DESAFÍO →"}
            </button>
            
            {isActiveTimer && (
              <div className={styles.detailCountdown}>
                <span aria-hidden="true">◷</span>
                Nuevo desafío en {timeLeft.hours} : {timeLeft.minutes} : {timeLeft.seconds}
              </div>
            )}
          </div>
        </section>
      </div>

      <div className={styles.secondaryRowGrid}>
        <section className={styles.aboutPanel}>
          <h3>✦ ACERCA DE ESTE DESAFÍO</h3>
          <p className={styles.panelText}>{cleanDescription(challenge.description, challenge.isDaily)}</p>
          
          <div className={styles.metricsList}>
            <div className={styles.metricItem}>
              <span className={styles.metricIcon}>🎯</span>
              <div className={styles.metricData}>
                <span className={styles.metricLabel}>Tipo</span>
                <strong className={styles.metricValue}>{typeLabel}</strong>
              </div>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricIcon}>▥</span>
              <div className={styles.metricData}>
                <span className={styles.metricLabel}>Dificultad</span>
                <strong className={styles.metricValue}>{challenge.difficulty}</strong>
              </div>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricIcon}>🏆</span>
              <div className={styles.metricData}>
                <span className={styles.metricLabel}>XP base</span>
                <strong className={styles.metricValue}>{challenge.baseXp} XP</strong>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.evaluatePanel}>
          <h3>✦ ANTES DE COMENZAR</h3>
          <ul className={styles.evaluateList}>
            <li>
              <span className={styles.evaluateBullet}>✦</span>
              <p>Analiza el mensaje general que transmiten las cartas en su conjunto.</p>
            </li>
            <li>
              <span className={styles.evaluateBullet}>✦</span>
              <p>Considera la posición y orientación de cada carta mostrada.</p>
            </li>
            <li>
              <span className={styles.evaluateBullet}>✦</span>
              <p>Al iniciar, no podrás cambiar tu elección una vez confirmada.</p>
            </li>
          </ul>
          
          <div className={styles.evaluateDecoration} aria-hidden="true">
            <img src="/assets/logo/logo-codex.png" alt="Sello decorativo" loading="lazy" />
          </div>
        </section>
      </div>

      <div className={styles.backContainer}>
        <Link href="/desafios" className={styles.backLink}>
          ← Volver a desafíos
        </Link>
      </div>
    </div>
  );
}
