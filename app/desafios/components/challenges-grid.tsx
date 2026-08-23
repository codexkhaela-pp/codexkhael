import Link from "next/link";
import type { ChallengeItem } from "@/app/desafios/components/types";
import styles from "@/app/desafios/desafios-hub.module.css";

type ChallengesGridProps = {
  challenges: ChallengeItem[];
};

export function ChallengesGrid({ challenges }: ChallengesGridProps) {
  return (
    <div className={styles.editorialList}>
      {challenges.map((challenge, index) => {
        const displayNumber = String(index + 1).padStart(2, "0");
        
        let diffClass = "";
        let diffBars = 1;
        if (challenge.difficulty === "Fácil") {
          diffClass = styles.easy;
          diffBars = 1;
        } else if (challenge.difficulty === "Media") {
          diffClass = styles.medium;
          diffBars = 2;
        } else if (challenge.difficulty === "Difícil") {
          diffClass = styles.hard;
          diffBars = 3;
        }

        const isLocked = challenge.status === "LOCKED";
        const isCompleted = challenge.status === "COMPLETED";

        let btnClass = styles.rowActionBtn;
        let btnText = "RESOLVER →";
        
        if (isLocked) {
          btnClass += ` ${styles.locked}`;
          btnText = "BLOQUEADO";
        } else if (isCompleted) {
          btnClass += ` ${styles.completed}`;
          btnText = "COMPLETADO";
        }

        return (
          <Link key={challenge.id} href={`/desafios/${challenge.id}`} className={`${styles.challengeRow} ${isLocked ? styles.locked : ""}`}>
            <span className={styles.challengeRowIndex}>{displayNumber}</span>
            <div className={styles.challengeRowIcon} aria-hidden="true">
              {challenge.icon}
            </div>
            
            <div className={styles.challengeRowContent}>
              <h3 className={styles.challengeRowTitle}>{challenge.name}</h3>
              <p className={styles.challengeRowDesc}>{challenge.description}</p>
              <div className={styles.challengeMetaMobile}>
                <span className={styles.challengeRowDifficulty} style={{ display: 'none' }}>
                  <span>Dificultad</span>
                  <strong className={diffClass}>{challenge.difficulty}</strong>
                </span>
                <span className={styles.challengeRowXp} style={{ display: 'none' }}>+{challenge.xpReward} XP</span>
              </div>
            </div>

            <div className={styles.challengeRowDifficultyGroup}>
              <div className={styles.challengeRowDifficulty}>
                <span>DIFICULTAD</span>
                <strong className={diffClass}>{challenge.difficulty.toUpperCase()}</strong>
              </div>
              <div className={styles.difficultyBars} aria-hidden="true">
                <div className={`${styles.difficultyBar} ${diffBars >= 1 ? `${styles.active} ${diffClass}` : ""}`} />
                <div className={`${styles.difficultyBar} ${diffBars >= 2 ? `${styles.active} ${diffClass}` : ""}`} />
                <div className={`${styles.difficultyBar} ${diffBars >= 3 ? `${styles.active} ${diffClass}` : ""}`} />
              </div>
            </div>

            <div className={styles.challengeRowXp}>
              +{challenge.xpReward} XP
            </div>

            <span className={btnClass}>
              {btnText}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
