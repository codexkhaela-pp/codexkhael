import type { WeeklyChallengeItem } from "@/lib/dashboard-mock";

interface WeeklyChallengeCardProps {
  challenges: WeeklyChallengeItem[];
}

export function WeeklyChallengeCard({ challenges }: WeeklyChallengeCardProps) {
  const challenge = challenges[0];

  return (
    <article className="db-card db-card-challenge" aria-label="Mi proximo desafio">
      <div className="db-card-header">
        <span className="db-card-icon">{"\u269c"}</span>
        <h2 className="db-card-title">Mi Proximo Desafio</h2>
      </div>

      <div className="db-challenge-body">
        <div className="db-challenge-seal" aria-hidden="true">
          <div className="db-challenge-seal-inner">{"\u2609"}</div>
        </div>

        <div className="db-challenge-info">
          <p className="db-challenge-category">Desafio semanal</p>
          <h3 className="db-challenge-title">{challenge?.title ?? "Interpretacion intuitiva"}</h3>
          <p className="db-challenge-desc">{challenge?.description ?? "Realiza 5 tiradas intuitivas y registra tus reflexiones."}</p>
        </div>
      </div>

      <div className="db-challenge-progress">
        <div className="db-challenge-progress-header">
          <span className="db-challenge-progress-label">Progreso</span>
          <span className="db-challenge-progress-count">{challenge?.status ?? "3/5"}</span>
        </div>
        <div className="db-progress-bar-track">
          <div className="db-progress-bar-fill" style={{ width: "60%" }} />
        </div>
      </div>

      <span className="db-card-btn" aria-hidden="true">
        Ver desafios
      </span>
    </article>
  );
}
