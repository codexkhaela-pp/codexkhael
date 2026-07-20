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

function getCelticWrapperStyle(positionId: number): CSSProperties {
  switch (positionId) {
    case 1:
      return { left: "calc(var(--cx) - var(--x-main))", top: "var(--cy)", marginTop: "30px"};
    case 2:
      return { left: "var(--cx)", top: "var(--cy)", zIndex: 3 , marginTop: "30px"};
    case 3:
      return { left: "calc(var(--cx) + var(--x-main))", top: "var(--cy)", marginTop: "30px" };
    case 4:
      return { left: "var(--cx)", top: "calc(var(--cy) + 18px)", zIndex: 4, marginTop: "65px" };
    case 5:
      return { left: "var(--cx)", top: "calc(var(--cy) - var(--y-main) - 18px)" };
    case 6:
      return { left: "var(--cx)", top: "calc(var(--cy) + var(--y-main) + 18px)", marginTop: "50px" };
    case 7:
      return { left: "calc(var(--cx) + var(--x-column))", top: "calc(var(--cy) + 315px)" };
    case 8:
      return { left: "calc(var(--cx) + var(--x-column))", top: "calc(var(--cy) + 129px)" };
    case 9:
      return { left: "calc(var(--cx) + var(--x-column))", top: "calc(var(--cy) - 57px)" };
    case 10:
      return { left: "calc(var(--cx) + var(--x-column))", top: "calc(var(--cy) - 243px)" };
    default:
      return {};
  }
}

function getCelticHeaderStyle(positionId: number): CSSProperties {
  switch (positionId) {
    case 1:
      return { top: "-28px", left: "50%", transform: "translateX(-50%)" };
    case 2:
      return { top: "-30px", left: "50%", transform: "translateX(-50%)" };
    case 3:
      return { top: "-28px", left: "50%", transform: "translateX(-50%)" };
    case 4:
      return { top: "50%", right: "-65px", transform: "translateY(-50%)" };
    case 5:
      return { top: "-28px", left: "50%", transform: "translateX(-50%)" };
    case 6:
      return { top: "-28px", left: "50%", transform: "translateX(-50%)" };
    case 7:
    case 8:
    case 9:
    case 10:
      return { top: "50%", left: "-30px", transform: "translateY(-50%)" };
    default:
      return {};
  }
}

function getCelticCardStyle(positionId: number): CSSProperties | undefined {
  if (positionId === 2) {
    return { transform: "none" };
  }

  if (positionId === 4) {
    return { transform: "rotate(90deg)", transformOrigin: "center" };
  }

  return undefined;
}

function getHorseshoeWrapperStyle(positionId: number): CSSProperties {
  switch (positionId) {
    case 1:
      return { transform: "translate(52px, -58px)", overflow: "visible" };
    case 2:
      return { transform: "translate(20px, -48px)", overflow: "visible" };
    case 3:
      return { transform: "translate(6px, -28px)", overflow: "visible" };
    case 4:
      return { transform: "translateY(-24px)", overflow: "visible" };
    case 5:
      return { transform: "translate(-6px, -28px)", overflow: "visible" };
    case 6:
      return { transform: "translate(-20px, -48px)", overflow: "visible" };
    case 7:
      return { transform: "translate(-52px, -58px)", overflow: "visible" };
    default:
      return { overflow: "visible" };
  }
}

function getHorseshoeCardStyle(): CSSProperties {
  return {
    width: "124px",
  };
}

function getTreeOfLifeWrapperStyle(positionId: number): CSSProperties {
  switch (positionId) {
    case 1:
      return { transform: "translateY(-8px)", overflow: "visible" };
    case 2:
      return { transform: "translate(18px, -10px)", overflow: "visible" };
    case 3:
      return { transform: "translate(-18px, -10px)", overflow: "visible" };
    case 4:
      return { transform: "translate(34px, 0)", overflow: "visible" };
    case 5:
      return { transform: "translateY(2px)", overflow: "visible" };
    case 6:
      return { transform: "translate(-34px, 0)", overflow: "visible" };
    case 7:
      return { transform: "translate(18px, 8px)", overflow: "visible" };
    case 8:
      return { transform: "translate(-18px, 8px)", overflow: "visible" };
    case 9:
      return { transform: "translateY(12px)", overflow: "visible" };
    case 10:
      return { transform: "translateY(22px)", overflow: "visible" };
    default:
      return { overflow: "visible" };
  }
}

function getTreeOfLifeCardStyle(positionId: number): CSSProperties {
  if (positionId === 10) {
    return {
      width: "118px",
      marginTop: "24px",
    };
  }

  return {
    width: "118px",
  };
}

function getTreeOfLifeHeaderStyle(positionId: number): CSSProperties | undefined {
  if (positionId === 10) {
    return { top: "8px", left: "50%", transform: "translateX(-50%)" };
  }

  return undefined;
}

