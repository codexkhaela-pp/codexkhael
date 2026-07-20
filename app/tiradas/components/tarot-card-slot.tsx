import type { TarotSpreadPosition } from "@/src/data/tarotSpreads";
import { TarotFlipCard } from "@/app/tiradas/components/tarot-flip-card";
import type { DrawnCard } from "@/app/tiradas/types";
import type { CSSProperties } from "react";

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
  bareMode?: boolean;
  simpleNumberMode?: boolean;
  headerStyle?: CSSProperties;
  cardStyle?: CSSProperties;
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
  bareMode = false,
  simpleNumberMode = false,
  headerStyle,
  cardStyle,
  onToggleFlip,
}: TarotCardSlotProps) {
  const slotClass = `tarot-card-slot${isVisible ? " is-visible" : ""}${isActive ? " is-active" : ""}${
    isMuted ? " is-muted" : ""
  }${isDimmed ? " is-dimmed" : ""}${isFlipped ? " is-flipped" : ""}${
    showPositionLabel ? "" : " tarot-card-slot--number-only"
  }`;
  const slotStyle: CSSProperties | undefined = bareMode
    ? {
        width: "max-content",
        minWidth: 0,
        maxWidth: "none",
        padding: simpleNumberMode ? "20px 0 0" : 0,
        gap: 8,
        border: "none",
        borderRadius: 0,
        background: "transparent",
        boxShadow: "none",
        backdropFilter: "none",
        filter: "none",
        overflow: "visible",
        position: "relative",
        transform: "none",
        transition: "opacity 0.25s ease",
      }
    : undefined;

  return (
    <article className={slotClass} style={slotStyle} aria-live="polite">
      <div
        className="tarot-card-slot__header"
        style={
          bareMode
            ? {
                position: "absolute",
                width: "max-content",
                minHeight: 0,
                zIndex: 5,
                top: "-28px",
                left: "50%",
                transform: "translateX(-50%)",
                ...headerStyle,
              }
            : headerStyle
        }
      >
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
            bareMode={bareMode}
            style={cardStyle}
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
        <div
          className="tarot-card-slot__placeholder"
          style={
            bareMode
              ? {
                  border: "1px dashed var(--card-border)",
                  background: "transparent",
                  boxShadow: "none",
                  ...cardStyle,
                }
              : undefined
          }
          aria-hidden="true"
        >
          {showPlaceholderLabel ? "Carta por revelar" : ""}
        </div>
      )}
    </article>
  );
}
