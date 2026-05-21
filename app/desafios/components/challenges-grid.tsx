import { ChallengeCard } from "@/app/desafios/components/challenge-card";
import type { ChallengeItem } from "@/app/desafios/components/types";
import styles from "@/app/desafios/desafios.module.css";

type ChallengesGridProps = {
  challenges: ChallengeItem[];
};

export function ChallengesGrid({ challenges }: ChallengesGridProps) {
  return (
    <div className={styles.challengesGrid}>
      {challenges.map((challenge) => (
        <ChallengeCard key={challenge.id} challenge={challenge} />
      ))}
    </div>
  );
}
