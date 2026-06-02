import { useState, useMemo, useEffect } from "react";
import type { TarotCard } from "@/src/data/tarotCards";

function normalizeLookup(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

type CardSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { cardId: string; reversed: boolean; label: string; cardSearch: string }) => void;
  onDelete?: () => void;
  deck: TarotCard[];
  initialData?: Partial<{ cardId: string; reversed: boolean; label: string; cardSearch: string }>;
  allowRepeated: boolean;
  usedCardIds: string[];
};

type FilterSuit = "ALL" | "major" | "cups" | "pentacles" | "swords" | "wands";

export function CardSelectionModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  deck,
  initialData,
  allowRepeated,
  usedCardIds,
}: CardSelectionModalProps) {
  const [label, setLabel] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSuit, setFilterSuit] = useState<FilterSuit>("ALL");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [reversed, setReversed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLabel(initialData?.label ?? "");
      setSearchTerm("");
      setFilterSuit("ALL");
      setSelectedCardId(initialData?.cardId ?? null);
      setReversed(initialData?.reversed ?? false);
      setError(null);
    }
  }, [isOpen, initialData]);

  const filteredDeck = useMemo(() => {
    let result = deck;
    if (filterSuit !== "ALL") {
      if (filterSuit === "major") {
        result = result.filter((c) => c.arcana === "major");
      } else {
        result = result.filter((c) => c.suit === filterSuit);
      }
    }
    const searchNormalized = normalizeLookup(searchTerm);
    if (searchNormalized) {
      result = result.filter((c) => normalizeLookup(c.nameEs).includes(searchNormalized));
    }
    return result;
  }, [deck, filterSuit, searchTerm]);

  const handleSave = () => {
    if (!label.trim()) {
      setError("Debes ingresar una intención o nombre para la posición.");
      return;
    }

    if (!selectedCardId) {
      setError("Debes seleccionar una carta de la cuadrícula.");
      return;
    }

    const matchedCard = deck.find((c) => c.id === selectedCardId);
    if (!matchedCard) return;

    const isRepeated = usedCardIds.includes(matchedCard.id);
    if (!allowRepeated && isRepeated && matchedCard.id !== initialData?.cardId) {
      setError(`La carta ${matchedCard.nameEs} ya fue usada en otra posición de esta tirada.`);
      return;
    }

    onSave({
      cardId: matchedCard.id,
      reversed,
      label: label.trim(),
      cardSearch: matchedCard.nameEs,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="card-selection-modal-overlay">
      <div className="card-selection-modal card-selection-modal--large">
        <header className="card-selection-modal__header">
          <h3>{initialData?.cardId ? "Editar carta" : "Seleccionar carta"}</h3>
          <button type="button" className="card-selection-modal__close" onClick={onClose}>
            &times;
          </button>
        </header>

        <div className="card-selection-modal__body">
          <div className="modal-top-fields">
            <label className="manual-field">
              <span>Nombre / intención de la posición</span>
              <input
                type="text"
                value={label}
                onChange={(e) => {
                  setLabel(e.target.value);
                  setError(null);
                }}
                className="manual-field-control"
                placeholder="Ej: El Pasado, Obstáculo, Resultado..."
                autoFocus
              />
            </label>
            <label className="manual-field">
              <span>Orientación</span>
              <select
                value={reversed ? "REVERSED" : "UPRIGHT"}
                onChange={(e) => setReversed(e.target.value === "REVERSED")}
                className="manual-field-control"
              >
                <option value="UPRIGHT">Derecho</option>
                <option value="REVERSED">Invertida</option>
              </select>
            </label>
          </div>

          <div className="modal-filters-section">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="manual-field-control modal-search-input"
              placeholder="Buscar carta por nombre..."
            />
            <div className="modal-suit-filters">
              {[
                { id: "ALL", label: "Todas" },
                { id: "major", label: "Mayores" },
                { id: "cups", label: "Copas" },
                { id: "pentacles", label: "Oros" },
                { id: "swords", label: "Espadas" },
                { id: "wands", label: "Bastos" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`modal-filter-pill ${filterSuit === f.id ? "modal-filter-pill--active" : ""}`}
                  onClick={() => setFilterSuit(f.id as FilterSuit)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-card-grid">
            {filteredDeck.length === 0 ? (
              <p className="modal-empty-state">No se encontraron cartas.</p>
            ) : (
              filteredDeck.map((card) => {
                const isSelected = selectedCardId === card.id;
                const isUsed = !allowRepeated && usedCardIds.includes(card.id) && card.id !== initialData?.cardId;
                return (
                  <button
                    key={card.id}
                    type="button"
                    disabled={isUsed}
                    className={`modal-card-item ${isSelected ? "modal-card-item--selected" : ""} ${
                      isUsed ? "modal-card-item--used" : ""
                    }`}
                    onClick={() => {
                      setSelectedCardId(card.id);
                      setError(null);
                    }}
                  >
                    <img src={card.image} alt={card.nameEs} className="modal-card-item__img" />
                    <span className="modal-card-item__name">{card.nameEs}</span>
                  </button>
                );
              })
            )}
          </div>

          {error ? <p className="manual-error">{error}</p> : null}
        </div>

        <footer className="card-selection-modal__footer">
          {onDelete && (
            <button type="button" className="btn btn-secondary btn-danger" onClick={onDelete}>
              Eliminar
            </button>
          )}
          <div className="card-selection-modal__actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              Guardar
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
