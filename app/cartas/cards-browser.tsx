"use client";

import { useMemo, useState } from "react";
import type { TarotCard, TarotDeck } from "@/src/data/tarotCards";
import { CartasFilters } from "./components/CartasFilters";
import { CartasGrid } from "./components/CartasGrid";
import styles from "./cartas.module.css";
import Image from "next/image";

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
  const [activeTab, setActiveTab] = useState<"resumen" | "simbologia">("resumen");

  const handleOpenCard = (card: TarotCard) => {
    setSelectedCard(card);
    setActiveTab("resumen");
  };

  const availableDecks = useMemo(() => new Set(cards.map((card) => card.deck)), [cards]);

  const deckOptions = useMemo(
    () => DECK_OPTIONS.filter((option) => option.value === "all" || availableDecks.has(option.value)),
    [availableDecks],
  );

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
      if (deck !== "all" && card.deck !== deck) return false;
      if (!normalizedQuery) return true;

      if (suitFromCode && card.suit !== suitFromCode) return false;
      if (rankFromCode && card.rank !== rankFromCode) return false;

      if (suitFromCode || rankFromCode) {
        if (hasNumberToken) return card.number === numberFromToken;
        return true;
      }

      if (hasNumberToken && card.number === numberFromToken) return true;

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
      <CartasFilters
        query={query}
        deck={deck}
        onQueryChange={setQuery}
        onDeckChange={setDeck}
        options={deckOptions}
      />

      <p className={styles.resultsText}>
        {filteredCards.length} carta{filteredCards.length === 1 ? "" : "s"} encontrada
        {filteredCards.length === 1 ? "" : "s"}
      </p>

      <CartasGrid cards={filteredCards} onOpen={handleOpenCard} />

      {selectedCard ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setSelectedCard(null)}>
          <section
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-label={`Detalle de ${selectedCard.nameEs}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>{selectedCard.nameEs}</h3>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedCard(null)}>
                Cerrar
              </button>
            </div>

            {/* Selector de pestañas */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "10px" }}>
              <button
                type="button"
                onClick={() => setActiveTab("resumen")}
                style={{
                  background: activeTab === "resumen" ? "rgba(201, 166, 107, 0.15)" : "transparent",
                  border: "1px solid",
                  borderColor: activeTab === "resumen" ? "#c9a66b" : "transparent",
                  color: activeTab === "resumen" ? "#ece7f4" : "#a9a0bb",
                  padding: "6px 16px",
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "all 0.2s"
                }}
              >
                Resumen
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("simbologia")}
                style={{
                  background: activeTab === "simbologia" ? "rgba(201, 166, 107, 0.15)" : "transparent",
                  border: "1px solid",
                  borderColor: activeTab === "simbologia" ? "#c9a66b" : "transparent",
                  color: activeTab === "simbologia" ? "#ece7f4" : "#a9a0bb",
                  padding: "6px 16px",
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "all 0.2s"
                }}
              >
                Simbología
              </button>
            </div>

            {activeTab === "resumen" ? (
              <div className={styles.modalBody}>
                <p>
                  <strong>Derecho:</strong> {selectedCard.keywordsUpright}
                </p>
                <p>
                  <strong>Invertido:</strong> {selectedCard.keywordsReversed}
                </p>
                <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setActiveTab("simbologia")}
                  >
                    Ver simbología
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.modalBody}>
                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                  <div style={{ flex: "0 0 auto", width: "180px", margin: "0 auto" }}>
                    <div className={styles.cartaImageFrame}>
                      <div className={styles.cartaImageInner}>
                        <Image
                          src={selectedCard.image}
                          alt={selectedCard.nameEs}
                          width={260}
                          height={450}
                          className={styles.cartaImage}
                          sizes="(max-width: 700px) 80vw, 180px"
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{ flex: "1 1 240px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {selectedCard.symbols ? (
                      <>
                        <h4 style={{ margin: "0 0 6px 0", color: "#f4ead7", fontSize: "15px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "4px" }}>
                          Simbología de la carta
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          {selectedCard.symbols.upright && selectedCard.symbols.upright.length > 0 && (
                            <div>
                              <span style={{ fontSize: "12px", textTransform: "uppercase", color: "#c8a569", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>Al Derecho</span>
                              <ul style={{ listStyleType: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                                {selectedCard.symbols.upright.map((sym, idx) => (
                                  <li key={idx} style={{ fontSize: "13px", color: "#cfc5dd", lineHeight: "1.4" }}>
                                    <span style={{ color: "#ece7f4", fontWeight: "600" }}>• {sym.name}</span>
                                    <span style={{ color: "rgba(255,255,255,0.4)", margin: "0 6px" }}>→</span>
                                    <span>{sym.meaning}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {selectedCard.symbols.reversed && selectedCard.symbols.reversed.length > 0 && (
                            <div style={{ marginTop: "8px" }}>
                              <span style={{ fontSize: "12px", textTransform: "uppercase", color: "#c8a569", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>Invertido</span>
                              <ul style={{ listStyleType: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                                {selectedCard.symbols.reversed.map((sym, idx) => (
                                  <li key={idx} style={{ fontSize: "13px", color: "#cfc5dd", lineHeight: "1.4" }}>
                                    <span style={{ color: "#ece7f4", fontWeight: "600" }}>• {sym.name}</span>
                                    <span style={{ color: "rgba(255,255,255,0.4)", margin: "0 6px" }}>→</span>
                                    <span>{sym.meaning}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </>
                    ) : selectedCard.structuredMeaning ? (
                      <>
                        <h4 style={{ margin: "0 0 6px 0", color: "#f4ead7", fontSize: "15px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "4px" }}>
                          Interpretación Estructurada
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          <p style={{ fontSize: "13px", color: "#cfc5dd", margin: 0 }}>
                            <strong style={{ color: "#c8a569" }}>Numerología:</strong> {selectedCard.structuredMeaning.core.number}
                          </p>
                          <p style={{ fontSize: "13px", color: "#cfc5dd", margin: 0 }}>
                            <strong style={{ color: "#c8a569" }}>Palo / elemento:</strong> {selectedCard.structuredMeaning.core.suit}
                          </p>
                          <p style={{ fontSize: "13px", color: "#cfc5dd", margin: 0, marginTop: "4px" }}>
                            <strong style={{ color: "#c8a569", display: "block", marginBottom: "2px" }}>Al Derecho:</strong> {selectedCard.structuredMeaning.upright}
                          </p>
                          <p style={{ fontSize: "13px", color: "#cfc5dd", margin: 0, marginTop: "4px" }}>
                            <strong style={{ color: "#c8a569", display: "block", marginBottom: "2px" }}>Invertido:</strong> {selectedCard.structuredMeaning.reversed}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <h4 style={{ margin: "0 0 6px 0", color: "#f4ead7", fontSize: "15px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "4px" }}>
                          Simbología de la carta
                        </h4>
                        <p style={{ fontStyle: "italic", color: "rgba(255, 255, 255, 0.4)", fontSize: "13px" }}>
                          Información en desarrollo para esta carta.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
