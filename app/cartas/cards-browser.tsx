"use client";

import { useMemo, useState } from "react";
import type { TarotCard, TarotDeck } from "@/src/data/tarotCards";
import { CartasFilters } from "./components/CartasFilters";
import { CartasGrid } from "./components/CartasGrid";
import styles from "./cartas.module.css";
import { TarotCardModal } from "@/components/tarot/TarotCardModal";

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

  const handleOpenCard = (card: TarotCard) => {
    setSelectedCard(card);
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

      <TarotCardModal
        isOpen={selectedCard !== null}
        onClose={() => setSelectedCard(null)}
        cardId={selectedCard?.slug ?? null}
        imageUrl={selectedCard?.image}
      />
    </>
  );
}
