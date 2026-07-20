import Image from "next/image";
import type { CSSProperties } from "react";

type TarotFlipCardProps = {
  image: string;
  name: string;
  isReversed: boolean;
  isFlipped: boolean;
  keywords: string;
  onToggle: () => void;
  bareMode?: boolean;
  style?: CSSProperties;
};

export function TarotFlipCard({
  image,
  name,
  isReversed,
  isFlipped,
  keywords,
  onToggle,
  bareMode = false,
  style,
}: TarotFlipCardProps) {
  const cardStyle: CSSProperties | undefined = bareMode
    ? {
        filter: "none",
        boxShadow: "none",
        ...style,
      }
    : style;

  return (
    <div
      className="tarot-flip-card"
      style={cardStyle}
      role="button"
      tabIndex={0}
      aria-pressed={isFlipped}
      aria-label={`Voltear carta ${name}`}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle();
        }
      }}
    >
      <div className={`tarot-flip-card__inner${isFlipped ? " is-flipped" : ""}`}>
        <div className="tarot-flip-card__face tarot-flip-card__front">
          <Image
            src={image}
            alt={name}
            width={176}
            height={304}
            className={`tarot-flip-card__image${isReversed ? " is-reversed" : ""}`}
          />
        </div>

        <div className="tarot-flip-card__face tarot-flip-card__back">
          <div className="tarot-flip-card__back-content">
            <strong>{name}</strong>
            <span>{isReversed ? "Invertida" : "Derecho"}</span>
            <span>{keywords}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
