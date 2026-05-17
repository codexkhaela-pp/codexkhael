"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { TarotCard, TarotDeck } from "@/src/data/tarotCards";

type CardsBrowserProps = {
  cards: TarotCard[];
};

const SUIT_CODE_MAP: Record<TarotCard["suit"], string> = {
  major: "AM",
  pentacles: "AO",
  cups: "AC",
  wands: "AB",
  swords: "AE",
};

const RANK_CODE_MAP: Record<string, NonNullable<TarotCard["rank"]>> = {
  PJ: "page",
  CB: "knight",
  RN: "queen",
  RY: "king",
};

const DECK_LABELS: Record<TarotDeck, string> = {
  "rider-waite": "Rider-Waite",
  marsella: "Marsella",
  egipcio: "Egipcio",
};

const DECK_OPTIONS: Array<{ value: TarotDeck | "all"; label: string }> = [
  { value: "all", label: "Todos los mazos" },
  { value: "rider-waite", label: DECK_LABELS["rider-waite"] },
  { value: "marsella", label: DECK_LABELS.marsella },
  { value: "egipcio", label: DECK_LABELS.egipcio },
];


function suitByCode(code: string): TarotCard["suit"] | null {
  const normalized = code.toUpperCase();
  if (normalized === "AM") return "major";
  if (normalized === "AO") return "pentacles";
  if (normalized === "AC") return "cups";
  if (normalized === "AB") return "wands";
  if (normalized === "AE") return "swords";
  return null;
}

function rankByCode(code: string): NonNullable<TarotCard["rank"]> | null {
  return RANK_CODE_MAP[code.toUpperCase()] ?? null;
}

export function CardsBrowser({ cards }: CardsBrowserProps) {
  const [query, setQuery] = useState("");
  const [deck, setDeck] = useState<TarotDeck | "all">("all");
  const [selectedCard, setSelectedCard] = useState<TarotCard | null>(null);
  const [isDeckOpen, setIsDeckOpen] = useState(false);

  const availableDecks = useMemo(() => new Set(cards.map((card) => card.deck)), [cards]);

  const deckLabel = useMemo(() => {
    const option = DECK_OPTIONS.find((item) => item.value === deck);
    return option?.label ?? "Todos los mazos";
  }, [deck]);

  const filteredCards = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    const upperTokens = tokens.map((token) => token.toUpperCase());

    const suitToken = upperTokens.find((token) => suitByCode(token));
    const rankToken = upperTokens.find((token) => rankByCode(token));
    const suitFromCode = suitToken ? suitByCode(suitToken) : null;
    const rankFromCode = rankToken ? rankByCode(rankToken) : null;

    const rawNumber = tokens.find((token) => /^\d+$/.test(token));
    const numberFromToken = rawNumber ? Number(rawNumber) : null;
    const hasNumberToken = typeof numberFromToken === "number" && Number.isFinite(numberFromToken);

    return cards.filter((card) => {
      if (deck !== "all" && card.deck !== deck) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      if (suitFromCode && card.suit !== suitFromCode) {
        return false;
      }

      if (rankFromCode && card.rank !== rankFromCode) {
        return false;
      }

      if (suitFromCode || rankFromCode) {
        if (hasNumberToken) {
          return card.number === numberFromToken;
        }
        return true;
      }

      if (hasNumberToken && card.number === numberFromToken) {
        return true;
      }

      const searchArea = [
        card.nameEs,
        card.slug,
        SUIT_CODE_MAP[card.suit],
        card.number ? String(card.number) : "",
        card.rank ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchArea.includes(normalizedQuery);
    });
  }, [cards, deck, query]);

  return (
    <>
      <section className="cards-toolbar" aria-label="Buscador de cartas">
        <div className="toolbar-field">
          <label htmlFor="cards-search">Buscar</label>
          <input
            id="cards-search"
            type="text"
            placeholder='Ej: "El Loco", "AM 10", "AO RN", "PJ"'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="toolbar-field">
          <label>Mazo</label>
          <div className="deck-dropdown" onBlur={() => setIsDeckOpen(false)} tabIndex={-1}>
            <button
              type="button"
              className="deck-trigger"
              aria-haspopup="listbox"
              aria-expanded={isDeckOpen}
              onClick={() => setIsDeckOpen((current) => !current)}
            >
              <span>{deckLabel}</span>
              <span className={`deck-chevron${isDeckOpen ? " deck-chevron-open" : ""}`}>▾</span>
            </button>
            {isDeckOpen ? (
              <ul className="deck-menu" role="listbox" aria-label="Seleccionar mazo">
                {DECK_OPTIONS.filter((option) => option.value === "all" || availableDecks.has(option.value))
                  .map((option) => (
                    <li key={option.value}>
                      <button
                        type="button"
                        className={`deck-option${deck === option.value ? " deck-option-active" : ""}`}
                        onClick={() => {
                          setDeck(option.value);
                          setIsDeckOpen(false);
                        }}
                      >
                        {option.label}
                      </button>
                    </li>
                  ))}
              </ul>
            ) : null}
          </div>
        </div>
      </section>

      <p className="cards-results">
        {filteredCards.length} carta{filteredCards.length === 1 ? "" : "s"} encontrada
        {filteredCards.length === 1 ? "" : "s"}
      </p>

      <section className="cards-grid" aria-label="Listado de cartas">
        {filteredCards.map((card) => (
          <article key={card.id} className="card-item">
            <button
              type="button"
              className="card-select"
              onClick={() => setSelectedCard(card)}
              aria-label={`Ver detalle de ${card.nameEs}`}
            >
              <div className="card-image-wrap">
                <Image
                  src={card.image}
                  alt={card.nameEs}
                  width={260}
                  height={450}
                  className="card-image"
                  sizes="(max-width: 900px) 45vw, (max-width: 1200px) 30vw, 22vw"
                />
              </div>
              <h2>{card.nameEs}</h2>
            </button>
          </article>
        ))}
      </section>

      {selectedCard ? (
        <div
          className="card-modal-backdrop"
          role="presentation"
          onClick={() => setSelectedCard(null)}
        >
          <section
            className="card-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Detalle de ${selectedCard.nameEs}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="card-modal-header">
              <h3>{selectedCard.nameEs}</h3>
              <button
                type="button"
                className="btn btn-secondary card-modal-close"
                onClick={() => setSelectedCard(null)}
              >
                Cerrar
              </button>
            </div>
            <div className="card-modal-body">
              <p>
                <strong>Derecho:</strong> {selectedCard.keywordsUpright}
              </p>
              <p>
                <strong>Invertido:</strong> {selectedCard.keywordsReversed}
              </p>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
