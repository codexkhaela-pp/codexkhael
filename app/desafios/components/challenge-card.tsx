import Link from "next/link";
import styles from "@/app/desafios/desafios.module.css";
import type { ChallengeItem } from "@/app/desafios/components/types";

type ChallengeCardProps = {
  challenge: ChallengeItem;
};

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  return (
    <article className={styles.challengeCard}>
      <span className={`${styles.typeTag} ${styles[`tone${challenge.typeTone[0].toUpperCase()}${challenge.typeTone.slice(1)}`]}`}>
        {challenge.typeLabel}
      </span>

      <div className={styles.challengeIcon} aria-hidden="true">
        {challenge.icon}
      </div>

      <h3 className={styles.challengeName}>{challenge.name}</h3>
      <p className={styles.challengeDescription}>{challenge.description}</p>

      <p className={styles.challengeDifficulty}>Dificultad: {challenge.difficulty}</p>

      <div className={styles.challengeFooter}>
        <p>
          Recompensa <strong>XP {challenge.xpReward}</strong>
        </p>
      </div>

      <Link href={`/desafios/${challenge.id}`} className={styles.secondaryAction}>
        Resolver
      </Link>
    </article>
  );
}
