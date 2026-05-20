import Link from "next/link";
import Image from "next/image";
import type { ReviewCard } from "@/lib/dashboard-mock";

interface ReviewCardsProps {
  cards: ReviewCard[];
}

const difficultyLabels: Record<ReviewCard["difficulty"], string> = {
  dificil: "Dificil",
  repasar: "Repasar",
  facil: "Facil",
};

const difficultyClass: Record<ReviewCard["difficulty"], string> = {
  dificil: "db-difficulty-hard",
  repasar: "db-difficulty-review",
  facil: "db-difficulty-mastered",
};

export function ReviewCardsSection({ cards }: ReviewCardsProps) {
  return (
    <section className="db-section db-review-section" aria-label="Cartas para repasar">
      <div className="db-section-header">
        <div>
          <h2 className="db-section-title">
            <span className="db-card-icon">◍</span> Cartas para Repasar
          </h2>
          <p className="db-section-sub">Basado en tu actividad reciente</p>
        </div>
      </div>

      <div className="db-review-grid" role="list">
        {cards.slice(0, 4).map((card) => (
          <div key={card.id} className="db-review-item" role="listitem">
            <div className="db-review-card-wrap">
              <Image src={card.image} alt={card.nameEs} width={80} height={138} className="db-review-card-img" />
            </div>
            <div className="db-review-meta">
              <span className="db-review-name">{card.nameEs}</span>
              <span className={`db-difficulty ${difficultyClass[card.difficulty]}`}>
                <span className="db-difficulty-dot" aria-hidden="true" />
                {difficultyLabels[card.difficulty]}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Link href="/cartas?estado=repasar" className="db-card-btn" id="btn-ver-cartas">
        Ver todas las cartas
      </Link>
    </section>
  );
}
