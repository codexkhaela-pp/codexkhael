"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { ManualSpreadBoard } from "@/app/tiradas/components/manual-spread-board";
import { CardSelectionModal } from "@/app/tiradas/components/card-selection-modal";
import { CardProtagonistModal } from "@/app/tiradas/components/card-protagonist-modal";
import { ReadingExperienceShell } from "@/app/tiradas/components/reading-experience-shell";
import { TarotCardModal } from "@/components/tarot/TarotCardModal";
import type { DrawnCard, ManualBoardCard, ManualSpreadStatus, ReadingStatus } from "@/app/tiradas/types";
import {
  requestAiTarotReading,
  type AiTarotReadingRequest,
  type AiTarotReadingResponse,
} from "@/lib/ai-client";
import { createJournalEntryInApi, exportJournalEntryToPdf } from "@/app/diario/api-client";
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

const MANUAL_SPREAD_META = {
  id: MANUAL_SPREAD_ID,
  name: "Libre",
  description:
    "Define tu pregunta, nombra cada posición y elige manualmente cartas y orientación para obtener una lectura base sin alterar la lógica actual.",
};

const MOJIBAKE_TEXT_CORRECTIONS: Array<[RegExp, string]> = [
  [new RegExp("ayudar\\u00c3\\u0192\\u00c6\\u2019\\u00c3\\u201a\\u00c2\\u00a1", "gi"), "ayudará"],
  [new RegExp("l\\u00c3\\u0192\\u00c6\\u2019mites", "gi"), "límites"],
  [new RegExp("intuici\\u00c3\\u0192\\u00c6\\u2019\\u00c3\\u201a\\u00c2\\u00b3n", "gi"), "intuición"],
  [new RegExp("coraz\\u00c3\\u0192\\u00c6\\u2019\\u00c3\\u201a\\u00c2\\u00b3n", "gi"), "corazón"],
  [new RegExp("obst\\u00c3\\u0192\\u00c6\\u2019\\u00c3\\u201a\\u00c2\\u00a1culo", "gi"), "obstáculo"],
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

  for (const [pattern, replacement] of MOJIBAKE_TEXT_CORRECTIONS) {
    result = result.replace(pattern, replacement);
  }

  return result.replace(/\besta\b/gi, "está").replace(/\bmas\b/gi, "más");
}

function renderText(text: string): string {
  return normalizeSpanish(fixEncoding(text));
}

function htmlToPlainText(text: string): string {
  return renderText(
    text
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+\n/g, "\n")
      .replace(/\n\s+/g, "\n")
      .replace(/\n{2,}/g, "\n\n")
      .trim(),
  );
}

function getRequiredPlanLabel(plan: string | null | undefined, spreadId: string): string {
  if (plan === "FREE" && ["five-cards", "horseshoe", "celtic-cross", "line-seven"].includes(spreadId)) {
    return "Básico";
  }

  return "Pro";
}

function getPlanAccent(plan: string | null | undefined): string {
  if (plan === "PRO") return "PRO";
  if (plan === "BASIC") return "BÁSICO";
  return "FREE";
}

function getUserInitial(email: string | null): string {
  const source = email?.trim() ?? "";
  if (!source) return "C";
  return source.charAt(0).toUpperCase();
}

function getSpreadPresentation(spreadId: string, spreadName: string) {
  const normalizedName = renderText(spreadName);

  if (spreadId === "celtic-cross") {
    return {
      title: "Tirada Cruz Celta",
      subtitle: "Profundidad • Guía • Claridad",
      eyebrow: "Mesa de lectura",
      legend: "Lectura clásica de 10 posiciones",
    };
  }

  if (spreadId === "tree-of-life") {
    return {
      title: "Tirada Kabbalah",
      subtitle: "Árbol de la Vida",
      eyebrow: "Mesa de lectura",
      legend: "Sabiduría • Conexión • Propósito",
    };
  }

  if (spreadId === MANUAL_SPREAD_ID) {
    return {
      title: "Tirada Libre",
      subtitle: "Diseña tu lectura",
      eyebrow: "Mesa de lectura",
      legend: "Configura posiciones, cartas y orientación",
    };
  }

  return {
    title: `Tirada ${normalizedName}`,
    subtitle: "Consulta • Lectura • Integración",
    eyebrow: "Mesa de lectura",
    legend: `${normalizedName} • ${spreadId === "situation-blockage-advice" ? "Guía inmediata" : "Lectura dinámica"}`,
  };
}

