"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getQuickInterpretation, type InterpretationTone } from "@/lib/quick-interpretation";
import { tarotCards, type TarotCard } from "@/src/data/tarotCards";
import { tarotSpreads } from "@/src/data/tarotSpreads";
import { SpreadLayout } from "@/app/tiradas/components/spread-layout";
import type { DrawnCard, ReadingStatus } from "@/app/tiradas/types";

type ReadingResult = {
  spreadId: string;
  createdAt: string;
  cards: Array<{
    positionId: number;
    positionLabel: string;
    cardId: string;
    reversed: boolean;
  }>;
};

const REVEAL_DELAY_MS = 420;
const SHUFFLE_TIME_MS = 900;
const INTERPRETATION_DEPTH_DELAY_MS = 850;

const interpretationToneOptions: Array<{ value: InterpretationTone; label: string }> = [
  { value: "mystic", label: "Mistico" },
  { value: "psychological", label: "Psicologico" },
  { value: "direct", label: "Directo" },
];

function pickUniqueRandomCards(cards: TarotCard[], count: number): TarotCard[] {
  const pool = [...cards];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[randomIndex]] = [pool[randomIndex], pool[index]];
  }
  return pool.slice(0, count);
}

export function SpreadReader() {
  const riderWaiteDeck = useMemo(() => tarotCards.filter((card) => card.deck === "rider-waite"), []);

  const [spreadId, setSpreadId] = useState(tarotSpreads[0]?.id ?? "");
  const [status, setStatus] = useState<ReadingStatus>("inicial");
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [visibleCards, setVisibleCards] = useState(0);
  const [activeRevealIndex, setActiveRevealIndex] = useState<number | null>(null);
  const [readingResult, setReadingResult] = useState<ReadingResult | null>(null);
  const [interpretationTone, setInterpretationTone] = useState<InterpretationTone>("psychological");
  const [aiDepthState, setAiDepthState] = useState<"idle" | "loading" | "ready">("idle");
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

  const timersRef = useRef<number[]>([]);
  const aiDepthTimerRef = useRef<number | null>(null);

  const selectedSpread = useMemo(
    () => tarotSpreads.find((spread) => spread.id === spreadId) ?? tarotSpreads[0],
    [spreadId],
  );

  const spreadPositions = selectedSpread?.positions ?? [];
  const isBusy = status === "barajando" || status === "revelando";

  const quickInterpretation = useMemo(() => {
    if (status !== "completada" || drawnCards.length === 0) {
      return null;
    }

    return getQuickInterpretation({
      spreadId: selectedSpread.id,
      cards: drawnCards,
      tone: interpretationTone,
    });
  }, [drawnCards, interpretationTone, selectedSpread.id, status]);

  useEffect(() => {
    return () => {
      for (const timer of timersRef.current) {
        window.clearTimeout(timer);
      }
      if (aiDepthTimerRef.current !== null) {
        window.clearTimeout(aiDepthTimerRef.current);
      }
    };
  }, []);

  function clearTimers() {
    for (const timer of timersRef.current) {
      window.clearTimeout(timer);
    }
    timersRef.current = [];
  }

  function buildReadingResult(spreadName: string, cards: DrawnCard[]): ReadingResult {
    return {
      spreadId: spreadName,
      createdAt: new Date().toISOString(),
      cards: cards.map((entry) => ({
        positionId: entry.position.id,
        positionLabel: entry.position.label,
        cardId: entry.card.id,
        reversed: entry.reversed,
      })),
    };
  }

  function startReading() {
    if (!selectedSpread) {
      return;
    }

    clearTimers();
    setStatus("barajando");
    setDrawnCards([]);
    setVisibleCards(0);
    setActiveRevealIndex(null);
    setReadingResult(null);
    setAiDepthState("idle");
    setFlippedCards(new Set());
    if (aiDepthTimerRef.current !== null) {
      window.clearTimeout(aiDepthTimerRef.current);
      aiDepthTimerRef.current = null;
    }

    const selectedCards = pickUniqueRandomCards(riderWaiteDeck, spreadPositions.length);
    const resolvedCards: DrawnCard[] = spreadPositions.map((position, index) => ({
      position,
      card: selectedCards[index],
      reversed: Math.random() < 0.5,
    }));

    const shuffleTimer = window.setTimeout(() => {
      setDrawnCards(resolvedCards);
      setStatus("revelando");

      spreadPositions.forEach((_, index) => {
        const revealTimer = window.setTimeout(() => {
          const nextVisible = index + 1;
          setActiveRevealIndex(index);
          setVisibleCards(nextVisible);
          if (nextVisible === spreadPositions.length) {
            setStatus("completada");
            setActiveRevealIndex(null);
            setReadingResult(buildReadingResult(selectedSpread.id, resolvedCards));
          }
        }, REVEAL_DELAY_MS * (index + 1));
        timersRef.current.push(revealTimer);
      });
    }, SHUFFLE_TIME_MS);

    timersRef.current.push(shuffleTimer);
  }

  function handleDepthInterpretation() {
    if (aiDepthState === "loading") {
      return;
    }

    setAiDepthState("loading");
    if (aiDepthTimerRef.current !== null) {
      window.clearTimeout(aiDepthTimerRef.current);
    }

    aiDepthTimerRef.current = window.setTimeout(() => {
      setAiDepthState("ready");
    }, INTERPRETATION_DEPTH_DELAY_MS);
  }

  function toggleFlip(index: number) {
    setFlippedCards((previous) => {
      const next = new Set(previous);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  useEffect(() => {
    if (status === "completada" && readingResult && process.env.NODE_ENV !== "production") {
      console.debug("Resultado de tirada listo para persistencia:", readingResult);
    }
  }, [readingResult, status]);

  return (
    <section className="reading-tool" aria-label="Generador de tiradas">
      <div className="reading-spreads" role="radiogroup" aria-label="Tipo de tirada">
        {tarotSpreads.map((spread) => (
          <button
            key={spread.id}
            type="button"
            role="radio"
            aria-checked={spread.id === spreadId}
            className={`spread-chip${spread.id === spreadId ? " spread-chip-active" : ""}`}
            onClick={() => setSpreadId(spread.id)}
            disabled={isBusy}
          >
            {spread.name}
          </button>
        ))}
      </div>

      <div className="reading-board">
        <aside className="reading-side" aria-label="Mazo y acciones">
          <article className="reading-summary">
            <h2>{selectedSpread.name}</h2>
            <p>{selectedSpread.description}</p>
          </article>

          <div className="deck-stage">
            <div
              className={`deck-stack${status === "barajando" ? " deck-stack-shuffling" : ""}${
                status === "revelando" ? " deck-stack-cut" : ""
              }`}
              aria-label="Mazo cerrado"
            >
              <div className="deck-face" aria-hidden="true">
                <img src="/decks/rider-waite/back.png" alt="" className="deck-face-image" />
              </div>
              <span className="deck-layer deck-layer-one" aria-hidden="true" />
              <span className="deck-layer deck-layer-two" aria-hidden="true" />
              <span className="deck-layer deck-layer-three" aria-hidden="true" />
              <span className="deck-layer deck-layer-four" aria-hidden="true" />
              <span className="deck-layer deck-layer-five" aria-hidden="true" />
            </div>
            <p className="reading-status">
              {status === "inicial" && "Mazo listo"}
              {status === "barajando" && "Barajando..."}
              {status === "revelando" && "Revelando cartas..."}
              {status === "completada" && "La lectura ha sido revelada"}
            </p>
          </div>

          <div className="reading-actions">
            <button type="button" className="btn btn-primary" onClick={startReading} disabled={isBusy}>
              {status === "barajando" ? "Barajando..." : "Barajar y sacar cartas"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={startReading} disabled={isBusy}>
              Nueva tirada
            </button>
            <Link className="btn btn-secondary" href="/dashboard">
              Volver al dashboard
            </Link>
          </div>
        </aside>

        <section className={`reading-main${status === "completada" ? " reading-main-complete" : ""}`} aria-label="Resultado de tirada">
          <p className="reading-guidance">
            {status === "inicial" && "Elige una tirada y respira antes de comenzar."}
            {status === "barajando" && "Preparando la lectura..."}
            {status === "revelando" && "La lectura se esta revelando carta por carta..."}
            {status === "completada" && "Las cartas han hablado. Observa como dialogan entre si."}
          </p>

          <div className="reading-main-panel">
            <div className="reading-canvas">
              <SpreadLayout
                spread={selectedSpread}
                drawnCards={drawnCards}
                visibleCards={visibleCards}
                status={status}
                activeRevealIndex={activeRevealIndex}
                flippedCards={flippedCards}
                onToggleFlip={toggleFlip}
              />
            </div>

            {quickInterpretation && (
              <section className="interpretation-panel" aria-label="Interpretacion de la lectura">
                <header className="interpretation-header">
                  <h3>Interpretacion de tu lectura</h3>
                  <p>Lectura rapida conectada de toda la tirada.</p>
                </header>

                <div className="interpretation-tone-selector" role="radiogroup" aria-label="Tono de respuesta">
                  {interpretationToneOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={interpretationTone === option.value}
                      className={`interpretation-tone-pill${
                        interpretationTone === option.value ? " interpretation-tone-pill-active" : ""
                      }`}
                      onClick={() => setInterpretationTone(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="interpretation-copy">
                  {quickInterpretation.sections?.map((section, index) => (
                    <div key={index} className="interpretation-section">
                      <h4>
                        {section.icon && <span className="interpretation-icon">{section.icon}</span>}
                        {section.title}
                      </h4>
                      <p>{section.content}</p>
                    </div>
                  ))}

                  {quickInterpretation.finalMessage && (
                    <div className="interpretation-highlight-block">
                      <p>{quickInterpretation.finalMessage}</p>
                    </div>
                  )}

                  {!quickInterpretation.sections && quickInterpretation.paragraphs?.map((paragraph, index) => (
                    <p key={`${index}-${paragraph.slice(0, 20)}`}>{paragraph}</p>
                  ))}
                </div>

                <div className="interpretation-ai">
                  <button
                    type="button"
                    className="btn btn-secondary interpretation-ai-btn"
                    onClick={handleDepthInterpretation}
                    disabled={aiDepthState === "loading"}
                  >
                    {aiDepthState === "loading"
                      ? "Preparando interpretacion profunda..."
                      : "Usar IA para mayor profundidad"}
                  </button>
                  {aiDepthState === "loading" && (
                    <p className="interpretation-ai-message">Preparando una interpretacion mas profunda...</p>
                  )}
                  {aiDepthState === "ready" && (
                    <p className="interpretation-ai-message">
                      La interpretacion profunda con IA estara disponible en una siguiente fase.
                    </p>
                  )}
                </div>
              </section>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
