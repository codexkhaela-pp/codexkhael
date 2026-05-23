"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getQuickInterpretation, type InterpretationTone } from "@/lib/quick-interpretation";
import { tarotCards, type TarotCard } from "@/src/data/tarotCards";
import { tarotSpreads } from "@/src/data/tarotSpreads";
import { SpreadLayout } from "@/app/tiradas/components/spread-layout";
import type { DrawnCard, ReadingStatus } from "@/app/tiradas/types";
import { requestAiTarotReading, type AiTarotReadingResponse, type AiTarotReadingRequest } from "@/lib/ai-client";
import { canUseSpread } from "@/lib/features";

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

function fixEncoding(text: string) {
  try {
    return decodeURIComponent(escape(text));
  } catch {
    return text;
  }
}

function normalizeSpanish(text: string): string {
  const corrections: Record<string, string> = {
    'dinamica': 'dinámica',
    'direccion': 'dirección',
    'practica': 'práctica',
    'tension': 'tensión',
    'emocion': 'emoción',
    'decision': 'decisión',
    'energia': 'energía',
    'accion': 'acción',
    'relacion': 'relación',
    'situacion': 'situación',
    'posicion': 'posición',
    'bloqueo': 'bloqueo',
    'dinamico': 'dinámico',
    'logico': 'lógico',
    'teorico': 'teórico',
    'friccion': 'fricción',
    'aqui': 'aquí',
    'util': 'útil',
    'tambien': 'también',
    'ayudara': 'ayudará',
    'limites': 'límites',
    'intuicion': 'intuición',
    'expansion': 'expansión',
    'union': 'unión',
    'corazon': 'corazón',
    'reflexion': 'reflexión',
    'solucion': 'solución',
    'ilusion': 'ilusión',
    'proteccion': 'protección',
    'transicion': 'transición',
    'realizacion': 'realización',
    'exito': 'éxito',
    'rapido': 'rápido',
    'rapida': 'rápida',
    'vacio': 'vacío',
    'armonia': 'armonía',
    'obstaculo': 'obstáculo',
    'proposito': 'propósito',
    'comun': 'común',
    'sintesis': 'síntesis',
    'concentracion': 'concentración',
    'limitacion': 'limitación',
    'dificil': 'difícil',
    'facil': 'fácil',
    'autentico': 'auténtico',
    'autentica': 'auténtica',
    'mistico': 'místico',
    'ayudarÃ¡': 'ayudará',
    'lÃmites': 'límites',
    'intuiciÃ³n': 'intuición',
    'corazÃ³n': 'corazón',
    'obstÃ¡culo': 'obstáculo'
  };

  let result = text;

  for (const key in corrections) {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    result = result.replace(regex, corrections[key]);
  }

  result = result
    .replace(/ayudarÃ¡/gi, 'ayudará')
    .replace(/lÃmites/gi, 'límites')
    .replace(/intuiciÃ³n/gi, 'intuición')
    .replace(/corazÃ³n/gi, 'corazón')
    .replace(/obstÃ¡culo/gi, 'obstáculo')
    .replace(/\besta\b/gi, 'está')
    .replace(/\bmas\b/gi, 'más');

  return result;
}

function renderText(text: string): string {
  return normalizeSpanish(fixEncoding(text));
}

