import type { ManualBoardCard } from "@/app/tiradas/types";
import type { TarotCard } from "@/src/data/tarotCards";

type ManualSpreadBoardProps = {
  cards: ManualBoardCard[];
  manualCardCount: number;
  onCellClick: (row: number, col: number) => void;
  onCardClick: (card: ManualBoardCard) => void;
  getCardData: (cardId: string) => TarotCard | undefined;
};

export function ManualSpreadBoard({
  cards,
  manualCardCount,
  onCellClick,
  onCardClick,
  getCardData,
}: ManualSpreadBoardProps) {
  return (
    <div className="manual-spread-board-dynamic">
      {Array.from({ length: manualCardCount }).map((_, index) => {
        // Mantenemos row = 1 de forma lógica, y el col = index + 1
        const row = 1;
        const col = index + 1;
        // Buscamos si hay una carta asignada a esta celda
        const cellCard = cards.find((c) => c.row === row && c.col === col) || null;
        const isFilled = cellCard !== null;

        if (isFilled) {
          const cardData = getCardData(cellCard.cardId);
          return (
            <button
              key={`cell-${row}-${col}`}
              className="manual-board-cell manual-board-cell--filled"
              type="button"
              onClick={() => onCardClick(cellCard)}
              aria-label={`Editar posición ${cellCard.label}`}
            >
              <span className="manual-board-cell__label">{cellCard.label}</span>
              <div className="manual-board-cell__image-container">
                {cardData ? (
                  <img
                    src={cardData.image}
                    alt={cardData.nameEs}
                    className={`manual-board-cell__image ${
                      cellCard.reversed ? "manual-board-cell__image--reversed" : ""
                    }`}
                  />
                ) : (
                  <div className="manual-board-cell__image-placeholder" />
                )}
              </div>
              <span className="manual-board-cell__orientation">
                {cellCard.reversed ? "Invertida" : "Derecho"}
              </span>
            </button>
          );
        }

        return (
          <button
            key={`cell-${row}-${col}`}
            className="manual-board-cell manual-board-cell--empty"
            type="button"
            onClick={() => onCellClick(row, col)}
            aria-label={`Colocar carta en la posición ${col}`}
          >
            <span className="manual-board-cell__add-icon">+</span>
          </button>
        );
      })}
    </div>
  );
}
