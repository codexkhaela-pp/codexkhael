"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthSession } from "@/lib/use-auth-session";
import {
  getQuickInterpretation,
  type InterpretationTone,
  type QuickInterpretationOutput,
  type SpreadInterpretationCard,
} from "@/lib/quick-interpretation";
import { tarotCards, type TarotCard } from "@/src/data/tarotCards";
import { tarotSpreads } from "@/src/data/tarotSpreads";
import { SpreadLayout } from "@/app/tiradas/components/spread-layout";
import type { DrawnCard, ReadingStatus, ManualBoardCard } from "@/app/tiradas/types";
import { ManualSpreadBoard } from "@/app/tiradas/components/manual-spread-board";
import { CardSelectionModal } from "@/app/tiradas/components/card-selection-modal";
import { requestAiTarotReading, type AiTarotReadingResponse, type AiTarotReadingRequest } from "@/lib/ai-client";
import {
  canUseManualSpreadCardCount,
  canUseSpread,
  getManualSpreadMaxCards,
  MANUAL_SPREAD_ID,
} from "@/lib/features";

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

const interpretationToneOptions: Array<{ value: InterpretationTone; label: string }> = [
  { value: "mystic", label: "Místico" },
  { value: "psychological", label: "Psicológico" },
  { value: "direct", label: "Directo" },
];

const MANUAL_SPREAD_META = {
  id: MANUAL_SPREAD_ID,
  name: "Libre",
  description:
    "Define tu pregunta, nombra cada posición y elige manualmente cartas y orientación para obtener una lectura base sin IA.",
};

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
    dinamica: "dinámica",
    direccion: "dirección",
    practica: "práctica",
    tension: "tensión",
    emocion: "emoción",
    decision: "decisión",
    energia: "energía",
    accion: "acción",
    relacion: "relación",
    situacion: "situación",
    posicion: "posición",
    bloqueo: "bloqueo",
    dinamico: "dinámico",
    logico: "lógico",
    teorico: "teórico",
    friccion: "fricción",
    aqui: "aquí",
    util: "útil",
    tambien: "también",
    ayudara: "ayudará",
    limites: "límites",
    intuicion: "intuición",
    expansion: "expansión",
    union: "unión",
    corazon: "corazón",
    reflexion: "reflexión",
    solucion: "solución",
    ilusion: "ilusión",
    proteccion: "protección",
    transicion: "transición",
    realizacion: "realización",
    exito: "éxito",
    rapido: "rápido",
    rapida: "rápida",
    vacio: "vacío",
    armonia: "armonía",
    obstaculo: "obstáculo",
    proposito: "propósito",
    comun: "común",
    sintesis: "síntesis",
    concentracion: "concentración",
    limitacion: "limitación",
    dificil: "difícil",
    facil: "fácil",
    autentico: "auténtico",
    autentica: "auténtica",
    mistico: "místico",
  };

  let result = text;

  for (const key in corrections) {
    const regex = new RegExp(`\\b${key}\\b`, "gi");
    result = result.replace(regex, corrections[key]);
  }

  result = result
    .replace(/ayudarÃƒÂ¡/gi, "ayudará")
    .replace(/lÃƒmites/gi, "límites")
    .replace(/intuiciÃƒÂ³n/gi, "intuición")
    .replace(/corazÃƒÂ³n/gi, "corazón")
    .replace(/obstÃƒÂ¡culo/gi, "obstáculo")
    .replace(/\besta\b/gi, "está")
    .replace(/\bmas\b/gi, "más");

  return result;
}

function renderText(text: string): string {
  return normalizeSpanish(fixEncoding(text));
}

