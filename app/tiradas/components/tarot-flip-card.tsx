import Image from "next/image";

type TarotFlipCardProps = {
  image: string;
  name: string;
  isReversed: boolean;
  isFlipped: boolean;
  keywords: string;
  onToggle: () => void;
};

export function TarotFlipCard({
  image,
  name,
  isReversed,
  isFlipped,
  keywords,
  onToggle,
}: TarotFlipCardProps) {
  return (
    <div
      className="tarot-flip-card"
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
            <span>{isReversed ? "Invertida" : "Derecha"}</span>
            <span>{keywords}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