function getDecisionWrapperStyle(positionId: number): CSSProperties {
  switch (positionId) {
    case 1:
      return { transform: "translateY(14px)", overflow: "visible" };
    case 2:
      return { transform: "translateX(6px)", overflow: "visible" };
    case 3:
      return { overflow: "visible" };
    case 4:
      return { transform: "translateX(-6px)", overflow: "visible" };
    case 5:
      return { transform: "translateY(10px)", overflow: "visible" };
    default:
      return { overflow: "visible" };
  }
}

function getDecisionCardStyle(): CSSProperties {
  return {
    width: "112px",
  };
}

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
  const isCelticCross = spread.id === "celtic-cross";
  const isSimpleNumberSpread =
    spread.id === "situation-blockage-advice" ||
    spread.id === "five-cards" ||
    spread.id === "line-seven";
  const isHorseshoeSpread = spread.id === "horseshoe";
  const isTreeOfLifeSpread = spread.id === "tree-of-life";
  const isDecisionSpread = spread.id === "decision";
  const useMinimalCardChrome =
    isCelticCross ||
    isSimpleNumberSpread ||
    isHorseshoeSpread ||
    isTreeOfLifeSpread ||
    isDecisionSpread;
  const sizeClass = getDrawSizeClass(spread.cardCount);
  const hasAnyFlippedCard = flippedCards.size > 0;
  const positions = spread.positions;
  const positionedMetrics = getPositionedMetrics(positions);
  const showPositionLabel = !useMinimalCardChrome;
  const showCardCaption = !useMinimalCardChrome;
  const showPlaceholderLabel = !useMinimalCardChrome;

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
      wrapperStyle = {
        ...wrapperStyle,
        overflow: "visible",
        ...getCelticWrapperStyle(index + 1),
      };
    }

    if (isHorseshoeSpread && config.variant === "positioned") {
      wrapperStyle = {
        ...wrapperStyle,
        ...getHorseshoeWrapperStyle(index + 1),
      };
    }

    if (isTreeOfLifeSpread && config.variant === "tree") {
      wrapperStyle = {
        ...wrapperStyle,
        ...getTreeOfLifeWrapperStyle(index + 1),
      };
    }

    if (isDecisionSpread && config.variant === "positioned") {
      wrapperStyle = {
        ...wrapperStyle,
        ...getDecisionWrapperStyle(index + 1),
      };
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
          bareMode={useMinimalCardChrome}
          simpleNumberMode={
            isSimpleNumberSpread ||
            isHorseshoeSpread ||
            isTreeOfLifeSpread ||
            isDecisionSpread
          }
          headerStyle={
            isCelticCross
              ? getCelticHeaderStyle(index + 1)
              : isTreeOfLifeSpread
                ? getTreeOfLifeHeaderStyle(index + 1)
                : undefined
          }
          cardStyle={
            isCelticCross
              ? getCelticCardStyle(index + 1)
              : isHorseshoeSpread
                ? getHorseshoeCardStyle()
                : isTreeOfLifeSpread
                  ? getTreeOfLifeCardStyle(index + 1)
                : isDecisionSpread
                  ? getDecisionCardStyle()
                : undefined
          }
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

  const layoutStyle =
    isSimpleNumberSpread && config.variant === "row"
      ? ({
          paddingTop: "28px",
          rowGap: "72px",
          columnGap: "28px",
        } as CSSProperties)
      : isTreeOfLifeSpread && config.variant === "tree"
        ? ({
            width: "max-content",
            maxWidth: "100%",
            marginInline: "auto",
            paddingTop: "28px",
            gridTemplateColumns: "repeat(5, max-content)",
            gridTemplateRows: "repeat(6, auto)",
            columnGap: "10px",
            rowGap: "4px",
          } as CSSProperties)
      : isHorseshoeSpread && config.variant === "positioned"
        ? ({
            ["--spread-cols" as string]: String(positionedMetrics.columns),
            ["--spread-rows" as string]: String(positionedMetrics.rows),
            width: "max-content",
            maxWidth: "100%",
            marginInline: "auto",
            paddingTop: "10px",
            gridTemplateColumns: `repeat(${positionedMetrics.columns}, max-content)`,
            columnGap: "4px",
            rowGap: "8px",
          } as CSSProperties)
      : isDecisionSpread && config.variant === "positioned"
        ? ({
            ["--spread-cols" as string]: String(positionedMetrics.columns),
            ["--spread-rows" as string]: String(positionedMetrics.rows),
            width: "max-content",
            maxWidth: "100%",
            marginInline: "auto",
            paddingTop: "18px",
            gridTemplateColumns: "repeat(3, max-content)",
            gridTemplateRows: "repeat(3, auto)",
            columnGap: "30px",
            rowGap: "42px",
          } as CSSProperties)
      : config.variant === "positioned"
        ? ({
            ["--spread-cols" as string]: String(positionedMetrics.columns),
            ["--spread-rows" as string]: String(positionedMetrics.rows),
          } as CSSProperties)
        : undefined;

  return (
    <div className={layoutClass} style={layoutStyle}>
      {cards}
    </div>
  );
}