function normalizeLookup(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getRequiredPlanLabel(plan: string | null | undefined, spreadId: string): string {
  if (plan === "FREE" && ["five-cards", "horseshoe", "celtic-cross", "line-seven"].includes(spreadId)) {
    return "Básico";
  }

  return "Pro";
}

export function SpreadReader() {
  const router = useRouter();
  const riderWaiteDeck = useMemo(() => tarotCards.filter((card) => card.deck === "rider-waite"), []);
  const cardById = useMemo(() => new Map(riderWaiteDeck.map((card) => [card.id, card])), [riderWaiteDeck]);

  const [spreadId, setSpreadId] = useState(tarotSpreads[0]?.id ?? "");
  const [status, setStatus] = useState<ReadingStatus>("inicial");
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [visibleCards, setVisibleCards] = useState(0);
  const [activeRevealIndex, setActiveRevealIndex] = useState<number | null>(null);
  const [readingResult, setReadingResult] = useState<ReadingResult | null>(null);
  const [interpretationTone, setInterpretationTone] = useState<InterpretationTone>("psychological");
  const [aiDepthState, setAiDepthState] = useState<"idle" | "loading" | "ready">("idle");
  const [aiResponse, setAiResponse] = useState<AiTarotReadingResponse | null>(null);
  const [aiDepthError, setAiDepthError] = useState<string | null>(null);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [manualQuestion, setManualQuestion] = useState("");
  const [manualAllowRepeated, setManualAllowRepeated] = useState(false);
  const [manualCardCount, setManualCardCount] = useState(3);
  const [manualBoardCards, setManualBoardCards] = useState<ManualBoardCard[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number; card?: ManualBoardCard } | null>(null);
  const [manualReadingCards, setManualReadingCards] = useState<SpreadInterpretationCard[]>([]);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualIsGenerating, setManualIsGenerating] = useState(false);

  const authSession = useAuthSession();
  const currentPlan = authSession.plan;
  const maxManualCards = getManualSpreadMaxCards(currentPlan);
  const timersRef = useRef<number[]>([]);
  const isManualSpread = spreadId === MANUAL_SPREAD_ID;

  const selectedSpread = useMemo(
    () => tarotSpreads.find((spread) => spread.id === spreadId) ?? null,
    [spreadId],
  );

  const spreadPositions = selectedSpread?.positions ?? [];
  const isBusy = status === "barajando" || status === "revelando";

  const presetQuickInterpretation = useMemo(() => {
    if (!selectedSpread || status !== "completada" || drawnCards.length === 0) {
      return null;
    }

    return getQuickInterpretation({
      spreadId: selectedSpread.id,
      cards: drawnCards,
      tone: interpretationTone,
    });
  }, [drawnCards, interpretationTone, selectedSpread, status]);

  const manualQuickInterpretation = useMemo(() => {
    if (manualReadingCards.length === 0) {
      return null;
    }

    return getQuickInterpretation({
      spreadId: MANUAL_SPREAD_ID,
      spreadName: MANUAL_SPREAD_META.name,
      question: manualQuestion.trim(),
      cards: manualReadingCards,
      tone: interpretationTone,
    });
  }, [interpretationTone, manualQuestion, manualReadingCards]);

  const activeInterpretation = isManualSpread ? manualQuickInterpretation : presetQuickInterpretation;

  useEffect(() => {
    return () => {
      for (const timer of timersRef.current) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  useEffect(() => {
    setManualCardCount((previous) => Math.min(previous, maxManualCards));
  }, [maxManualCards]);

  function clearTimers() {
    for (const timer of timersRef.current) {
      window.clearTimeout(timer);
    }
    timersRef.current = [];
  }

  function resetAiDepth() {
    setAiDepthState("idle");
    setAiResponse(null);
    setAiDepthError(null);
  }

  function clearManualInterpretation(options?: { keepError?: boolean }) {
    setManualReadingCards([]);
    resetAiDepth();
    if (!options?.keepError) {
      setManualError(null);
    }
  }

  function buildReadingResult(currentSpreadId: string, cards: DrawnCard[]): ReadingResult {
    return {
      spreadId: currentSpreadId,
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
    resetAiDepth();
    setStatus("barajando");
    setDrawnCards([]);
    setVisibleCards(0);
    setActiveRevealIndex(null);
    setReadingResult(null);
    setFlippedCards(new Set());

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

  async function requestDepthInterpretation(params: {
    question: string | null;
    spreadType: string;
    quickInterpretation: QuickInterpretationOutput;
    cards: SpreadInterpretationCard[];
  }) {
    if (aiDepthState === "loading") {
      return;
    }

    setAiDepthState("loading");
    setAiDepthError(null);

    const payload: AiTarotReadingRequest = {
      source: "SPREAD",
      question: params.question,
      spreadType: params.spreadType,
      baseInterpretation: {
        summary: params.quickInterpretation.summary,
        cards: params.quickInterpretation.positionReadings.map((reading) => ({
          name: reading.cardName,
          orientation: reading.orientation === "Invertida" ? "REVERSED" : "UPRIGHT",
          positionName: reading.positionName || null,
          interpretation: reading.interpretation,
        })),
        connections: params.quickInterpretation.relationships,
        dominantTone: interpretationTone,
        blockages: "",
        advice: params.quickInterpretation.finalAdvice,
      },
      cards: params.cards.map((entry, index) => ({
        cardId: entry.card.id,
        name: entry.card.nameEs,
        orientation: entry.reversed ? "REVERSED" : "UPRIGHT",
        positionName: typeof entry.position === "string" ? entry.position : entry.position.label,
        order: index + 1,
      })),
      journalContext: null,
    };

    try {
      const response = await requestAiTarotReading(payload);
      setAiResponse(response);
      setAiDepthState("ready");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al conectar con la IA";
      if (message === "LIMIT_REACHED") {
        setAiDepthError("Has alcanzado el límite diario de consultas IA de tu plan.");
      } else {
        setAiDepthError(message);
      }
      setAiDepthState("idle");
    }
  }

  async function handlePresetDepthInterpretation() {
    if (!selectedSpread || !presetQuickInterpretation) {
      return;
    }

    await requestDepthInterpretation({
      question: null,
      spreadType: selectedSpread.id,
      quickInterpretation: presetQuickInterpretation,
      cards: drawnCards,
    });
  }

  function buildManualSpreadCards(cards: ManualBoardCard[]): SpreadInterpretationCard[] {
    // Ordenar de arriba hacia abajo (row) y de izquierda a derecha (col)
    const sortedCards = [...cards].sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });

    return sortedCards.map((position, index) => ({
      position: { id: index + 1, label: position.label.trim() || `Posición ${index + 1}` },
      card: cardById.get(position.cardId) as TarotCard,
      reversed: position.reversed,
    }));
  }

  function validateManualSpread(cards: ManualBoardCard[]): string | null {
    if (!manualQuestion.trim()) {
      return "Escribe una pregunta antes de interpretar la tirada libre.";
    }

    if (cards.length === 0) {
      return "Debes colocar al menos una carta en el tablero.";
    }

    if (cards.length > manualCardCount) {
      return `Has colocado ${cards.length} cartas, pero seleccionaste un máximo de ${manualCardCount}. Por favor ajusta la cantidad o elimina cartas.`;
    }

    if (!canUseManualSpreadCardCount(currentPlan, cards.length)) {
      return `Tu plan permite hasta ${maxManualCards} cartas en modo Libre.`;
    }

    return null;
  }

  async function handleManualInterpretation() {
    if (manualIsGenerating || authSession.status !== "authenticated") {
      return;
    }

    const validationError = validateManualSpread(manualBoardCards);
    if (validationError) {
      setManualError(validationError);
      setManualReadingCards([]);
      resetAiDepth();
      return;
    }

    setManualIsGenerating(true);
    setManualError(null);
    resetAiDepth();

    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });

    setManualReadingCards(buildManualSpreadCards(manualBoardCards));
    setManualIsGenerating(false);
  }

  async function handleManualDepthInterpretation() {
    if (!manualQuickInterpretation || manualReadingCards.length === 0) {
      return;
    }

    await requestDepthInterpretation({
      question: manualQuestion.trim(),
      spreadType: MANUAL_SPREAD_ID,
      quickInterpretation: manualQuickInterpretation,
      cards: manualReadingCards,
    });
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

  function handleSpreadSelection(nextSpreadId: string) {
    if (nextSpreadId === spreadId) {
      return;
    }

    resetAiDepth();
    setSpreadId(nextSpreadId);
  }

  function handleManualQuestionChange(value: string) {
    setManualQuestion(value);
    clearManualInterpretation();
  }

  function handleManualCardCountChange(value: number) {
    setManualCardCount(value);
    clearManualInterpretation();
  }

  function handleManualAllowRepeatedChange(checked: boolean) {
    setManualAllowRepeated(checked);
    clearManualInterpretation({ keepError: checked });
  }

  function handleCellClick(row: number, col: number) {
    if (manualBoardCards.length >= manualCardCount) {
      setManualError(`No puedes colocar más de ${manualCardCount} cartas.`);
      return;
    }
    setEditingCell({ row, col });
    setIsModalOpen(true);
  }

  function handleCardClick(card: ManualBoardCard) {
    setEditingCell({ row: card.row, col: card.col, card });
    setIsModalOpen(true);
  }

  function handleModalSave(data: { cardId: string; reversed: boolean; label: string; cardSearch: string }) {
    if (!editingCell) return;

    setManualBoardCards((prev) => {
      const existingIndex = prev.findIndex((c) => c.row === editingCell.row && c.col === editingCell.col);
      const newCard: ManualBoardCard = {
        id: `${editingCell.row}-${editingCell.col}`,
        row: editingCell.row,
        col: editingCell.col,
        cardId: data.cardId,
        reversed: data.reversed,
        label: data.label,
        cardSearch: data.cardSearch,
      };

      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = newCard;
        return next;
      }

      return [...prev, newCard];
    });

    setManualError(null);
    clearManualInterpretation();
  }

  function handleModalDelete() {
    if (!editingCell) return;
    setManualBoardCards((prev) => prev.filter((c) => !(c.row === editingCell.row && c.col === editingCell.col)));
    setIsModalOpen(false);
    clearManualInterpretation();
  }

  function resetManualSpread() {
    const nextCount = Math.min(3, maxManualCards);
    setManualQuestion("");
    setManualAllowRepeated(false);
    setManualCardCount(nextCount);
    setManualBoardCards([]);
    setManualReadingCards([]);
    setManualError(null);
    resetAiDepth();
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
          const isAllowed = currentPlan ? canUseSpread(currentPlan, spread.id) : false;
          const requiredPlan = getRequiredPlanLabel(currentPlan, spread.id);

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
                handleSpreadSelection(spread.id);
              }}
              disabled={isBusy || authSession.status === "loading"}
            >
              {spread.name}
              {!isAllowed ? <span className="spread-chip-badge">🔒 {requiredPlan}</span> : null}
            </button>
          );
        })}

        <button
          type="button"
          role="radio"
          aria-checked={isManualSpread}
          className={`spread-chip${isManualSpread ? " spread-chip-active" : ""}`}
          onClick={() => handleSpreadSelection(MANUAL_SPREAD_ID)}
          disabled={isBusy || authSession.status === "loading"}
        >
          {MANUAL_SPREAD_META.name}
        </button>
      </div>

      <div className="reading-board">
        <aside className="reading-side" aria-label="Mazo y acciones">
          <article className="reading-summary">
            <h2>{isManualSpread ? MANUAL_SPREAD_META.name : selectedSpread?.name}</h2>
            <p>{isManualSpread ? MANUAL_SPREAD_META.description : selectedSpread?.description}</p>
          </article>

          {isManualSpread ? null : (
            <>
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
                <Link className="btn btn-secondary" href="/dashboard-preview">
                  Volver al dashboard
                </Link>
              </div>
            </>
          )}

          {isManualSpread ? (
            <div className="reading-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleManualInterpretation}
                disabled={manualIsGenerating || aiDepthState === "loading" || authSession.status !== "authenticated"}
              >
                {manualIsGenerating ? "Interpretando..." : "Interpretar"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetManualSpread}
                disabled={manualIsGenerating || aiDepthState === "loading"}
              >
                Reiniciar libre
              </button>
              <Link className="btn btn-secondary" href="/dashboard-preview">
                Volver al dashboard
              </Link>
            </div>
          ) : null}

          {manualError ? <p className="manual-error">{manualError}</p> : null}
          {authSession.status === "loading" ? <p className="reading-status">Cargando sesión...</p> : null}
        </aside>

        <section
          className={`reading-main${status === "completada" || manualQuickInterpretation ? " reading-main-complete" : ""}`}
          aria-label="Resultado de tirada"
        >
          <p className="reading-guidance">
            {!isManualSpread && status === "inicial" && "Elige una tirada y respira antes de comenzar."}
            {!isManualSpread && status === "barajando" && "Preparando la lectura..."}
            {!isManualSpread && status === "revelando" && "La lectura se está revelando carta por carta..."}
            {!isManualSpread && status === "completada" && "Las cartas han hablado. Observa cómo dialogan entre sí."}
            {isManualSpread && !manualQuickInterpretation && !manualIsGenerating
              ? "Define tu pregunta, nombra cada posición y asigna las cartas antes de interpretar."
              : null}
            {isManualSpread && manualIsGenerating ? "Ordenando la lectura libre..." : null}
            {isManualSpread && manualQuickInterpretation ? "Tu tirada libre ya tiene una lectura base lista para profundizar." : null}
          </p>

          <div className="reading-main-panel">
            {isManualSpread ? (
              <div className="manual-reading-panel">
                <div className="manual-spread-setup manual-spread-setup--top">
                  <div className="manual-config-grid">
                    <label className="manual-field manual-field--full">
                      <span>Pregunta / Tema</span>
                      <textarea
                        value={manualQuestion}
                        onChange={(event) => handleManualQuestionChange(event.target.value)}
                        className="manual-field-control manual-field-textarea"
                        placeholder="Escribe la pregunta o tema central de esta tirada"
                        rows={2}
                      />
                    </label>

                    <div className="manual-field manual-field--full">
                      <span>Cantidad de cartas</span>
                      <div className="manual-card-count-pills">
                        {Array.from({ length: maxManualCards }, (_, index) => index + 1).map((count) => (
                          <button
                            key={count}
                            type="button"
                            className={`manual-pill ${manualCardCount === count ? "manual-pill--active" : ""}`}
                            onClick={() => handleManualCardCountChange(count)}
                            disabled={manualIsGenerating || aiDepthState === "loading"}
                          >
                            {count}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <ManualSpreadBoard
                  cards={manualBoardCards}
                  manualCardCount={manualCardCount}
                  onCellClick={handleCellClick}
                  onCardClick={handleCardClick}
                  getCardData={(cardId) => cardById.get(cardId)}
                />
                <CardSelectionModal
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  onSave={handleModalSave}
                  onDelete={editingCell?.card ? handleModalDelete : undefined}
                  deck={riderWaiteDeck}
                  initialData={editingCell?.card}
                  allowRepeated={false}
                  usedCardIds={manualBoardCards.map((c) => c.cardId)}
                />
              </div>
            ) : (
              <div className="reading-canvas">
                {selectedSpread ? (
                  <SpreadLayout
                    spread={selectedSpread}
                    drawnCards={drawnCards}
                    visibleCards={visibleCards}
                    status={status}
                    activeRevealIndex={activeRevealIndex}
                    flippedCards={flippedCards}
                    onToggleFlip={toggleFlip}
                  />
                ) : null}
              </div>
            )}

            {activeInterpretation ? (
              <section className="interpretation-panel" aria-label="Interpretación de la lectura">
                <header className="interpretation-header">
                  <h3>Interpretación de tu lectura</h3>
                  <p>{isManualSpread ? "Lectura base manual sin consumo de IA." : "Lectura rápida conectada de toda la tirada."}</p>
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
                  {isManualSpread && manualQuestion.trim() ? (
                    <section className="reading-section">
                      <h3>Pregunta</h3>
                      <p>{manualQuestion.trim()}</p>
                    </section>
                  ) : null}

                  <section className="reading-section">
                    <h3>1. Síntesis general</h3>
                    <p>{renderText(activeInterpretation.summary)}</p>
                  </section>

                  <section className="reading-section">
                    <h3>2. Lectura por posición</h3>
                    <div className="position-reading-list">
                      {activeInterpretation.positionReadings.map((item) => (
                        <article className="position-reading-card" key={item.positionNumber}>
                          <header className="position-reading-card__header">
                            <span>{item.positionNumber}</span>
                            <div>
                              <strong>{renderText(item.positionName)}</strong>
                              {item.positionSubtitle ? <small>{renderText(item.positionSubtitle)}</small> : null}
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
                    <p>{renderText(activeInterpretation.relationships)}</p>
                  </section>

                  <section className="reading-section">
                    <h3>4. Consejo final integrado</h3>
                    <p>{renderText(activeInterpretation.finalAdvice)}</p>
                  </section>
                </div>

                <div className="interpretation-ai">
                  {aiDepthError ? (
                    <div className="interpretation-ai-message" style={{ color: "#e05353" }}>
                      {aiDepthError}
                    </div>
                  ) : null}

                  {aiDepthState !== "ready" ? (
                    <button
                      type="button"
                      className="btn btn-secondary interpretation-ai-btn"
                      onClick={isManualSpread ? handleManualDepthInterpretation : handlePresetDepthInterpretation}
                      disabled={aiDepthState === "loading"}
                    >
                      {aiDepthState === "loading" ? "Consultando a la IA..." : "Profundizar con IA"}
                    </button>
                  ) : null}

                  {aiDepthState === "loading" ? (
                    <p className="interpretation-ai-message">Preparando una interpretación más profunda, por favor espera...</p>
                  ) : null}

                  {aiDepthState === "ready" && aiResponse ? (
                    <div className="interpretation-ai-panel">
                      <header className="ai-panel-header">
                        <span className="ai-panel-icon">✨</span>
                        <h3>Profundización IA</h3>
                      </header>

                      <div className="ai-panel-content">
                        <section className="ai-section-card ai-card-neutral">
                          <h4 className="ai-section-title">
                            <span className="ai-icon">✨</span> Visión profunda
                          </h4>
                          <div className="ai-text-content">
                            {aiResponse.aiSummary
                              .split("\n")
                              .filter((paragraph) => paragraph.trim())
                              .map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                              ))}
                          </div>
                        </section>

                        <section className="ai-section-card ai-card-structured">
                          <h4 className="ai-section-title">
                            <span className="ai-icon">🔍</span> Lectura detallada
                          </h4>
                          <div className="ai-text-content">
                            {(() => {
                              const stepLabels = ["Situación inicial", "Bloqueo o desarrollo", "Dirección o consejo"];
                              const rawLines = aiResponse.deepInterpretation.split("\n").filter((paragraph) => paragraph.trim());
                              let currentCard: { title: string; text: string[] } | null = null;
                              const cards: Array<{ title: string; text: string[] }> = [];
                              const intro: string[] = [];

                              rawLines.forEach((line) => {
                                if (line.includes(":") && line.length < 80) {
                                  if (currentCard) {
                                    cards.push(currentCard);
                                  }
                                  currentCard = { title: line, text: [] };
                                  return;
                                }

                                if (currentCard) {
                                  currentCard.text.push(line);
                                } else {
                                  intro.push(line);
                                }
                              });

                              if (currentCard) {
                                cards.push(currentCard);
                              }

                              if (cards.length === 0) {
                                const fullText = aiResponse.deepInterpretation.trim();
                                const sentences = fullText.match(/[^.!?]+[.!?]+/g) ?? [fullText];
                                const chunkSize = Math.ceil(sentences.length / 3);

                                for (let index = 0; index < 3; index += 1) {
                                  const chunk = sentences.slice(index * chunkSize, (index + 1) * chunkSize).join(" ").trim();
                                  if (chunk) {
                                    cards.push({ title: stepLabels[index], text: [chunk] });
                                  }
                                }
                              }

                              const labeledCards = cards.map((card, index) => ({
                                ...card,
                                title: card.title.replace(/^(carta\s*\d+|step\s*\d+)/i, "").trim() || stepLabels[index] || card.title,
                              }));

                              return (
                                <div className="ai-timeline-container">
                                  {intro.length > 0 ? (
                                    <div className="ai-timeline-intro">
                                      {intro.map((paragraph, index) => (
                                        <p key={`intro-${index}`}>{paragraph}</p>
                                      ))}
                                    </div>
                                  ) : null}
                                  <ul className="ai-timeline">
                                    {labeledCards.map((card, index) => (
                                      <li key={index} className="ai-timeline-item">
                                        <div className="ai-timeline-marker">
                                          <span className="ai-timeline-step">{index + 1}</span>
                                        </div>
                                        <div className="ai-timeline-content">
                                          <h5 className="ai-timeline-title">{card.title}</h5>
                                          {card.text.map((paragraph, paragraphIndex) => (
                                            <p key={paragraphIndex}>{paragraph}</p>
                                          ))}
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
                          <h4 className="ai-section-title">
                            <span className="ai-icon">🧩</span> Conexiones ocultas
                          </h4>
                          <div className="ai-text-content">
                            {aiResponse.cardConnections
                              .split("\n")
                              .filter((paragraph) => paragraph.trim())
                              .map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                              ))}
                          </div>
                        </section>

                        <section className="ai-section-card ai-section-highlight">
                          <h4 className="ai-section-title">
                            <span className="ai-icon">⚡</span> Consejo práctico
                          </h4>
                          <div className="ai-text-content">
                            {aiResponse.practicalAdvice
                              .split("\n")
                              .filter((paragraph) => paragraph.trim())
                              .map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                              ))}
                          </div>
                        </section>

                        <section className="ai-section-card ai-card-minimal">
                          <h4 className="ai-section-title">
                            <span className="ai-icon">❓</span> Preguntas de reflexión
                          </h4>
                          <ul className="ai-reflection-list">
                            {aiResponse.reflectionQuestions.map((question, index) => (
                              <li key={index}>
                                <span>{question}</span>
                              </li>
                            ))}
                          </ul>
                        </section>

                        <div className="ai-warning-box">
                          <small>
                            <em>{aiResponse.warning}</em>
                          </small>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}