function buildShareableReadingText(params: {
  spreadName: string;
  question: string;
  positions: Array<{ index: number; label: string; cardName: string; orientation: string }>;
  interpretation: QuickInterpretationOutput | null;
}) {
  return [
    params.spreadName,
    params.question ? `Pregunta: ${params.question}` : "",
    "",
    ...params.positions.map(
      (item) => `${item.index}. ${item.label}: ${item.cardName} (${item.orientation})`,
    ),
    "",
    params.interpretation ? `Resumen: ${renderText(params.interpretation.summary)}` : "",
    params.interpretation ? `Consejo: ${renderText(params.interpretation.finalAdvice)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function SpreadReader() {
  const router = useRouter();
  const authSession = useAuthSession();
  const riderWaiteDeck = useMemo(() => tarotCards.filter((card) => card.deck === "rider-waite"), []);
  const cardById = useMemo(() => new Map(riderWaiteDeck.map((card) => [card.id, card])), [riderWaiteDeck]);

  const [spreadId, setSpreadId] = useState(tarotSpreads[0]?.id ?? "");
  const [status, setStatus] = useState<ReadingStatus>("inicial");
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [visibleCards, setVisibleCards] = useState(0);
  const [activeRevealIndex, setActiveRevealIndex] = useState<number | null>(null);
  const [readingResult, setReadingResult] = useState<ReadingResult | null>(null);
  const [interpretationTone] = useState<InterpretationTone>("psychological");
  const [aiDepthState, setAiDepthState] = useState<"idle" | "loading" | "ready">("idle");
  const [aiResponse, setAiResponse] = useState<AiTarotReadingResponse | null>(null);
  const [aiDepthError, setAiDepthError] = useState<string | null>(null);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [readingQuestion, setReadingQuestion] = useState("");
  const [manualQuestion, setManualQuestion] = useState("");
  const [manualAllowRepeated, setManualAllowRepeated] = useState(false);
  const [manualCardCount, setManualCardCount] = useState(3);
  const [manualBoardCards, setManualBoardCards] = useState<ManualBoardCard[]>([]);
  const [manualSpreadStatus, setManualSpreadStatus] = useState<ManualSpreadStatus>("building");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number; card?: ManualBoardCard } | null>(null);
  const [manualReadingCards, setManualReadingCards] = useState<SpreadInterpretationCard[]>([]);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualIsGenerating, setManualIsGenerating] = useState(false);
  const [journalActionState, setJournalActionState] = useState<"idle" | "saving" | "exporting">("idle");
  const [interpretationVisible, setInterpretationVisible] = useState(false);
  const [interpretationTab, setInterpretationTab] = useState("summary");
  const [mentorTabNew, setMentorTabNew] = useState(false);
  const [protagonistCard, setProtagonistCard] = useState<{ entry: DrawnCard; index: number } | null>(null);
  const [meaningCard, setMeaningCard] = useState<{ cardId: string; image: string } | null>(null);

  const currentPlan = authSession.plan;
  const maxManualCards = getManualSpreadMaxCards(currentPlan);
  const timersRef = useRef<number[]>([]);
  const isManualSpread = spreadId === MANUAL_SPREAD_ID;
  const isManualSpreadFinalized = isManualSpread && manualSpreadStatus === "sealed";

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
      question: readingQuestion.trim() || null,
    });
  }, [drawnCards, interpretationTone, readingQuestion, selectedSpread, status]);

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
  const activeQuestion = isManualSpread ? manualQuestion.trim() : readingQuestion.trim();
  const activeSpreadName = isManualSpread ? MANUAL_SPREAD_META.name : selectedSpread?.name ?? "Tirada";
  const spreadPresentation = getSpreadPresentation(spreadId, activeSpreadName);
  const selectedSpreadDescription = isManualSpread
    ? MANUAL_SPREAD_META.description
    : renderText(selectedSpread?.description ?? "");

  const revealedReadingItems = useMemo(() => {
    if (isManualSpread) {
      if (manualReadingCards.length === 0) {
        return [...manualBoardCards]
          .sort((a, b) => {
            if (a.row !== b.row) return a.row - b.row;
            return a.col - b.col;
          })
          .map((entry, index) => {
            const card = cardById.get(entry.cardId);
            return {
              index: index + 1,
              label: entry.label.trim() || `Posición ${index + 1}`,
              subtitle: "",
              cardName: card?.nameEs ?? "Carta seleccionada",
              orientation: entry.reversed ? "Invertida" : "Derecho",
            };
          });
      }

      return [...manualReadingCards]
        .sort((a, b) => {
          const left = typeof a.position === "string" ? 0 : a.position.id ?? 0;
          const right = typeof b.position === "string" ? 0 : b.position.id ?? 0;
          return left - right;
        })
        .map((entry, index) => ({
          index: index + 1,
          label: typeof entry.position === "string" ? entry.position : entry.position.label,
          subtitle: typeof entry.position === "string" ? "" : entry.position.subtitle ?? "",
          cardName: entry.card.nameEs,
          orientation: entry.reversed ? "Invertida" : "Derecho",
        }));
    }

    return spreadPositions.map((position, index) => {
      const entry = drawnCards[index];
      const isRevealed = visibleCards > index && entry;

      return {
        index: index + 1,
        label: position.label,
        subtitle: position.subtitle ?? "",
        cardName: isRevealed ? entry.card.nameEs : "Por revelar",
        orientation: isRevealed ? (entry.reversed ? "Invertida" : "Derecho") : "Pendiente",
      };
    });
  }, [cardById, drawnCards, isManualSpread, manualBoardCards, manualReadingCards, spreadPositions, visibleCards]);

  const interpretationTabs = useMemo(() => {
    const adviceLabel = spreadId === "celtic-cross" ? "Consejo final integrado" : "Consejo final";

    const tabs: Array<{
      id: string;
      label: string;
      shortLabel: string;
      type: "summary" | "positions" | "relationships" | "advice" | "mentor";
      isNew?: boolean;
    }> = [
      { id: "summary", label: "Resumen general", shortLabel: "Resumen", type: "summary" as const },
      { id: "positions", label: "Lectura por posición", shortLabel: "Posiciones", type: "positions" as const },
      { id: "relationships", label: "Relaciones entre cartas", shortLabel: "Relaciones", type: "relationships" as const },
      { id: "advice", label: adviceLabel, shortLabel: "Consejo", type: "advice" as const },
    ];

    if (aiDepthState === "ready" && aiResponse) {
      tabs.push({
        id: "mentor",
        label: "✨ Mentor",
        shortLabel: "Mentor",
        type: "mentor" as const,
        isNew: mentorTabNew,
      });
    }

    return tabs;
  }, [aiDepthState, aiResponse, mentorTabNew, spreadId]);

  const spreadOptions = useMemo(
    () => [
      ...tarotSpreads.map((spread) => ({
        id: spread.id,
        name: renderText(spread.name),
        description: renderText(spread.description),
        cardCount: spread.cardCount,
        isLocked: currentPlan ? !canUseSpread(currentPlan, spread.id) : true,
        requiredPlan: getRequiredPlanLabel(currentPlan, spread.id),
      })),
      {
        id: MANUAL_SPREAD_ID,
        name: MANUAL_SPREAD_META.name,
        description: MANUAL_SPREAD_META.description,
        cardCount: manualCardCount,
        isLocked: false,
        requiredPlan: null,
      },
    ],
    [currentPlan, manualCardCount],
  );

  const canShowInterpretationCta =
    (!isManualSpread && status === "completada" && drawnCards.length > 0) ||
    (isManualSpread && manualReadingCards.length > 0);

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

  useEffect(() => {
    if (status === "completada" && readingResult && process.env.NODE_ENV !== "production") {
      console.debug("Resultado de tirada listo para persistencia:", readingResult);
    }
  }, [readingResult, status]);

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
    setMentorTabNew(false);
  }

  function clearManualInterpretation(options?: { keepError?: boolean }) {
    setManualReadingCards([]);
    resetAiDepth();
    if (!options?.keepError) {
      setManualError(null);
    }
  }

  function resetPresetReading() {
    clearTimers();
    resetAiDepth();
    setStatus("inicial");
    setDrawnCards([]);
    setVisibleCards(0);
    setActiveRevealIndex(null);
    setReadingResult(null);
    setFlippedCards(new Set());
    setInterpretationVisible(false);
    setInterpretationTab("summary");
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

    resetPresetReading();
    setStatus("barajando");

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
            setInterpretationVisible(true);
            setInterpretationTab("summary");
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
      setInterpretationVisible(true);
      setMentorTabNew(true);
      setInterpretationTab("mentor");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al conectar con la IA";
      setAiDepthError(message === "LIMIT_REACHED" ? "Has alcanzado el límite diario de consultas IA de tu plan." : message);
      setAiDepthState("idle");
    }
  }

  async function handlePresetDepthInterpretation() {
    if (!selectedSpread || !presetQuickInterpretation) {
      return;
    }

    setInterpretationVisible(true);
    setInterpretationTab("summary");
    await requestDepthInterpretation({
      question: readingQuestion.trim() || null,
      spreadType: selectedSpread.id,
      quickInterpretation: presetQuickInterpretation,
      cards: drawnCards,
    });
  }

  function buildManualSpreadCards(cards: ManualBoardCard[]): SpreadInterpretationCard[] {
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
    if (cards.length === 0) {
      return "Debes colocar al menos una carta en el tablero.";
    }

    if (cards.length > manualCardCount) {
      return `Has colocado ${cards.length} cartas, pero seleccionaste un máximo de ${manualCardCount}.`;
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
    setIsModalOpen(false);

    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });

    setManualSpreadStatus("sealed");
    setManualReadingCards(buildManualSpreadCards(manualBoardCards));
    setInterpretationVisible(true);
    setInterpretationTab("summary");
    setManualIsGenerating(false);
  }

  async function handleManualDepthInterpretation() {
    if (!manualQuickInterpretation || manualReadingCards.length === 0) {
      return;
    }

    setInterpretationVisible(true);
    setInterpretationTab("summary");
    await requestDepthInterpretation({
      question: manualQuestion.trim(),
      spreadType: MANUAL_SPREAD_ID,
      quickInterpretation: manualQuickInterpretation,
      cards: manualReadingCards,
    });
  }

  function openProtagonistCard(index: number) {
    const entry = drawnCards[index];
    if (!entry || visibleCards <= index) {
      return;
    }

    setProtagonistCard({ entry, index });
  }

  function openMeaningFromProtagonist() {
    if (!protagonistCard) {
      return;
    }

    setMeaningCard({
      cardId: protagonistCard.entry.card.id,
      image: protagonistCard.entry.card.image,
    });
    setProtagonistCard(null);
  }

  function buildJournalPayload() {
    if (!activeInterpretation) {
      return null;
    }

    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    if (isManualSpread) {
      const customPositions = manualReadingCards.map((entry, index) => ({
        index: index + 1,
        label: typeof entry.position === "string" ? entry.position : entry.position.label,
      }));

      return {
        metadata: {
          consultantName: "",
          date,
          time,
          place: "",
          emotionalState: "",
          spreadType: "Tirada Libre",
          question: manualQuestion.trim(),
        },
        reflection: {
          personalInterpretation: htmlToPlainText(activeInterpretation.summary),
          finalMessage: htmlToPlainText(activeInterpretation.relationships),
          suggestedAction: htmlToPlainText(activeInterpretation.finalAdvice),
        },
        traditionalReading: {
          summary: activeInterpretation.summary,
          positionInterpretations: activeInterpretation.positionReadings.map((item) => ({
            positionNumber: item.positionNumber,
            positionName: item.positionName,
            cardName: item.cardName,
            orientation: item.orientation,
            interpretation: item.interpretation,
          })),
          cardRelationships: activeInterpretation.relationships,
          finalAdvice: activeInterpretation.finalAdvice,
        },
        mentorReading: aiResponse,
        canvas: {
          spreadType: "Tirada Libre",
          spreadId: "free",
          customPositions,
          placements: manualReadingCards.map((entry, index) => ({
            id: `free-${index + 1}`,
            cardId: entry.card.id,
            cardName: entry.card.nameEs,
            image: entry.card.image,
            isReversed: entry.reversed,
            orientation: entry.reversed ? ("invertida" as const) : ("derecha" as const),
            positionId: `free-${index + 1}`,
            positionName: customPositions[index]?.label ?? `Posición ${index + 1}`,
            x: index * 140,
            y: 0,
            order: index + 1,
            rotation: entry.reversed ? 180 : 0,
            meaningUsed: "",
          })),
        },
        flipStats: [],
        flipEvents: [],
        notes: htmlToPlainText(activeInterpretation.summary),
        createdAt: now.toISOString(),
      };
    }

    if (!selectedSpread) {
      return null;
    }

    return {
      metadata: {
        consultantName: "",
        date,
        time,
        place: "",
        emotionalState: "",
        spreadType: renderText(selectedSpread.name),
        question: readingQuestion.trim(),
      },
      reflection: {
        personalInterpretation: htmlToPlainText(activeInterpretation.summary),
        finalMessage: htmlToPlainText(activeInterpretation.relationships),
        suggestedAction: htmlToPlainText(activeInterpretation.finalAdvice),
      },
      traditionalReading: {
        summary: activeInterpretation.summary,
        positionInterpretations: activeInterpretation.positionReadings.map((item) => ({
          positionNumber: item.positionNumber,
          positionName: item.positionName,
          cardName: item.cardName,
          orientation: item.orientation,
          interpretation: item.interpretation,
        })),
        cardRelationships: activeInterpretation.relationships,
        finalAdvice: activeInterpretation.finalAdvice,
      },
      mentorReading: aiResponse,
      canvas: {
        spreadType: renderText(selectedSpread.name),
        spreadId: selectedSpread.id,
        placements: drawnCards.map((entry, index) => ({
          id: `${selectedSpread.id}-${entry.position.id}`,
          cardId: entry.card.id,
          cardName: entry.card.nameEs,
          image: entry.card.image,
          isReversed: entry.reversed,
          orientation: entry.reversed ? ("invertida" as const) : ("derecha" as const),
          positionId: String(entry.position.id),
          positionName: entry.position.label,
          x: entry.position.x * 140,
          y: entry.position.y * 220,
          order: index + 1,
          rotation: entry.reversed ? 180 : 0,
          meaningUsed: "",
        })),
      },
      flipStats: [],
      flipEvents: [],
      notes: htmlToPlainText(activeInterpretation.summary),
      createdAt: now.toISOString(),
    };
  }

  async function persistActiveReading() {
    const payload = buildJournalPayload();
    if (!payload) {
      throw new Error("La lectura todavía no está lista para guardarse.");
    }
    return createJournalEntryInApi(payload);
  }

  async function handleShareReading() {
    const shareText = buildShareableReadingText({
      spreadName: spreadPresentation.title,
      question: activeQuestion,
      positions: revealedReadingItems,
      interpretation: activeInterpretation,
    });

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: spreadPresentation.title, text: shareText });
        return;
      } catch {
        // Fallback to clipboard below.
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareText);
    }
  }

  async function handleExportPdf() {
    if (journalActionState !== "idle") {
      return;
    }

    setJournalActionState("exporting");
    try {
      const savedEntry = await persistActiveReading();
      await exportJournalEntryToPdf(savedEntry.id);
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo exportar el PDF.");
    } finally {
      setJournalActionState("idle");
    }
  }

  async function handleSaveReadingDraft() {
    if (journalActionState !== "idle") {
      return;
    }

    setJournalActionState("saving");
    try {
      const savedEntry = await persistActiveReading();
      router.push(`/diario`);
      return savedEntry;
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo guardar en Bitácora.");
    } finally {
      setJournalActionState("idle");
    }
  }

  function handleSpreadSelection(nextSpreadId: string) {
    if (nextSpreadId === spreadId) {
      return;
    }

    resetPresetReading();
    clearManualInterpretation();
    setManualSpreadStatus("building");
    setSpreadId(nextSpreadId);
  }

  function handleManualQuestionChange(value: string) {
    setManualQuestion(value);
    setManualSpreadStatus("building");
    clearManualInterpretation();
    setInterpretationVisible(false);
  }

  function handleManualCardCountChange(value: number) {
    setManualCardCount(value);
    setManualSpreadStatus("building");
    clearManualInterpretation();
    setInterpretationVisible(false);
  }

  function handleManualAllowRepeatedChange(checked: boolean) {
    setManualAllowRepeated(checked);
    setManualSpreadStatus("building");
    clearManualInterpretation({ keepError: checked });
  }

  function handleCellClick(row: number, col: number) {
    if (isManualSpreadFinalized) {
      return;
    }
    if (manualBoardCards.length >= manualCardCount) {
      setManualError(`No puedes colocar más de ${manualCardCount} cartas.`);
      return;
    }
    setEditingCell({ row, col });
    setIsModalOpen(true);
  }

  function handleCardClick(card: ManualBoardCard) {
    if (isManualSpreadFinalized) {
      return;
    }
    setEditingCell({ row: card.row, col: card.col, card });
    setIsModalOpen(true);
  }

  function handleModalSave(data: { cardId: string; reversed: boolean; label: string; cardSearch: string }) {
    if (!editingCell) return;

    setManualBoardCards((prev) => {
      const existingIndex = prev.findIndex((card) => card.row === editingCell.row && card.col === editingCell.col);
      const nextCard: ManualBoardCard = {
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
        next[existingIndex] = nextCard;
        return next;
      }

      return [...prev, nextCard];
    });

    setManualSpreadStatus("building");
    setManualError(null);
    clearManualInterpretation();
    setInterpretationVisible(false);
  }

  function handleModalDelete() {
    if (!editingCell) return;
    setManualBoardCards((prev) => prev.filter((card) => !(card.row === editingCell.row && card.col === editingCell.col)));
    setIsModalOpen(false);
    setManualSpreadStatus("building");
    clearManualInterpretation();
    setInterpretationVisible(false);
  }

  function resetManualSpread() {
    setManualQuestion("");
    setManualAllowRepeated(false);
    setManualCardCount(Math.min(3, maxManualCards));
    setManualBoardCards([]);
    setManualSpreadStatus("building");
    setIsModalOpen(false);
    setEditingCell(null);
    setManualReadingCards([]);
    setManualError(null);
    setJournalActionState("idle");
    resetAiDepth();
    setInterpretationVisible(false);
    setInterpretationTab("summary");
  }

  return (
    <>
      <ReadingExperienceShell
      authStatus={authSession.status}
      authEmail={authSession.email}
      currentPlan={currentPlan}
      spreadId={spreadId}
      spreadOptions={spreadOptions}
      selectedSpread={selectedSpread}
      selectedSpreadPositions={selectedSpread?.positions ?? []}
      selectedSpreadDescription={selectedSpreadDescription}
      spreadPresentation={spreadPresentation}
      isManualSpread={isManualSpread}
      isBusy={isBusy}
      status={status}
      readingQuestion={readingQuestion}
      onReadingQuestionChange={setReadingQuestion}
      manualQuestion={manualQuestion}
      onManualQuestionChange={handleManualQuestionChange}
      manualCardCount={manualCardCount}
      manualPlacedCardCount={manualBoardCards.length}
      manualIsFinalized={isManualSpreadFinalized}
      maxManualCards={maxManualCards}
      onManualCardCountChange={handleManualCardCountChange}
      manualAllowRepeated={manualAllowRepeated}
      onManualAllowRepeatedChange={handleManualAllowRepeatedChange}
      manualError={manualError}
      manualIsGenerating={manualIsGenerating}
      aiDepthState={aiDepthState}
      aiDepthError={aiDepthError}
      interpretationVisible={interpretationVisible}
      onInterpretationVisibilityChange={setInterpretationVisible}
      interpretationTab={interpretationTab}
      onInterpretationTabChange={(nextTab) => {
        if (nextTab === "mentor") {
          setMentorTabNew(false);
        }
        setInterpretationTab(nextTab);
      }}
      interpretationTabs={interpretationTabs}
      mentorTabNew={mentorTabNew}
      revealedReadingItems={revealedReadingItems}
      activeQuestion={activeQuestion}
      activeInterpretation={activeInterpretation}
      aiResponse={aiResponse}
      canShowInterpretationCta={canShowInterpretationCta}
      onPrimaryInterpretationCta={isManualSpread ? handleManualDepthInterpretation : handlePresetDepthInterpretation}
      onManualPrepare={handleManualInterpretation}
      onStartReading={startReading}
      onResetPresetReading={resetPresetReading}
      onResetManualSpread={resetManualSpread}
      onSpreadChange={(nextSpreadId) => {
        if (nextSpreadId === MANUAL_SPREAD_ID) {
          handleSpreadSelection(nextSpreadId);
          return;
        }

        const nextSpread = tarotSpreads.find((spread) => spread.id === nextSpreadId);
        if (!nextSpread) {
          return;
        }

        const isAllowed = currentPlan ? canUseSpread(currentPlan, nextSpread.id) : false;
        if (!isAllowed) {
          router.push(`/planes?from=feature&feature=${nextSpread.id}`);
          return;
        }

        handleSpreadSelection(nextSpread.id);
      }}
      onShareReading={handleShareReading}
      onExportPdf={handleExportPdf}
      onSaveReadingDraft={handleSaveReadingDraft}
      getPlanAccent={getPlanAccent}
      getUserInitial={getUserInitial}
      boardContent={
        isManualSpread ? (
          <>
            <ManualSpreadBoard
              cards={manualBoardCards}
              manualCardCount={manualCardCount}
              isLocked={isManualSpreadFinalized}
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
              allowRepeated={manualAllowRepeated}
              usedCardIds={manualAllowRepeated ? [] : manualBoardCards.map((card) => card.cardId)}
            />
          </>
        ) : (
          <div className="reading-canvas-stage">
            <div className="reading-canvas">
              {selectedSpread ? (
                <SpreadLayout
                  spread={selectedSpread}
                  drawnCards={drawnCards}
                  visibleCards={visibleCards}
                  status={status}
                  activeRevealIndex={activeRevealIndex}
                  flippedCards={flippedCards}
                  onToggleFlip={openProtagonistCard}
                />
              ) : null}
            </div>
          </div>
        )
      }
      />
      <CardProtagonistModal
        isOpen={Boolean(protagonistCard)}
        entry={protagonistCard?.entry ?? null}
        positionNumber={protagonistCard ? protagonistCard.index + 1 : null}
        onClose={() => setProtagonistCard(null)}
        onOpenMeaning={openMeaningFromProtagonist}
      />
      <TarotCardModal
        isOpen={Boolean(meaningCard)}
        onClose={() => setMeaningCard(null)}
        cardId={meaningCard?.cardId ?? null}
        imageUrl={meaningCard?.image}
        simulatePlan={currentPlan ?? undefined}
      />
    </>
  );
}
