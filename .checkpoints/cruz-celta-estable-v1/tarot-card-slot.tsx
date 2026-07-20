import type { TarotSpreadPosition } from "@/src/data/tarotSpreads";
import { TarotFlipCard } from "@/app/tiradas/components/tarot-flip-card";
import type { DrawnCard } from "@/app/tiradas/types";

type TarotCardSlotProps = {
  index: number;
  position: TarotSpreadPosition;
  entry?: DrawnCard;
  isVisible: boolean;
  isActive: boolean;
  isMuted: boolean;
  isDimmed: boolean;
  isFlipped: boolean;
  showPositionLabel?: boolean;
  showCardCaption?: boolean;
  showPlaceholderLabel?: boolean;
  onToggleFlip: () => void;
};

export function TarotCardSlot({
  index,
  position,
  entry,
  isVisible,
  isActive,
  isMuted,
  isDimmed,
  isFlipped,
  showPositionLabel = true,
  showCardCaption = true,
  showPlaceholderLabel = true,
  onToggleFlip,
}: TarotCardSlotProps) {
  const slotClass = `tarot-card-slot${isVisible ? " is-visible" : ""}${isActive ? " is-active" : ""}${
    isMuted ? " is-muted" : ""
  }${isDimmed ? " is-dimmed" : ""}${isFlipped ? " is-flipped" : ""}${
    showPositionLabel ? "" : " tarot-card-slot--number-only"
  }`;

  return (
    <article className={slotClass} aria-live="polite">
      <div className="tarot-card-slot__header">
        <span className="tarot-card-slot__number" aria-label={`Posicion ${position.id}`}>
          {index + 1}
        </span>
        {showPositionLabel ? (
          <div>
            <strong>{position.label}</strong>
            {position.subtitle ? <small>{position.subtitle}</small> : null}
          </div>
        ) : null}
      </div>

      {entry && isVisible ? (
        <>
          <TarotFlipCard
            image={entry.card.image}
            name={entry.card.nameEs}
            isReversed={entry.reversed}
            isFlipped={isFlipped}
            onToggle={onToggleFlip}
            keywords={(entry.reversed ? entry.card.keywordsReversed : entry.card.keywordsUpright)
              .split(",")
              .map((keyword) => keyword.trim())
              .slice(0, 3)
              .join(", ")}
          />
          {showCardCaption ? (
            <div className="tarot-card-slot__caption">
              <strong>{entry.card.nameEs}</strong>
              <span>{entry.reversed ? "\u2193 Invertida" : "Derecho"}</span>
            </div>
          ) : null}
        </>
      ) : (
        <div className="tarot-card-slot__placeholder" aria-hidden="true">
          {showPlaceholderLabel ? "Carta por revelar" : ""}
        </div>
      )}
    </article>
  );
}
