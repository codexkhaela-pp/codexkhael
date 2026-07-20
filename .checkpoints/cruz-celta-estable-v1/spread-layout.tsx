import { getDrawSizeClass, getSpreadLayoutConfig } from "@/app/tiradas/spread-layouts";
import { TarotCardSlot } from "@/app/tiradas/components/tarot-card-slot";
import type { DrawnCard, ReadingStatus } from "@/app/tiradas/types";
import type { TarotSpread, TarotSpreadPosition } from "@/src/data/tarotSpreads";
import type { CSSProperties } from "react";

type SpreadLayoutProps = {
  spread: TarotSpread;
  drawnCards: DrawnCard[];
  visibleCards: number;
  status: ReadingStatus;
  activeRevealIndex: number | null;
  flippedCards: Set<number>;
  onToggleFlip: (index: number) => void;
};

function getPositionedMetrics(positions: TarotSpreadPosition[]) {
  const columns = Math.max(...positions.map((position) => position.x), 0) + 1;
  const rows = Math.max(...positions.map((position) => position.y), 0) + 1;
  return { columns, rows };
}

export function SpreadLayout({
  spread,
  drawnCards,
  visibleCards,
  status,
  activeRevealIndex,
  flippedCards,
  onToggleFlip,
}: SpreadLayoutProps) {
  const config = getSpreadLayoutConfig(spread.id);
  const sizeClass = getDrawSizeClass(spread.cardCount);
  const hasAnyFlippedCard = flippedCards.size > 0;
  const positions = spread.positions;
  const positionedMetrics = getPositionedMetrics(positions);
  const showPositionLabel = spread.id !== "celtic-cross";
  const showCardCaption = spread.id !== "celtic-cross";
  const showPlaceholderLabel = spread.id !== "celtic-cross";

  const layoutClass = `spread-layout spread-layout--${config.variant} ${sizeClass}`;

  const cards = positions.map((position, index) => {
    const entry = drawnCards[index];
    const isVisible = visibleCards > index;
    const isActive = status === "revelando" && activeRevealIndex === index;
    const isMuted =
      status === "revelando" && activeRevealIndex !== null && activeRevealIndex !== index;
    const isFlipped = flippedCards.has(index);
    const isDimmed = hasAnyFlippedCard && !isFlipped;

    let wrapperClass = "spread-layout__item";
    let wrapperStyle: CSSProperties | undefined;

    if (config.variant === "positioned") {
      wrapperClass += " spread-layout__item--positioned";
      wrapperStyle = {
        gridColumnStart: position.x + 1,
        gridRowStart: position.y + 1,
      };
    }

    if (config.variant === "tree") {
      wrapperClass += ` tree-position tree-position--${index + 1}`;
    }

    if (config.variant === "celtic") {
      wrapperClass += ` spread-stage__item celtic-position celtic-position--${index + 1}`;
    }

    return (
      <div key={position.id} className={wrapperClass} style={wrapperStyle}>
        <TarotCardSlot
          index={index}
          position={position}
          entry={entry}
          isVisible={isVisible}
          isActive={isActive}
          isMuted={isMuted}
          isDimmed={isDimmed}
          isFlipped={isFlipped}
          showPositionLabel={showPositionLabel}
          showCardCaption={showCardCaption}
          showPlaceholderLabel={showPlaceholderLabel}
          onToggleFlip={() => onToggleFlip(index)}
        />
      </div>
    );
  });

  if (config.variant === "celtic") {
    return (
      <div className={layoutClass}>
        <div className="spread-stage">{cards}</div>
      </div>
    );
  }

  return (
    <div
      className={layoutClass}
      style={
        config.variant === "positioned"
          ? ({
              ["--spread-cols" as string]: String(positionedMetrics.columns),
              ["--spread-rows" as string]: String(positionedMetrics.rows),
            } as CSSProperties)
          : undefined
      }
    >
      {cards}
    </div>
  );
}
