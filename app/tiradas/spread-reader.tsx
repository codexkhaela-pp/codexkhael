"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { getQuickInterpretation, type InterpretationTone } from "@/lib/quick-interpretation";
import { tarotCards, type TarotCard } from "@/src/data/tarotCards";
import { tarotSpreads, type TarotSpreadPosition } from "@/src/data/tarotSpreads";

type ReadingStatus = "inicial" | "barajando" | "revelando" | "completada";

type DrawnCard = {
  position: TarotSpreadPosition;
  card: TarotCard;
  reversed: boolean;
};

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
  { value: "mystic", label: "Místico" },
  { value: "psychological", label: "Psicológico" },
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

function getDrawSizeClass(cardCount: number): string {
  if (cardCount <= 3) {
    return "draw-grid-size-large";
  }
  if (cardCount <= 5) {
    return "draw-grid-size-medium";
  }
  if (cardCount <= 7) {
    return "draw-grid-size-small";
  }
  return "draw-grid-size-compact";
}

function getLayoutClass(layout: string): string {
  if (layout === "horseshoe") {
    return "draw-grid-layout-horseshoe";
  }
  if (layout === "celtic-cross") {
    return "draw-grid-layout-celtic";
  }
  if (layout === "cross-simple") {
    return "draw-grid-layout-cross";
  }
  if (layout === "line" || layout === "row") {
    return "draw-grid-layout-line";
  }
  return "draw-grid-layout-custom";
}