export function SpreadReader() {
  const router = useRouter();
  const riderWaiteDeck = useMemo(() => tarotCards.filter((card) => card.deck === "rider-waite"), []);

  const [spreadId, setSpreadId] = useState(tarotSpreads[0]?.id ?? "");
  const [status, setStatus] = useState<ReadingStatus>("inicial");
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [visibleCards, setVisibleCards] = useState(0);
  const [activeRevealIndex, setActiveRevealIndex] = useState<number | null>(null);
  const [readingResult, setReadingResult] = useState<ReadingResult | null>(null);
  const [interpretationTone, setInterpretationTone] = useState<InterpretationTone>("psychological");
  const [aiDepthState, setAiDepthState] = useState<"idle" | "loading" | "ready">("idle");
  const [aiResponse, setAiResponse] = useState<AiTarotReadingResponse | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("FREE");

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.valid && data.plan) {
          setCurrentPlan(data.plan);
        }
      })
      .catch(console.error);
  }, []);

  const [aiDepthError, setAiDepthError] = useState<string | null>(null);
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

  async function handleDepthInterpretation() {
    if (aiDepthState === "loading" || !quickInterpretation) {
      return;
    }

    setAiDepthState("loading");
    setAiDepthError(null);
    if (aiDepthTimerRef.current !== null) {
      window.clearTimeout(aiDepthTimerRef.current);
    }

    const payload: AiTarotReadingRequest = {
      source: "SPREAD",
      question: null, // Si hubiese input de pregunta, lo enviaríamos aquí
      spreadType: selectedSpread.name,
      baseInterpretation: {
        summary: quickInterpretation.summary,
        cards: quickInterpretation.positionReadings.map((r) => ({
          name: r.cardName,
          orientation: r.orientation === "Invertida" ? "REVERSED" : "UPRIGHT",
          positionName: typeof r.positionName === "string" ? r.positionName : null,
          interpretation: r.interpretation,
        })),
        connections: quickInterpretation.relationships,
        dominantTone: interpretationTone,
        blockages: "", // No específico en quickInterpretation actual
        advice: quickInterpretation.finalAdvice,
      },
      cards: drawnCards.map((entry, index) => ({
        cardId: entry.card.id,
        name: entry.card.nameEs,
        orientation: entry.reversed ? "REVERSED" : "UPRIGHT",
        positionName: typeof entry.position === 'string' ? entry.position : entry.position.label,
        order: index + 1,
      })),
      journalContext: null,
    };

    try {
      const response = await requestAiTarotReading(payload);
      setAiResponse(response);
      setAiDepthState("ready");
    } catch (err: any) {
      console.error("Error AI:", err);
      if (err.message === "LIMIT_REACHED") {
        router.push("/planes?from=limit");
        return;
      }
      setAiDepthError(err.message || "Error conectando con la IA");
      setAiDepthState("idle");
    }
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
        {tarotSpreads.map((spread) => {
          const isAllowed = canUseSpread(currentPlan, spread.id);
          const requiredPlan = isAllowed ? "" : (
            currentPlan === "FREE" && ["five-cards", "horseshoe", "celtic-cross", "line-seven"].includes(spread.id)
              ? "Básico"
              : "Pro"
          );

          return (
            <button
              key={spread.id}
              type="button"
              role="radio"
              aria-checked={spread.id === spreadId}
              className={`spread-chip${spread.id === spreadId ? " spread-chip-active" : ""}${!isAllowed ? " spread-chip-locked" : ""}`}
              onClick={() => {
                if (!isAllowed) {
                  router.push(`/planes?from=feature&feature=${spread.id}`);
                  return;
                }
                setSpreadId(spread.id);
              }}
              disabled={isBusy}
            >
              {spread.name}
              {!isAllowed && (
                <span className="spread-chip-badge">🔒 {requiredPlan}</span>
              )}
            </button>
          );
        })}
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
            {status === "revelando" && "La lectura se está revelando carta por carta..."}
            {status === "completada" && "Las cartas han hablado. Observa cómo dialogan entre sí."}
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
                  <section className="reading-section">
                    <h3>1. Síntesis general</h3>
                    <p>{renderText(quickInterpretation.summary)}</p>
                  </section>

                  <section className="reading-section">
                    <h3>2. Lectura por posición</h3>
                    <div className="position-reading-list">
                      {quickInterpretation.positionReadings.map((item) => (
                        <article className="position-reading-card" key={item.positionNumber}>
                          <header className="position-reading-card__header">
                            <span>{item.positionNumber}</span>
                            <div>
                              <strong>{renderText(item.positionName)}</strong>
                              {item.positionSubtitle && <small>{renderText(item.positionSubtitle)}</small>}
                            </div>
                          </header>

                          <p className="position-reading-card__card">
                            {renderText(item.cardName)} · {renderText(item.orientation)}
                          </p>

                          <p>{renderText(item.interpretation)}</p>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="reading-section">
                    <h3>3. Relaciones entre cartas</h3>
                    <p>{renderText(quickInterpretation.relationships)}</p>
                  </section>

                  <section className="reading-section">
                    <h3>4. Consejo final integrado</h3>
                    <p>{renderText(quickInterpretation.finalAdvice)}</p>
                  </section>
                </div>

                <div className="interpretation-ai">
                  {aiDepthError && (
                    <div className="interpretation-ai-message" style={{ color: "#e05353" }}>
                      {aiDepthError}
                    </div>
                  )}

                  {aiDepthState !== "ready" && (
                    <button
                      type="button"
                      className="btn btn-secondary interpretation-ai-btn"
                      onClick={handleDepthInterpretation}
                      disabled={aiDepthState === "loading"}
                    >
                      {aiDepthState === "loading"
                        ? "Consultando a la IA profunda..."
                        : "Usar IA para mayor profundidad"}
                    </button>
                  )}

                  {aiDepthState === "loading" && (
                    <p className="interpretation-ai-message">Preparando una interpretación más profunda, por favor espera...</p>
                  )}

                  {aiDepthState === "ready" && aiResponse && (
                    <div className="interpretation-ai-panel">
                      <header className="ai-panel-header">
                        <span className="ai-panel-icon">✨</span>
                        <h3>Profundización IA</h3>
                      </header>
                      
                      <div className="ai-panel-content">
                        <section className="ai-section-card ai-card-neutral">
                          <h4 className="ai-section-title"><span className="ai-icon">✨</span> Visión Profunda</h4>
                          <div className="ai-text-content">
                            {aiResponse.aiSummary.split('\n').filter(p => p.trim()).map((p, idx) => (
                              <p key={idx}>{p}</p>
                            ))}
                          </div>
                        </section>

                        <section className="ai-section-card ai-card-structured">
                          <h4 className="ai-section-title"><span className="ai-icon">🔍</span> Lectura Detallada</h4>
                          <div className="ai-text-content">
                            {(() => {
                              const STEP_LABELS = [
                                "Situación inicial",
                                "Bloqueo o desarrollo",
                                "Dirección o consejo",
                              ];

                              // Try to detect structured lines (title: content)
                              const rawLines = aiResponse.deepInterpretation.split('\n').filter(p => p.trim());
                              let currentCard: { title: string, text: string[] } | null = null;
                              const cards: { title: string, text: string[] }[] = [];
                              const intro: string[] = [];

                              rawLines.forEach(line => {
                                if (line.includes(':') && line.length < 80) {
                                  if (currentCard) cards.push(currentCard);
                                  currentCard = { title: line, text: [] };
                                } else {
                                  if (currentCard) {
                                    currentCard.text.push(line);
                                  } else {
                                    intro.push(line);
                                  }
                                }
                              });
                              if (currentCard) cards.push(currentCard);

                              // Fallback: split single block into 3 parts with fixed labels
                              if (cards.length === 0) {
                                const fullText = aiResponse.deepInterpretation.trim();
                                // Try splitting by sentence boundaries into ~3 chunks
                                const sentences = fullText.match(/[^.!?]+[.!?]+/g) ?? [fullText];
                                const chunkSize = Math.ceil(sentences.length / 3);
                                for (let i = 0; i < 3; i++) {
                                  const chunk = sentences.slice(i * chunkSize, (i + 1) * chunkSize).join(' ').trim();
                                  if (chunk) {
                                    cards.push({ title: STEP_LABELS[i], text: [chunk] });
                                  }
                                }
                              }

                              // Ensure labels are readable (replace with step labels if AI titles are too long)
                              const labeledCards = cards.map((c, i) => ({
                                ...c,
                                title: c.title.replace(/^(carta\s*\d+|step\s*\d+)/i, '').trim() || STEP_LABELS[i] || c.title,
                              }));

                              return (
                                <div className="ai-timeline-container">
                                  {intro.length > 0 && (
                                    <div className="ai-timeline-intro">
                                      {intro.map((p, idx) => <p key={`i-${idx}`}>{p}</p>)}
                                    </div>
                                  )}
                                  <ul className="ai-timeline">
                                    {labeledCards.map((c, i) => (
                                      <li key={i} className="ai-timeline-item">
                                        <div className="ai-timeline-marker">
                                          <span className="ai-timeline-step">{i + 1}</span>
                                        </div>
                                        <div className="ai-timeline-content">
                                          <h5 className="ai-timeline-title">{c.title}</h5>
                                          {c.text.map((p, idx) => <p key={idx}>{p}</p>)}
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            })()}
                          </div>
                        </section>

                        <section className="ai-section-card ai-card-light">
                          <h4 className="ai-section-title"><span className="ai-icon">🧩</span> Conexiones Ocultas</h4>
                          <div className="ai-text-content">
                            {aiResponse.cardConnections.split('\n').filter(p => p.trim()).map((p, idx) => (
                              <p key={idx}>{p}</p>
                            ))}
                          </div>
                        </section>

                        <section className="ai-section-card ai-section-highlight">
                          <h4 className="ai-section-title"><span className="ai-icon">⚡</span> Consejo Práctico</h4>
                          <div className="ai-text-content">
                            {aiResponse.practicalAdvice.split('\n').filter(p => p.trim()).map((p, idx) => (
                              <p key={idx}>{p}</p>
                            ))}
                          </div>
                        </section>

                        <section className="ai-section-card ai-card-minimal">
                          <h4 className="ai-section-title"><span className="ai-icon">❓</span> Preguntas de Reflexión</h4>
                          <ul className="ai-reflection-list">
                            {aiResponse.reflectionQuestions.map((q, idx) => (
                              <li key={idx}><span>{q}</span></li>
                            ))}
                          </ul>
                        </section>

                        <div className="ai-warning-box">
                          <small><em>{aiResponse.warning}</em></small>
                        </div>
                      </div>
                    </div>
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