export function SpreadReader() {
  const riderWaiteDeck = useMemo(
    () => tarotCards.filter((card) => card.deck === "rider-waite"),
    [],
  );

  const [spreadId, setSpreadId] = useState(tarotSpreads[0]?.id ?? "");
  const [status, setStatus] = useState<ReadingStatus>("inicial");
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [visibleCards, setVisibleCards] = useState(0);
  const [activeRevealIndex, setActiveRevealIndex] = useState<number | null>(null);
  const [readingResult, setReadingResult] = useState<ReadingResult | null>(null);
  const [interpretationTone, setInterpretationTone] = useState<InterpretationTone>("psychological");
  const [aiDepthState, setAiDepthState] = useState<"idle" | "loading" | "ready">("idle");

  const timersRef = useRef<number[]>([]);
  const aiDepthTimerRef = useRef<number | null>(null);

  const selectedSpread = useMemo(
    () => tarotSpreads.find((spread) => spread.id === spreadId) ?? tarotSpreads[0],
    [spreadId],
  );

  const spreadPositions = selectedSpread?.positions ?? [];
  const spreadGridMetrics = useMemo(() => {
    const columns = Math.max(...spreadPositions.map((position) => position.x), 0) + 1;
    const rows = Math.max(...spreadPositions.map((position) => position.y), 0) + 1;
    return { columns, rows };
  }, [spreadPositions]);

  const isBusy = status === "barajando" || status === "revelando";
  const drawGridClass = `${getLayoutClass(selectedSpread.layout)} ${getDrawSizeClass(
    selectedSpread.cardCount,
  )}`;

  const drawGridStyle = useMemo(
    () =>
      ({
        "--spread-cols": String(spreadGridMetrics.columns),
        "--spread-rows": String(spreadGridMetrics.rows),
      }) as CSSProperties,
    [spreadGridMetrics.columns, spreadGridMetrics.rows],
  );

  const quickInterpretation = useMemo(() => {
    if (status !== "completada" || drawnCards.length === 0) {
      return null;
    }

    return getQuickInterpretation({
      cards: drawnCards,
      tone: interpretationTone,
    });
  }, [drawnCards, interpretationTone, status]);

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
            <button
              type="button"
              className="btn btn-primary"
              onClick={startReading}
              disabled={isBusy}
            >
              {status === "barajando" ? "Barajando..." : "Barajar y sacar cartas"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={startReading}
              disabled={isBusy}
            >
              Nueva tirada
            </button>
            <Link className="btn btn-secondary" href="/dashboard">
              Volver al dashboard
            </Link>
          </div>
        </aside>

        <section
          className={`reading-main${status === "completada" ? " reading-main-complete" : ""}`}
          aria-label="Resultado de tirada"
        >
          <p className="reading-guidance">
            {status === "inicial" && "Elige una tirada y respira antes de comenzar."}
            {status === "barajando" && "Preparando la lectura..."}
            {status === "revelando" && "La lectura se está revelando carta por carta..."}
            {status === "completada" && "Las cartas han hablado. Observa cómo dialogan entre sí."}
          </p>
          <div className="draw-grid-wrapper">
            <div className={`draw-grid draw-grid-pattern ${drawGridClass}`} style={drawGridStyle}>
              {spreadPositions.map((position, index) => {
                const entry = drawnCards[index];
                const isVisible = visibleCards > index;
                const isActive = status === "revelando" && activeRevealIndex === index;
                const isMuted =
                  status === "revelando" && activeRevealIndex !== null && activeRevealIndex !== index;

                return (
                  <article
                    key={position.id}
                    className={`draw-slot${isVisible ? " draw-slot-visible" : ""}${
                      isActive ? " draw-slot-active" : ""
                    }${isMuted ? " draw-slot-muted" : ""}${
                      position.overlay ? " draw-slot-overlay" : ""
                    }`}
                    style={{
                      gridColumnStart: position.x + 1,
                      gridRowStart: position.y + 1,
                    }}
                    aria-live="polite"
                  >
                    <div className="draw-slot-header">
                      <span className="draw-position-index" aria-label={`Posición ${position.id}`}>
                        {position.id}
                      </span>
                      <div className="draw-position-titles">
                        <p className="draw-position">{position.label}</p>
                        {position.subtitle && <p className="draw-subtitle">{position.subtitle}</p>}
                      </div>
                    </div>

                    {entry && isVisible ? (
                      <div className="draw-card-row">
                        <div className={`draw-card-image-wrap${position.rotate ? " draw-card-rotate-cross" : ""}`}>
                          <Image
                            src={entry.card.image}
                            alt={entry.card.nameEs}
                            width={176}
                            height={304}
                            className={`draw-card-image${entry.reversed ? " draw-card-image-reversed" : ""}`}
                          />
                        </div>
                        <div className="draw-meta">
                          <h3>{entry.card.nameEs}</h3>
                          <p className="draw-state">
                            Estado:
                            {entry.reversed ? (
                              <span className="draw-state-badge" aria-label="Carta invertida">
                                ↓ Invertida
                              </span>
                            ) : (
                              " Derecha"
                            )}
                          </p>
                          <p className="draw-keywords">
                            {(entry.reversed ? entry.card.keywordsReversed : entry.card.keywordsUpright)
                              .split(",")
                              .map(k => k.trim())
                              .slice(0, 3)
                              .join(", ")}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className={`draw-placeholder${position.rotate ? " draw-card-rotate-cross" : ""}`} aria-hidden="true">
                        Carta por revelar
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {quickInterpretation && (
              <section className="interpretation-panel" aria-label="Interpretación de la lectura">
                <header className="interpretation-header">
                  <h3>Interpretación de tu lectura</h3>
                  <p>Lectura rápida conectada de toda la tirada.</p>
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

                  {/* Legacy fallback in case quickInterpretation is still just paragraphs */}
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
                      ? "Preparando interpretación profunda..."
                      : "Usar IA para mayor profundidad"}
                  </button>
                  {aiDepthState === "loading" && (
                    <p className="interpretation-ai-message">Preparando una interpretación más profunda...</p>
                  )}
                  {aiDepthState === "ready" && (
                    <p className="interpretation-ai-message">
                      La interpretación profunda con IA estará disponible en una siguiente fase.
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
