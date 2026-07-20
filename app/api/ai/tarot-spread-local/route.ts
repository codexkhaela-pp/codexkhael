import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import {
  generateWithOllamaDetailed,
  getOllamaRuntimeConfig,
  OllamaClientError,
} from "@/lib/ai/ollama-client";
import {
  buildCompactCardContext,
  formatAiCardContextAudit,
  formatCompactCardContextDebug,
  isTarotOrientation,
  isTarotScope,
  normalizeInput,
  type CompactCardContext,
  type TarotCardData,
  type TarotCardOrientation,
  type TarotLocalScope,
} from "@/lib/ai/tarot-official-context";
import { getTarotCardById } from "@/lib/tarot-data";
import { prisma } from "@/lib/prisma";
import { resolvePlanTier, type PlanTier } from "@/lib/plans";
import { canUseManualSpreadCardCount, canUseSpread, MANUAL_SPREAD_ID } from "@/lib/features";

export const runtime = "nodejs";
const IS_DEV = process.env.NODE_ENV === "development";

const ALLOWED_SPREAD_TYPES = [
  "three_cards",
  "five_cards",
  "horseshoe",
  "celtic_cross",
  "custom",
] as const;

const SPREAD_CONFIG = {
  three_cards: {
    internalId: "situation-blockage-advice",
    exactCards: 3,
  },
  five_cards: {
    internalId: "five-cards",
    exactCards: 5,
  },
  horseshoe: {
    internalId: "horseshoe",
    exactCards: 7,
  },
  celtic_cross: {
    internalId: "celtic-cross",
    exactCards: 10,
  },
  custom: {
    internalId: MANUAL_SPREAD_ID,
    exactCards: null,
  },
} as const;

const PLAN_CONSTRAINTS: Record<
  PlanTier,
  {
    historyWordMin: number;
    historyWordLimit: number;
    dynamicWordLimit: number;
    dynamicWordMin: number;
    riskWordLimit: number;
    riskWordMin: number;
    adviceWordLimit: number;
    adviceWordMin: number;
    numPredict: number;
    scopeMaxChars: number;
    scopeMinChars: number;
    generalMaxChars: number;
    temperature: number;
  }
> = {
  FREE: {
    historyWordMin: 150,
    historyWordLimit: 250,
    dynamicWordLimit: 100,
    dynamicWordMin: 60,
    riskWordLimit: 80,
    riskWordMin: 45,
    adviceWordLimit: 90,
    adviceWordMin: 50,
    numPredict: 500,
    scopeMaxChars: 650,
    scopeMinChars: 450,
    generalMaxChars: 150,
    temperature: 0.3,
  },
  BASIC: {
    historyWordMin: 150,
    historyWordLimit: 250,
    dynamicWordLimit: 100,
    dynamicWordMin: 60,
    riskWordLimit: 80,
    riskWordMin: 45,
    adviceWordLimit: 90,
    adviceWordMin: 50,
    numPredict: 500,
    scopeMaxChars: 650,
    scopeMinChars: 450,
    generalMaxChars: 150,
    temperature: 0.3,
  },
  PRO: {
    historyWordMin: 150,
    historyWordLimit: 250,
    dynamicWordLimit: 100,
    dynamicWordMin: 60,
    riskWordLimit: 80,
    riskWordMin: 45,
    adviceWordLimit: 90,
    adviceWordMin: 50,
    numPredict: 500,
    scopeMaxChars: 650,
    scopeMinChars: 450,
    generalMaxChars: 150,
    temperature: 0.3,
  },
};

type SpreadType = (typeof ALLOWED_SPREAD_TYPES)[number];

type TarotSpreadCardRequest = {
  cardId?: unknown;
  position?: unknown;
  orientation?: unknown;
  scope?: unknown;
};

type TarotSpreadLocalRequest = {
  question?: unknown;
  spreadType?: unknown;
  cards?: unknown;
  plan?: unknown;
};

type ValidatedSpreadCard = {
  cardId: string;
  position: string;
  orientation: TarotCardOrientation;
  scope: TarotLocalScope;
};

type TarotSpreadReading = {
  mensaje_central: string;
  historia: string;
  dinamica: string;
  riesgo: string;
  consejo: string;
  accion: string;
};

type TarotSpreadProReading = {
  aprendizaje_tarot: {
    cartas_clave: Array<{
      carta: string;
      aporte: string;
    }>;
    interaccion_simbolica: string;
    leccion_tarotista: string;
  };
  mensaje_central: string;
  historia_profunda: string;
  dinamica_oculta: string;
  sombra: string;
  oportunidad: string;
  riesgo: string;
  consejo: string;
  accion_concreta: string;
  pregunta_reflexiva: string;
  mentor_khael: string;
  sintesis_final: string;
};

type TarotLearningCardKey = {
  carta: string;
  aporte: string;
};

type TarotLearningBlock = {
  cartas_clave: TarotLearningCardKey[];
  interaccion_simbolica: string;
  leccion_tarotista: string;
};

type TopicVocabulary = {
  preferredWords: string[];
  preferredConcepts: string[];
  avoidWords: string[];
};

type NarrativeTone =
  | "decisivo"
  | "sereno"
  | "expansivo"
  | "emocional"
  | "practico"
  | "transformador";

type ReversedWeight = "low" | "medium" | "high";

type TarotStructuredInterpretation = {
  tema: string;
  carta_dominante: string;
  eje_central: string;
  nivel_transformacion: "bajo" | "medio" | "alto";
  narrativeTone?: NarrativeTone;
  reversedWeight?: ReversedWeight;
  conflicto_principal: string;
  tension_central: string;
  deseo_visible: string;
  miedo_oculto: string;
  patron_repetido: string;
  bloqueo_actual: string;
  recurso_disponible: string;
  oportunidad_real: string;
  riesgo_real: string;
  direccion_recomendada: string;
  tono_emocional: string;
  evidencia_simbolica?: Record<string, string>;
};

const TOPIC_VOCABULARY: Record<TarotLocalScope, TopicVocabulary> = {
  trabajo: {
    preferredWords: [
      "proyecto",
      "responsabilidad",
      "liderazgo",
      "equipo",
      "posición",
      "decisión",
      "avance",
      "objetivo",
      "desarrollo",
    ],
    preferredConcepts: [
      "crecimiento profesional",
      "autoridad",
      "negociación",
      "rendimiento",
      "oportunidades",
    ],
    avoidWords: ["alma gemela", "destino romántico", "sanación emocional"],
  },
  amor: {
    preferredWords: [
      "vínculo",
      "afecto",
      "intimidad",
      "confianza",
      "cercanía",
      "relación",
      "emociones",
    ],
    preferredConcepts: [
      "conexión emocional",
      "reciprocidad afectiva",
      "compromiso",
      "apertura emocional",
    ],
    avoidWords: ["ascenso", "liderazgo corporativo", "rendimiento laboral"],
  },
  dinero: {
    preferredWords: ["recursos", "ingresos", "gastos", "estabilidad", "ahorro", "inversión"],
    preferredConcepts: ["seguridad económica", "administración", "riesgo financiero"],
    avoidWords: ["romance", "alma gemela"],
  },
  salud: {
    preferredWords: ["cuerpo", "descanso", "energía", "recuperación", "equilibrio físico", "hábitos"],
    preferredConcepts: ["bienestar", "cuidado personal", "ritmo saludable"],
    avoidWords: ["ascenso", "negocio", "rentabilidad"],
  },
  viajes: {
    preferredWords: ["destino", "trayecto", "experiencia", "descanso", "planificación", "comodidad", "aventura"],
    preferredConcepts: ["exploración", "movimiento", "descubrimiento", "celebración"],
    avoidWords: ["ascenso", "jerarquía", "cargo"],
  },
  espiritual: {
    preferredWords: ["propósito", "aprendizaje", "conciencia", "crecimiento interior", "integración"],
    preferredConcepts: ["evolución personal", "comprensión profunda", "desarrollo espiritual"],
    avoidWords: ["rentabilidad", "cargo", "promoción"],
  },
  general: {
    preferredWords: ["situación", "decisión", "proceso", "cambio", "elección", "camino"],
    preferredConcepts: ["comprensión práctica", "lectura integral", "maduración del proceso"],
    avoidWords: [],
  },
};

function isSpreadType(value: unknown): value is SpreadType {
  return typeof value === "string" && (ALLOWED_SPREAD_TYPES as readonly string[]).includes(value);
}

function normalizePlan(value: unknown): PlanTier | null {
  return value === "FREE" || value === "BASIC" || value === "PRO" ? value : null;
}

function validateCards(cards: unknown): ValidatedSpreadCard[] | null {
  if (!Array.isArray(cards) || cards.length === 0) {
    return null;
  }

  const normalizedCards = cards.map((item) => {
    const raw = item as TarotSpreadCardRequest;
    const cardId = normalizeInput(raw?.cardId);
    const position = normalizeInput(raw?.position);
    const orientation = raw?.orientation;
    const scope = raw?.scope;

    if (!cardId || !position || !isTarotOrientation(orientation) || !isTarotScope(scope)) {
      return null;
    }

    return {
      cardId,
      position,
      orientation,
      scope,
    };
  });

  return normalizedCards.every(Boolean) ? (normalizedCards as ValidatedSpreadCard[]) : null;
}

function validateSpreadCardCount(spreadType: SpreadType, cardCount: number): string | null {
  const expectedCount = SPREAD_CONFIG[spreadType].exactCards;
  if (expectedCount === null) {
    return cardCount >= 1 ? null : "La tirada personalizada requiere al menos una carta.";
  }

  if (cardCount !== expectedCount) {
    return `La tirada ${spreadType} requiere exactamente ${expectedCount} cartas.`;
  }

  return null;
}

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function truncateText(value: string, maxChars: number): string {
  const normalized = compactWhitespace(value);
  if (normalized.length <= maxChars) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
}

function firstSentence(value: string, fallbackMaxChars = 220): string {
  const normalized = compactWhitespace(value);
  const match = normalized.match(/.+?[.!?](?:\s|$)/);
  return truncateText(match?.[0] ?? normalized, fallbackMaxChars);
}

function lowerSentenceStart(value: string): string {
  const normalized = compactWhitespace(value);
  if (!normalized) {
    return "";
  }

  return normalized.charAt(0).toLowerCase() + normalized.slice(1);
}

function orientationText(orientation: TarotCardOrientation): string {
  return orientation === "upright" ? "derecha" : "invertida";
}

function isCupCard(cardName: string): boolean {
  return /Copas/i.test(cardName);
}

function getNarrativeTone(
  cards: CompactCardContext[],
  dominantCard: CompactCardContext,
  scope: TarotLocalScope,
  transformationLevel: "bajo" | "medio" | "alto",
): NarrativeTone {
  if (
    transformationLevel === "alto" ||
    ["La Torre", "La Muerte", "Diez de Espadas"].includes(dominantCard.cardName)
  ) {
    return "transformador";
  }

  if (["El Emperador", "Rey de Bastos", "La Justicia"].includes(dominantCard.cardName)) {
    return "decisivo";
  }

  if (["Reina de Oros", "Cuatro de Bastos", "La Templanza"].includes(dominantCard.cardName)) {
    return "sereno";
  }

  if (["Ocho de Bastos", "La Rueda de la Fortuna", "Tres de Bastos"].includes(dominantCard.cardName)) {
    return "expansivo";
  }

  if (["Dos de Espadas", "Caballero de Oros", "Ocho de Oros"].includes(dominantCard.cardName)) {
    return "practico";
  }

  if (scope === "amor" || cards.filter((card) => isCupCard(card.cardName)).length >= Math.ceil(cards.length / 2)) {
    return "emocional";
  }

  return "sereno";
}

function getReversedWeight(cards: CompactCardContext[], dominantCard: CompactCardContext): ReversedWeight {
  const reversedCards = cards.filter((card) => card.orientation === "reversed");
  if (reversedCards.length === 0) {
    return "low";
  }

  if (dominantCard.orientation === "reversed") {
    return "high";
  }

  if (
    reversedCards.some((card) =>
      /bloqueo|obst[aá]culo|sombra|riesgo|miedo|desaf[ií]o/i.test(card.position),
    )
  ) {
    return "high";
  }

  if (reversedCards.some((card) => /consejo|gu[ií]a|direcci[oó]n|salida/i.test(card.position))) {
    return "medium";
  }

  return reversedCards.length > 1 ? "medium" : "low";
}

function stripTemplateArtifacts(value: string): string {
  return compactWhitespace(value)
    .replace(/Y la manera en que eso reorganiza consejo\.?/gi, "")
    .replace(/\by la manera en que eso reorganiza consejo\.?/gi, "")
    .replace(/\ben (viajes|amor|trabajo|dinero|salud|espiritual|general),?\s*esta carta activa\b/gi, "")
    .replace(/\blas dem[aá]s cartas deben leerse desde en\b/gi, "las demás cartas deben leerse desde")
    .replace(/\bmuestra el recurso que acompa[ñn]a el eje\b/gi, "")
    .replace(/\bintroduce la tensi[oó]n que obliga\b/gi, "")
    .replace(/\ba[ñn]ade un matiz secundario\b/gi, "")
    .replace(/\s+\./g, ".")
    .replace(/\.\s*\./g, ".")
    .trim();
}

function buildFallbackCentralAxis(
  dominantCard: CompactCardContext,
  supportCard: CompactCardContext,
  scope: TarotLocalScope,
): string {
  if (dominantCard.cardName === "Dos de Espadas") {
    return scope === "viajes"
      ? "pausar antes de decidir si el viaje responde a una necesidad real o a una reacción momentánea"
      : "pausar antes de decidir para distinguir entre una reacción inmediata y una elección realmente consciente";
  }

  const dominantAction = lowerSentenceStart(firstSentence(dominantCard.scopeMeaning, 130));
  const supportPosition = supportCard.position.toLowerCase();
  return truncateText(stripTemplateArtifacts(`${dominantAction} frente a lo que plantea ${supportPosition}`), 170);
}

function resolvePrimaryScope(cards: CompactCardContext[]): TarotLocalScope {
  const counts = new Map<TarotLocalScope, number>();
  for (const card of cards) {
    counts.set(card.scope, (counts.get(card.scope) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "general";
}

function getTopicVocabulary(scope: TarotLocalScope): TopicVocabulary {
  return TOPIC_VOCABULARY[scope] ?? TOPIC_VOCABULARY.general;
}

function formatTopicVocabularyForPrompt(scope: TarotLocalScope, vocabulary: TopicVocabulary): string {
  return JSON.stringify({
    tema: scope,
    preferredWords: vocabulary.preferredWords,
    preferredConcepts: vocabulary.preferredConcepts,
    avoidWords: vocabulary.avoidWords,
  });
}

function applyTopicVocabularyToText(value: string, scope: TarotLocalScope): string {
  if (scope === "trabajo" || scope === "general") {
    return value;
  }

  const replacements: Partial<Record<TarotLocalScope, Array<[RegExp, string]>>> = {
    amor: [
      [/\bascenso\b/gi, "acercamiento"],
      [/\bautoridad\b/gi, "confianza"],
      [/\bposición\b/gi, "lugar emocional"],
      [/\bresponsabilidad\b/gi, "compromiso"],
      [/\brendimiento\b/gi, "respuesta afectiva"],
    ],
    dinero: [
      [/\bascenso\b/gi, "mejora económica"],
      [/\bautoridad\b/gi, "control de recursos"],
      [/\bposición\b/gi, "base financiera"],
      [/\breconocimiento\b/gi, "resultado económico"],
    ],
    salud: [
      [/\bascenso\b/gi, "mejora gradual"],
      [/\bautoridad\b/gi, "cuidado del cuerpo"],
      [/\bposición\b/gi, "estado físico"],
      [/\bresponsabilidad\b/gi, "hábito de cuidado"],
      [/\breconocimiento\b/gi, "señal del cuerpo"],
    ],
    viajes: [
      [/\bascenso\b/gi, "movimiento"],
      [/\bautoridad\b/gi, "autonomía"],
      [/\bposición\b/gi, "destino"],
      [/\bresponsabilidad\b/gi, "planificación"],
      [/\breconocimiento\b/gi, "confirmación del trayecto"],
      [/\bproyecto\b/gi, "viaje"],
      [/\bequipo\b/gi, "compañía"],
    ],
    espiritual: [
      [/\bascenso\b/gi, "avance interior"],
      [/\bautoridad\b/gi, "centro interno"],
      [/\bposición\b/gi, "lugar de conciencia"],
      [/\bresponsabilidad\b/gi, "integración"],
      [/\brendimiento\b/gi, "maduración interior"],
    ],
  };

  return (replacements[scope] ?? []).reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    value,
  );
}

function applyTopicVocabularyToStructured(
  structured: TarotStructuredInterpretation,
  scope: TarotLocalScope,
): TarotStructuredInterpretation {
  return {
    ...structured,
    conflicto_principal: applyTopicVocabularyToText(structured.conflicto_principal, scope),
    tension_central: applyTopicVocabularyToText(structured.tension_central, scope),
    deseo_visible: applyTopicVocabularyToText(structured.deseo_visible, scope),
    miedo_oculto: applyTopicVocabularyToText(structured.miedo_oculto, scope),
    patron_repetido: applyTopicVocabularyToText(structured.patron_repetido, scope),
    bloqueo_actual: applyTopicVocabularyToText(structured.bloqueo_actual, scope),
    recurso_disponible: applyTopicVocabularyToText(structured.recurso_disponible, scope),
    oportunidad_real: applyTopicVocabularyToText(structured.oportunidad_real, scope),
    riesgo_real: applyTopicVocabularyToText(structured.riesgo_real, scope),
    direccion_recomendada: applyTopicVocabularyToText(structured.direccion_recomendada, scope),
  };
}

function buildReversedMeaning(card: CompactCardContext): string {
  if (card.cardName === "Caballero de Copas") {
    return "idealización, promesas poco consistentes y seducción emocional que todavía no se traduce en actos claros";
  }

  if (card.cardName === "Diez de Oros") {
    return "una expectativa de estabilidad heredada que no termina de sentirse disponible o compartida";
  }

  if (card.cardName === "Dos de Espadas") {
    return "evitación, demora interna y dificultad para mirar de frente la información que falta";
  }

  if (card.cardName === "Siete de Copas") {
    return "confusión entre deseo real, fantasía atractiva y opciones que prometen más de lo que sostienen";
  }

  return lowerSentenceStart(firstSentence(card.scopeMeaning, 160));
}

function applyReversedWeightToStructured(
  structured: TarotStructuredInterpretation,
  cards: CompactCardContext[],
): TarotStructuredInterpretation {
  const dominantCard = cards.find((card) => card.cardName === structured.carta_dominante) ?? cards[0];
  const reversedWeight = getReversedWeight(cards, dominantCard);
  const keyReversed =
    cards.find((card) => card.orientation === "reversed" && card.cardName === dominantCard.cardName) ??
    cards.find((card) => card.orientation === "reversed" && /bloqueo|sombra|riesgo|obst[aá]culo/i.test(card.position)) ??
    cards.find((card) => card.orientation === "reversed");

  if (!keyReversed) {
    return {
      ...structured,
      reversedWeight,
    };
  }

  const reversedMeaning = buildReversedMeaning(keyReversed);
  const patch =
    reversedWeight === "high"
      ? `La inversión de ${keyReversed.cardName} pesa con fuerza: introduce ${reversedMeaning}.`
      : `La inversión de ${keyReversed.cardName} añade un matiz de ${reversedMeaning}.`;

  return {
    ...structured,
    reversedWeight,
    conflicto_principal: truncateText(`${structured.conflicto_principal} ${patch}`, 420),
    bloqueo_actual: truncateText(`${structured.bloqueo_actual} ${patch}`, 360),
    riesgo_real: truncateText(`${structured.riesgo_real} Si no se atiende, ese matiz puede distorsionar la lectura de la situación.`, 320),
    direccion_recomendada: truncateText(`${structured.direccion_recomendada} Conviene responder a esa inversión con hechos observables, no solo con impulso o expectativa.`, 340),
  };
}

function findCardByPosition(
  cards: Array<{ compactContext: CompactCardContext }>,
  patterns: RegExp[],
): CompactCardContext | null {
  for (const pattern of patterns) {
    const match = cards.find(({ compactContext }) => pattern.test(compactContext.position));
    if (match) {
      return match.compactContext;
    }
  }

  return null;
}

function hasBlockingSignal(card: CompactCardContext): boolean {
  return (
    card.orientation === "reversed" ||
    /bloqueo|obst[aá]culo|sombra|riesgo|miedo|desaf[ií]o/i.test(card.position)
  );
}

function hasSupportSignal(card: CompactCardContext): boolean {
  return /consejo|gu[ií]a|direcci[oó]n|resultado|salida|recurso|oportunidad/i.test(card.position);
}

const MAJOR_ARCANA_NAMES = new Set([
  "El Loco",
  "El Mago",
  "La Sacerdotisa",
  "La Emperatriz",
  "El Emperador",
  "El Hierofante",
  "Los Enamorados",
  "El Carro",
  "La Fuerza",
  "El Ermitaño",
  "La Rueda de la Fortuna",
  "La Justicia",
  "El Colgado",
  "La Muerte",
  "La Templanza",
  "El Diablo",
  "La Torre",
  "La Estrella",
  "La Luna",
  "El Sol",
  "El Juicio",
  "El Mundo",
]);

const DISRUPTIVE_CARD_NAMES = new Set([
  "La Torre",
  "La Muerte",
  "Diez de Espadas",
  "Cinco de Oros",
  "El Diablo",
  "Ocho de Espadas",
  "Cinco de Copas",
]);

function isMajorArcana(cardName: string): boolean {
  return MAJOR_ARCANA_NAMES.has(cardName);
}

function isDisruptiveCard(cardName: string): boolean {
  return DISRUPTIVE_CARD_NAMES.has(cardName);
}

function getPositionWeight(position: string): number {
  if (/situaci[oÃ³]n|actual|presente|origen|centro/i.test(position)) {
    return 2;
  }
  if (/bloqueo|obst[aÃ¡]culo|sombra|riesgo|desaf[iÃ­]o/i.test(position)) {
    return 2.2;
  }
  if (/consejo|gu[iÃ­]a|direcci[oÃ³]n|resultado|aprendizaje/i.test(position)) {
    return 2.4;
  }
  return 1.5;
}

function getDominantCard(cards: CompactCardContext[]): CompactCardContext {
  return cards.reduce((best, current) => {
    const bestScore =
      getPositionWeight(best.position) +
      (isMajorArcana(best.cardName) ? 3 : 0) +
      (isDisruptiveCard(best.cardName) ? 4 : 0) +
      (best.orientation === "reversed" ? 1 : 0);
    const currentScore =
      getPositionWeight(current.position) +
      (isMajorArcana(current.cardName) ? 3 : 0) +
      (isDisruptiveCard(current.cardName) ? 4 : 0) +
      (current.orientation === "reversed" ? 1 : 0);
    return currentScore > bestScore ? current : best;
  });
}

function getTransformationLevel(cards: CompactCardContext[], dominantCard: CompactCardContext): "bajo" | "medio" | "alto" {
  const reversedCount = cards.filter((card) => card.orientation === "reversed").length;
  if (isDisruptiveCard(dominantCard.cardName) || reversedCount >= Math.ceil(cards.length / 2)) {
    return "alto";
  }
  if (isMajorArcana(dominantCard.cardName) || reversedCount > 0) {
    return "medio";
  }
  return "bajo";
}

function buildCentralAxis(
  dominantCard: CompactCardContext,
  question: string,
  supportCard: CompactCardContext,
): string {
  const dominantName = dominantCard.cardName;
  if (dominantName === "La Torre") {
    return `revision de estructuras de ${dominantCard.scope} que ya no sostienen ${question.toLowerCase()}`;
  }
  if (dominantName === "La Muerte") {
    return `cierre necesario de una etapa para que ${question.toLowerCase()} entre en otra forma de desarrollo`;
  }
  if (dominantName === "El Diablo") {
    return `reconocimiento de ataduras o pactos internos que distorsionan ${question.toLowerCase()}`;
  }
  if (dominantName === "La Estrella") {
    return `recuperacion gradual de fe y sentido para que ${question.toLowerCase()} avance con mayor coherencia`;
  }
  if (dominantName === "Reina de Espadas" || dominantName === "La Reina de Espadas") {
    return `necesidad de mirar ${question.toLowerCase()} con lucidez, criterio y menos concesiones sentimentales`;
  }
  if (dominantName === "Siete de Bastos") {
    return "defender una posicion ganada ante una oferta que puede traer autoridad, presion y nuevas exigencias";
  }
  if (dominantName === "Rey de Bastos") {
    return "sostener liderazgo y vision sin convertir el ascenso en una carga que robe autoridad";
  }
  if (dominantName === "Siete de Copas") {
    return "separar posibilidades reales de promesas atractivas antes de comprometer prestigio, tiempo o energia";
  }

  return buildFallbackCentralAxis(dominantCard, supportCard, dominantCard.scope);
}

function buildDominantVocabularyHint(structured: TarotStructuredInterpretation): string {
  switch (structured.carta_dominante) {
    case "Siete de Bastos":
      return "Prioriza defender, posicion ganada, presion, limite, sostener postura, autoridad, exigencia, resistencia, negociacion y ascenso. No dejes que reciprocidad, apoyo, intercambio, equilibrio o sobreentrega gobiernen la lectura.";
    case "La Torre":
      return "Prioriza ruptura de estructuras obsoletas, verdad incomoda, decision aplazada, falsa seguridad y reconstruccion honesta.";
    case "Rey de Bastos":
      return "Prioriza liderazgo, vision, autoridad, decision y capacidad de dirigir con madurez.";
    case "Siete de Copas":
      return "Prioriza discernimiento, seleccion, dispersion, seduccion de alternativas y criterio para elegir.";
    default:
      return "Haz que la carta dominante gobierne el tono, las imagenes y la conclusion.";
  }
}

function buildStructuredInterpretation(
  question: string,
  cards: Array<{ compactContext: CompactCardContext }>,
): TarotStructuredInterpretation {
  const compactCards = cards.map(({ compactContext }) => compactContext);
  const firstCard = compactCards[0];
  const middleCard = compactCards[Math.floor((compactCards.length - 1) / 2)];
  const lastCard = compactCards[compactCards.length - 1];
  const blockingCard =
    findCardByPosition(cards, [/bloqueo/i, /obst[aá]culo/i, /sombra/i, /riesgo/i, /miedo/i]) ??
    compactCards.find((card) => card.orientation === "reversed") ??
    middleCard;
  const adviceCard =
    findCardByPosition(cards, [/consejo/i, /direcci[oó]n/i, /salida/i, /resultado/i, /gu[ií]a/i, /aprendizaje/i]) ??
    lastCard;
  const situationCard =
    findCardByPosition(cards, [/situaci[oó]n/i, /presente/i, /origen/i, /centro/i, /actual/i]) ??
    firstCard;
  const reversedCount = compactCards.filter((card) => card.orientation === "reversed").length;
  const tone =
    reversedCount >= Math.ceil(compactCards.length / 2)
      ? "contenido, tenso y defensivo"
      : reversedCount > 0
        ? "atento, ambivalente y exigido"
        : "dispuesto, expectante y enfocado";

  const situationSnippet = firstSentence(situationCard.scopeMeaning, 220);
  const blockingSnippet = firstSentence(blockingCard.scopeMeaning, 220);
  const adviceSnippet = firstSentence(adviceCard.scopeMeaning, 220);
  const bridgeCard = compactCards.length > 2 ? middleCard : adviceCard;
  const bridgeSnippet = firstSentence(bridgeCard.scopeMeaning, 220);

  return {
    tema: question,
    carta_dominante: firstCard.cardName,
    eje_central: truncateText(lowerSentenceStart(bridgeSnippet), 160),
    nivel_transformacion: reversedCount > 0 ? "medio" : "bajo",
    conflicto_principal: truncateText(
      `La posicion ${situationCard.position} muestra que la situacion se juega en ${situationSnippet.toLowerCase()} y queda presionada por ${blockingSnippet.toLowerCase()}.`,
      320,
    ),
    tension_central: truncateText(
      `La tension nace entre lo que la persona quiere mover ahora y la manera en que sigue reaccionando frente a ${blockingCard.position.toLowerCase()}; el cruce con ${adviceCard.position.toLowerCase()} obliga a elegir entre seguir repitiendo inercia o asumir una postura distinta.`,
      340,
    ),
    deseo_visible: truncateText(
      `Quiere resolver ${question.toLowerCase()} sin perder margen, pero tambien sin quedar expuesto a una consecuencia que todavia siente dificil de sostener.`,
      260,
    ),
    miedo_oculto: truncateText(
      `Debajo del discurso visible aparece el temor a confirmar una perdida, una limitacion o una responsabilidad que ya no se puede posponer; por eso la reaccion oscila entre controlar demasiado y demorarse.`,
      280,
    ),
    patron_repetido: truncateText(
      `Cuando algo exige definicion, vuelve a un ciclo de prudencia excesiva, lectura mental del escenario y aplazamiento del paso concreto.`,
      220,
    ),
    bloqueo_actual: truncateText(
      `El bloqueo actual no es falta de recursos, sino la mezcla entre ${blockingSnippet.toLowerCase()} y la tendencia a sostener una posicion conocida aunque ya no alcance.`,
      280,
    ),
    recurso_disponible: truncateText(
      `El recurso disponible aparece en ${situationCard.position.toLowerCase()}: ${situationSnippet}`,
      240,
    ),
    oportunidad_real: truncateText(
      `Si deja de responder desde la defensa, se abre una salida ligada a ${adviceSnippet.toLowerCase()} y a una decision mas simple, visible y sostenida.`,
      260,
    ),
    riesgo_real: truncateText(
      `Si insiste en el patron actual, la situacion puede degradarse en cansancio, mal calculo del momento y perdida de confianza en su propio criterio.`,
      240,
    ),
    direccion_recomendada: truncateText(
      `La direccion recomendada pasa por usar ${bridgeCard.position.toLowerCase()} como bisagra y llevar lo que hoy esta disperso hacia un gesto concreto, verificable y sobrio.`,
      240,
    ),
    tono_emocional: tone,
  };
}

function buildStructuredInterpretationPro(
  question: string,
  cards: Array<{ compactContext: CompactCardContext }>,
): TarotStructuredInterpretation {
  const compactCards = cards.map(({ compactContext }) => compactContext);
  const firstCard = compactCards[0];
  const middleCard = compactCards[Math.floor((compactCards.length - 1) / 2)];
  const lastCard = compactCards[compactCards.length - 1];
  const blockingCard =
    findCardByPosition(cards, [/bloqueo/i, /obst[aÃ¡]culo/i, /sombra/i, /riesgo/i, /miedo/i]) ??
    compactCards.find((card) => card.orientation === "reversed") ??
    middleCard;
  const adviceCard =
    findCardByPosition(cards, [/consejo/i, /direcci[oÃ³]n/i, /salida/i, /resultado/i, /gu[iÃ­]a/i, /aprendizaje/i]) ??
    lastCard;
  const situationCard =
    findCardByPosition(cards, [/situaci[oÃ³]n/i, /presente/i, /origen/i, /centro/i, /actual/i]) ??
    firstCard;
  const reversedCount = compactCards.filter((card) => card.orientation === "reversed").length;
  const blockingSignals = compactCards.filter(hasBlockingSignal).length;
  const supportSignals = compactCards.filter(hasSupportSignal).length;
  const mostlyConstructive = reversedCount === 0 && blockingSignals <= 1;
  const situationSnippet = firstSentence(situationCard.scopeMeaning, 220);
  const blockingSnippet = firstSentence(blockingCard.scopeMeaning, 220);
  const adviceSnippet = firstSentence(adviceCard.scopeMeaning, 220);
  const bridgeCard = compactCards.length > 2 ? middleCard : adviceCard;
  const bridgeSnippet = firstSentence(bridgeCard.scopeMeaning, 220);
  const adviceClause = lowerSentenceStart(adviceSnippet);
  const bridgeClause = lowerSentenceStart(bridgeSnippet);
  const situationClause = lowerSentenceStart(situationSnippet);
  const blockingClause = lowerSentenceStart(blockingSnippet);
  const dominantCard = getDominantCard(compactCards);
  const nivelTransformacion = getTransformationLevel(compactCards, dominantCard);
  const ejeCentral = buildCentralAxis(dominantCard, question, adviceCard);
  const dominantIsTower = dominantCard.cardName === "La Torre";
  const evidence = Object.fromEntries(
    compactCards.map((card) => [
      card.cardName,
      truncateText(firstSentence(card.scopeMeaning, 180), 180),
    ]),
  );
  const tone =
    reversedCount >= Math.ceil(compactCards.length / 2)
      ? "intenso, contenido y exigente"
      : reversedCount > 0
        ? "atento, ambivalente y en ajuste"
        : supportSignals >= 2
          ? "esperanzador, sobrio y realista"
          : "expectante, enfocado y prudente";
  const computedConflict = truncateText(
    dominantIsTower
      ? `La tirada muestra que ${question.toLowerCase()} ya no puede seguir sostenido sobre una base que viene dando señales de desgaste o verdad pendiente. Lo que parecia una proyeccion manejable empieza a exigir una revision mas honesta de estructura, criterio y rumbo.`
      : mostlyConstructive
        ? `Hay avances visibles en ${situationCard.position.toLowerCase()}, pero la lectura pide revisar si ${bridgeClause} sostiene lo que se quiere expandir sin exigir una entrega desproporcionada.`
        : `La situacion se mueve desde ${situationClause}, pero se tensiona cuando ${blockingClause} empieza a pesar mas que el impulso de ${adviceCard.position.toLowerCase()}.`,
    340,
  );
  const computedTension = truncateText(
    dominantIsTower
      ? `El eje de la tirada no es solo decidir como crecer, sino reconocer que una parte del andamiaje actual ya no resiste mas exigencia. Hay vision y criterio, pero tambien una verdad incomoda: seguir proyectando sin revisar la base puede volver mas brusco el ajuste que ya se viene acercando.`
      : mostlyConstructive
        ? `La tension no nace de una crisis, sino del punto exacto en que el avance necesita reciprocidad, ritmo y prueba concreta. ${bridgeCard.position} funciona como bisagra: obliga a medir si lo que crece tambien devuelve sostÃ©n, respuesta o equilibrio.`
        : `La tension central aparece entre lo que la persona quiere sostener y la forma en que responde cuando el proceso exige ajuste. ${blockingCard.position} muestra la friccion, mientras ${adviceCard.position} marca hacia donde deberia reorganizarse el movimiento.`,
    360,
  );
  const computedShadow = truncateText(
    dominantIsTower
      ? `El bloqueo no esta en faltar capacidad, sino en querer conservar una seguridad que ya da menos estabilidad de la que promete.`
      : mostlyConstructive
        ? `La dificultad no esta en faltar recursos, sino en distinguir entre paciencia saludable y sobreentrega, entre cooperar y sostener sola una parte del peso.`
        : `El bloqueo actual aparece cuando la lectura pide ajuste y la reaccion sigue siendo aplazar, endurecer o proteger una posicion que ya no acompaÃ±a el proceso.`,
    300,
  );
  const computedOpportunity = truncateText(
    dominantIsTower
      ? `Abrir una etapa mas honesta, donde el crecimiento no dependa de sostener una estructura agotada sino de reconstruir sobre decisiones, limites y prioridades mas reales.`
      : mostlyConstructive
        ? `Construir una etapa mas equilibrada, donde el avance no dependa solo del esfuerzo individual y donde ${adviceClause} confirme que el proceso tambien devuelve apoyo, reconocimiento o sostÃ©n.`
        : `Mover la situacion con un criterio mas sobrio, de manera que el cambio no dependa de forzar mas sino de colocar mejor la energia disponible.`,
    320,
  );
  const computedRisk = truncateText(
    dominantIsTower
      ? `Seguir invirtiendo en una forma de trabajo que ya no se sostiene con verdad, hasta que el ajuste llegue de manera mas brusca y menos elegida.`
      : mostlyConstructive
        ? `Desgastarse por sostener intercambios desiguales o perder fe por no reconocer a tiempo los avances parciales del proceso.`
        : `Que la tension se vuelva costumbre y termine drenando energia, tiempo y margen de decision hasta volver mas caro lo que hoy todavia puede corregirse.`,
    260,
  );
  const computedDirection = truncateText(
    dominantIsTower
      ? `Nombrar con precision que parte de la estructura actual ya no funciona y decidir que debe caer primero para reconstruir con una base mas limpia.`
      : mostlyConstructive
        ? `Revisar acuerdos, limites y expectativas para que el avance se apoye en reciprocidad, tiempo real y confianza gradual, no solo en voluntad.`
        : `Mover la situacion desde el punto donde la friccion ya es visible y llevar la energia hacia una decision verificable, aunque no sea la mas comoda.`,
    260,
  );

  return {
    tema: question,
    carta_dominante: dominantCard.cardName,
    eje_central: ejeCentral,
    nivel_transformacion: nivelTransformacion,
    conflicto_principal: truncateText(
      mostlyConstructive
        ? `Hay avances visibles en ${situationCard.position.toLowerCase()}, pero la lectura pide revisar si ${bridgeClause} sostiene lo que se quiere expandir sin exigir una entrega desproporcionada.`
        : `La situacion se mueve desde ${situationClause}, pero se tensiona cuando ${blockingClause} empieza a pesar mas que el impulso de ${adviceCard.position.toLowerCase()}.`,
      340,
    ),
    tension_central: truncateText(
      mostlyConstructive
        ? `La tension no nace de una crisis, sino del punto exacto en que el avance necesita reciprocidad, ritmo y prueba concreta. ${bridgeCard.position} funciona como bisagra: obliga a medir si lo que crece tambien devuelve sostén, respuesta o equilibrio.`
        : `La tension central aparece entre lo que la persona quiere sostener y la forma en que responde cuando el proceso exige ajuste. ${blockingCard.position} muestra la friccion, mientras ${adviceCard.position} marca hacia donde deberia reorganizarse el movimiento.`,
      360,
    ),
    deseo_visible: truncateText(
      mostlyConstructive
        ? `Quiere comprobar que ${question.toLowerCase()} esta entrando en una etapa fértil y que el esfuerzo invertido realmente vale la pena.`
        : `Quiere resolver ${question.toLowerCase()} sin seguir cargando un costo emocional o practico que ya empieza a volverse pesado.`,
      260,
    ),
    miedo_oculto: truncateText(
      mostlyConstructive
        ? `Seguir invirtiendo energia, tiempo o expectativa antes de comprobar si el intercambio, la respuesta o el ritmo del proceso van a madurar de manera justa.`
        : `Que corregir el rumbo obligue a reconocer una incomodidad que se viene postergando y a mover algo que ya no se puede sostener igual que antes.`,
      300,
    ),
    patron_repetido: truncateText(
      mostlyConstructive
        ? `Medir el avance solo por la recompensa inmediata y no por las señales graduales de consolidacion que ya estan apareciendo.`
        : `Responder con una defensa conocida aunque ya no ordene la situacion, solo porque da una sensacion temporal de resguardo.`,
      240,
    ),
    bloqueo_actual: truncateText(
      mostlyConstructive
        ? `La dificultad no esta en faltar recursos, sino en distinguir entre paciencia saludable y sobreentrega, entre cooperar y sostener sola una parte del peso.`
        : `El bloqueo actual aparece cuando la lectura pide ajuste y la reaccion sigue siendo aplazar, endurecer o proteger una posicion que ya no acompaña el proceso.`,
      300,
    ),
    recurso_disponible: truncateText(
      mostlyConstructive
        ? `El recurso disponible combina ${lowerSentenceStart(situationSnippet)} con la posibilidad de que ${adviceClause} ordene el siguiente tramo desde mas confianza y mejor intercambio.`
        : `El recurso disponible aparece cuando ${adviceClause} ayuda a reorganizar lo que hoy esta quedando atrapado en ${blockingClause}.`,
      280,
    ),
    oportunidad_real: truncateText(
      mostlyConstructive
        ? `Construir una etapa mas equilibrada, donde el avance no dependa solo del esfuerzo individual y donde ${adviceClause} confirme que el proceso tambien devuelve apoyo, reconocimiento o sostén.`
        : `Mover la situacion con un criterio mas sobrio, de manera que el cambio no dependa de forzar mas sino de colocar mejor la energia disponible.`,
      320,
    ),
    riesgo_real: truncateText(
      mostlyConstructive
        ? `Desgastarse por sostener intercambios desiguales o perder fe por no reconocer a tiempo los avances parciales del proceso.`
        : `Que la tension se vuelva costumbre y termine drenando energia, tiempo y margen de decision hasta volver mas caro lo que hoy todavia puede corregirse.`,
      260,
    ),
    direccion_recomendada: truncateText(
      mostlyConstructive
        ? `Revisar acuerdos, limites y expectativas para que el avance se apoye en reciprocidad, tiempo real y confianza gradual, no solo en voluntad.`
        : `Mover la situacion desde el punto donde la friccion ya es visible y llevar la energia hacia una decision verificable, aunque no sea la mas comoda.`,
      260,
    ),
    tono_emocional: tone,
    evidencia_simbolica: evidence,
  };
}

function buildProPositionSummaries(cards: CompactCardContext[]): string {
  return cards
    .map((card, index) => {
      const summary = truncateText(firstSentence(card.scopeMeaning, 220), 220);
      return `${index + 1}. posicion=${card.position}; carta=${card.cardName}; orientacion=${orientationText(card.orientation)}; scope=${card.scope}; resumen=${summary}`;
    })
    .join("\n");
}

function buildStructuredInterpretationProV2(
  question: string,
  cards: Array<{ compactContext: CompactCardContext }>,
): TarotStructuredInterpretation {
  const compactCards = cards.map(({ compactContext }) => compactContext);
  const firstCard = compactCards[0];
  const middleCard = compactCards[Math.floor((compactCards.length - 1) / 2)];
  const lastCard = compactCards[compactCards.length - 1];
  const blockingCard =
    findCardByPosition(cards, [/bloqueo/i, /obst[aÃ¡]culo/i, /sombra/i, /riesgo/i, /miedo/i]) ??
    compactCards.find((card) => card.orientation === "reversed") ??
    middleCard;
  const adviceCard =
    findCardByPosition(cards, [/consejo/i, /direcci[oÃ³]n/i, /salida/i, /resultado/i, /gu[iÃ­]a/i, /aprendizaje/i]) ??
    lastCard;
  const situationCard =
    findCardByPosition(cards, [/situaci[oÃ³]n/i, /presente/i, /origen/i, /centro/i, /actual/i]) ??
    firstCard;
  const dominantCard = getDominantCard(compactCards);
  const nivelTransformacion = getTransformationLevel(compactCards, dominantCard);
  const ejeCentral = buildCentralAxis(dominantCard, question, adviceCard);
  const dominantIsTower = dominantCard.cardName === "La Torre";
  const reversedCount = compactCards.filter((card) => card.orientation === "reversed").length;
  const blockingSignals = compactCards.filter(hasBlockingSignal).length;
  const supportSignals = compactCards.filter(hasSupportSignal).length;
  const mostlyConstructive = nivelTransformacion === "bajo" && blockingSignals <= 1;
  const situationSnippet = firstSentence(situationCard.scopeMeaning, 220);
  const blockingSnippet = firstSentence(blockingCard.scopeMeaning, 220);
  const adviceSnippet = firstSentence(adviceCard.scopeMeaning, 220);
  const bridgeCard = compactCards.length > 2 ? middleCard : adviceCard;
  const bridgeSnippet = firstSentence(bridgeCard.scopeMeaning, 220);
  const adviceClause = lowerSentenceStart(adviceSnippet);
  const bridgeClause = lowerSentenceStart(bridgeSnippet);
  const situationClause = lowerSentenceStart(situationSnippet);
  const blockingClause = lowerSentenceStart(blockingSnippet);
  const evidence = Object.fromEntries(
    compactCards.map((card) => [
      card.cardName,
      truncateText(firstSentence(card.scopeMeaning, 180), 180),
    ]),
  );
  const tone =
    nivelTransformacion === "alto"
      ? "intenso, sobrio y transformador"
      : reversedCount > 0
        ? "atento, ambivalente y en ajuste"
        : supportSignals >= 2
          ? "esperanzador, sobrio y realista"
          : "expectante, enfocado y prudente";

  return {
    tema: question,
    carta_dominante: dominantCard.cardName,
    eje_central: ejeCentral,
    nivel_transformacion: nivelTransformacion,
    conflicto_principal: truncateText(
      dominantIsTower
        ? `La tirada muestra que ${question.toLowerCase()} ya no puede seguir sostenido sobre una base que viene dando señales de desgaste o verdad pendiente. Lo que parecia una proyeccion manejable empieza a exigir una revision mas honesta de estructura, criterio y rumbo.`
        : mostlyConstructive
          ? `Hay avances visibles en ${situationCard.position.toLowerCase()}, pero la lectura pide revisar si ${bridgeClause} sostiene lo que se quiere expandir sin exigir una entrega desproporcionada.`
          : `La situacion se mueve desde ${situationClause}, pero se tensiona cuando ${blockingClause} empieza a pesar mas que el impulso de ${adviceCard.position.toLowerCase()}.`,
      340,
    ),
    tension_central: truncateText(
      dominantIsTower
        ? `El eje de la tirada no es solo decidir como crecer, sino reconocer que una parte del andamiaje actual ya no resiste mas exigencia. Hay vision y criterio, pero tambien una verdad incomoda: seguir proyectando sin revisar la base puede volver mas brusco el ajuste que ya se viene acercando.`
        : mostlyConstructive
          ? `La tension no nace de una crisis, sino del punto exacto en que el avance necesita reciprocidad, ritmo y prueba concreta. ${bridgeCard.position} funciona como bisagra: obliga a medir si lo que crece tambien devuelve sostén, respuesta o equilibrio.`
          : `La tension central aparece entre lo que la persona quiere sostener y la forma en que responde cuando el proceso exige ajuste. ${blockingCard.position} muestra la friccion, mientras ${adviceCard.position} marca hacia donde deberia reorganizarse el movimiento.`,
      360,
    ),
    deseo_visible: truncateText(
      dominantIsTower
        ? `Quiere tomar una decision laboral lucida sin seguir apoyandose en una estructura que ya no le ofrece la seguridad que prometia.`
        : mostlyConstructive
          ? `Quiere comprobar que ${question.toLowerCase()} esta entrando en una etapa fértil y que el esfuerzo invertido realmente vale la pena.`
          : `Quiere resolver ${question.toLowerCase()} sin seguir cargando un costo emocional o practico que ya empieza a volverse pesado.`,
      260,
    ),
    miedo_oculto: truncateText(
      dominantIsTower
        ? `Descubrir que una decision, una estructura o una expectativa profesional ya no se puede maquillar ni posponer sin costo.`
        : mostlyConstructive
          ? `Seguir invirtiendo energia, tiempo o expectativa antes de comprobar si el intercambio, la respuesta o el ritmo del proceso van a madurar de manera justa.`
          : `Que corregir el rumbo obligue a reconocer una incomodidad que se viene postergando y a mover algo que ya no se puede sostener igual que antes.`,
      300,
    ),
    patron_repetido: truncateText(
      dominantIsTower
        ? `Intentar proyectar el siguiente movimiento sin admitir del todo que una parte de la base actual ya necesita caer para ser reconstruida.`
        : mostlyConstructive
          ? `Medir el avance solo por la recompensa inmediata y no por las señales graduales de consolidacion que ya estan apareciendo.`
          : `Responder con una defensa conocida aunque ya no ordene la situacion, solo porque da una sensacion temporal de resguardo.`,
      240,
    ),
    bloqueo_actual: truncateText(
      dominantIsTower
        ? `El bloqueo no esta en faltar capacidad, sino en querer conservar una seguridad que ya da menos estabilidad de la que promete.`
        : mostlyConstructive
          ? `La dificultad no esta en faltar recursos, sino en distinguir entre paciencia saludable y sobreentrega, entre cooperar y sostener sola una parte del peso.`
          : `El bloqueo actual aparece cuando la lectura pide ajuste y la reaccion sigue siendo aplazar, endurecer o proteger una posicion que ya no acompaña el proceso.`,
      300,
    ),
    recurso_disponible: truncateText(
      dominantIsTower
        ? `El recurso disponible aparece en la lucidez de ${situationCard.position.toLowerCase()} y en la posibilidad de que ${adviceClause} acompañe una reconstruccion mas honesta.`
        : mostlyConstructive
          ? `El recurso disponible combina ${lowerSentenceStart(situationSnippet)} con la posibilidad de que ${adviceClause} ordene el siguiente tramo desde mas confianza y mejor intercambio.`
          : `El recurso disponible aparece cuando ${adviceClause} ayuda a reorganizar lo que hoy esta quedando atrapado en ${blockingClause}.`,
      280,
    ),
    oportunidad_real: truncateText(
      dominantIsTower
        ? `Abrir una etapa mas honesta, donde el crecimiento no dependa de sostener una estructura agotada sino de reconstruir sobre decisiones, limites y prioridades mas reales.`
        : mostlyConstructive
          ? `Construir una etapa mas equilibrada, donde el avance no dependa solo del esfuerzo individual y donde ${adviceClause} confirme que el proceso tambien devuelve apoyo, reconocimiento o sostén.`
          : `Mover la situacion con un criterio mas sobrio, de manera que el cambio no dependa de forzar mas sino de colocar mejor la energia disponible.`,
      320,
    ),
    riesgo_real: truncateText(
      dominantIsTower
        ? `Seguir invirtiendo en una forma de trabajo que ya no se sostiene con verdad, hasta que el ajuste llegue de manera mas brusca y menos elegida.`
        : mostlyConstructive
          ? `Desgastarse por sostener intercambios desiguales o perder fe por no reconocer a tiempo los avances parciales del proceso.`
          : `Que la tension se vuelva costumbre y termine drenando energia, tiempo y margen de decision hasta volver mas caro lo que hoy todavia puede corregirse.`,
      260,
    ),
    direccion_recomendada: truncateText(
      dominantIsTower
        ? `Nombrar con precision que parte de la estructura actual ya no funciona y decidir que debe caer primero para reconstruir con una base mas limpia.`
        : mostlyConstructive
          ? `Revisar acuerdos, limites y expectativas para que el avance se apoye en reciprocidad, tiempo real y confianza gradual, no solo en voluntad.`
          : `Mover la situacion desde el punto donde la friccion ya es visible y llevar la energia hacia una decision verificable, aunque no sea la mas comoda.`,
      260,
    ),
    tono_emocional: tone,
    evidencia_simbolica: evidence,
  };
}

function buildStructuredInterpretationProCompact(
  question: string,
  cards: Array<{ compactContext: CompactCardContext }>,
): TarotStructuredInterpretation {
  const compactCards = cards.map(({ compactContext }) => compactContext);
  const primaryScope = resolvePrimaryScope(compactCards);
  const rawBase = buildStructuredInterpretationProV2(question, cards);
  const dominantCard = compactCards.find((card) => card.cardName === rawBase.carta_dominante) ?? compactCards[0];
  const narrativeTone = getNarrativeTone(
    compactCards,
    dominantCard,
    primaryScope,
    rawBase.nivel_transformacion,
  );
  const base = applyReversedWeightToStructured(
    {
      ...rawBase,
      narrativeTone,
    },
    compactCards,
  );
  const hasKingOfWands = compactCards.some((card) => card.cardName === "Rey de Bastos");
  const hasSevenOfCups = compactCards.some((card) => card.cardName === "Siete de Copas");

  if (base.carta_dominante === "Siete de Bastos") {
    return applyTopicVocabularyToStructured({
      ...base,
      eje_central: hasKingOfWands && hasSevenOfCups
        ? "defender una posicion ganada ante una oferta que puede traer autoridad, presion y nuevas exigencias"
        : "defender una posicion ganada sin convertir la presion externa en un desgaste constante",
      conflicto_principal: truncateText(
        hasKingOfWands && hasSevenOfCups
          ? `La tirada muestra que ${question.toLowerCase()} entra en una etapa donde sostener autoridad pesa tanto como aceptar una expansion nueva. Ya hay una posicion ganada, pero alrededor aparecen opciones y exigencias que obligan a decidir que crecimiento vale el costo.`
          : `La tirada muestra que ${question.toLowerCase()} ya pide sostener una posicion concreta frente a presiones, reclamos o nuevas demandas que no pueden aceptarse de forma ingenua.`,
        340,
      ),
      tension_central: truncateText(
        hasKingOfWands && hasSevenOfCups
          ? `La presion no viene de empezar desde cero, sino de defender lo ya alcanzado mientras se evalua si la siguiente propuesta fortalece el liderazgo o dispersa la energia. El mecanismo oculto consiste en distinguir una posibilidad real de una carga que llega con brillo, pero tambien con mas demanda y menos margen.`
          : `La tension central aparece cuando lo ganado exige firmeza, pero el entorno trae mas demanda de la que parece a primera vista. El punto no es solo resistir, sino elegir que vale la pena negociar y que conviene rechazar a tiempo.`,
        360,
      ),
      deseo_visible: truncateText(
        `Quiere confirmar si el ascenso, la visibilidad o la nueva responsabilidad realmente expanden su autoridad en lugar de convertirla en una defensa permanente.`,
        260,
      ),
      miedo_oculto: truncateText(
        `Aceptar una opcion que pida mas presencia, mas defensa y mas negociacion de la que parecia al principio, hasta vaciar el liderazgo que hoy intenta consolidar.`,
        300,
      ),
      patron_repetido: truncateText(
        `Confundir amplitud de opciones con conveniencia real y medir el siguiente paso por promesa o prestigio antes que por estructura, limite y margen de maniobra.`,
        240,
      ),
      bloqueo_actual: truncateText(
        `La dificultad actual no esta en la falta de impulso, sino en no saber que propuesta merece ser defendida y cual solo traeria mas presion sobre una posicion ya exigente.`,
        300,
      ),
      recurso_disponible: truncateText(
        `El recurso disponible esta en combinar vision de mando, lectura estrategica de opciones y capacidad de sostener limites sin ceder terreno por cansancio o deslumbramiento.`,
        280,
      ),
      oportunidad_real: truncateText(
        `Elegir una sola via con autoridad, negociar mejor las condiciones del ascenso y convertir la presion externa en prueba de madurez, no en desgaste innecesario.`,
        320,
      ),
      riesgo_real: truncateText(
        `Aceptar mas de lo que conviene, dispersar autoridad entre demasiadas opciones o terminar defendiendo una carga que parece ascenso, pero reduce margen y criterio.`,
        260,
      ),
      direccion_recomendada: truncateText(
        `Pedir condiciones claras, filtrar promesas seductoras y sostener solo la opcion que respete tu autoridad, tus limites y la posicion que ya te costo construir.`,
        260,
      ),
      tono_emocional: "firme, exigente y estrategico",
      narrativeTone,
      reversedWeight: base.reversedWeight,
    }, primaryScope);
  }

  return applyTopicVocabularyToStructured(base, primaryScope);
}

function buildProSpreadPrompt(
  question: string,
  spreadType: SpreadType,
  cards: CompactCardContext[],
  structured: TarotStructuredInterpretation,
): string {
  const cardSummaries = buildProPositionSummaries(cards);
  const structuredJson = JSON.stringify(structured);

  return `No interpretes las cartas desde cero.
La interpretacion simbolica ya fue realizada.
Tu tarea es convertir la interpretacion estructurada en una lectura PRO humana, profunda y coherente.

Escribe como un tarotista profesional hablando con una persona real.
Usa un tono profesional, reflexivo, directo y humano.
Nunca dramatico.
Nunca fatalista.
Nunca infantil.
Nunca esoterico exagerado.
Nunca parezcas una IA explicando tarot.

Pregunta del consultante: ${question}
Tipo de tirada: ${spreadType}

Resumen corto por posicion:
${cardSummaries}

Interpretacion estructurada previa:
${structuredJson}

Reglas absolutas:
- Usa unicamente la informacion recibida.
- No agregues predicciones absolutas.
- No inventes hechos externos.
- No uses lenguaje generico.
- No repitas ideas.
- No expliques tarot.
- No menciones cartas individualmente.
- No escribas frases como "El Mago indica..." o equivalentes.
- No agregues conflictos nuevos que no esten sostenidos por la interpretacion estructurada.
- No intensifiques la sombra mas alla de la interpretacion estructurada.
- No reemplaces la tension central por cliches psicologicos.
- No uses miedo a equivocarse, indecision, paralisis, control excesivo o postura defensiva salvo que eso aparezca de forma explicita en la interpretacion estructurada.
- La carta_dominante debe influir de forma obligatoria en mensaje_central, historia_profunda, sombra, oportunidad, riesgo y sintesis_final.
- No permitas que el tema consultado aplaste la personalidad simbolica de las cartas.
- Si nivel_transformacion es alto, la lectura debe sentirse mas tensa, decisiva y transformadora que una lectura estable o constructiva.
- Si carta_dominante es La Torre, prioriza matices como ruptura de estructuras obsoletas, verdad incomoda, cambio que ya no puede aplazarse, caida de una falsa seguridad y reconstruccion sobre una base mas honesta.
- Si carta_dominante cambia, la lectura completa tambien debe cambiar de personalidad.
- Cada campo debe aportar una capa distinta.
- La lectura debe ser imposible de reutilizar con otras cartas sin perder sentido.
- Historia profunda conecta situacion externa y estado interno.
- Dinamica oculta revela la fuerza invisible que mueve la situacion.
- Sombra muestra bloqueo, autoengano, miedo o resistencia sin crueldad ni fatalismo.
- Oportunidad muestra la puerta real que se abre si comprende la lectura.
- Riesgo explica que se deteriora si repite el patron actual.
- Consejo debe sonar maduro y especifico, no a autoayuda generica.
- Accion concreta debe ser observable y realizable en menos de 48 horas.
- Pregunta reflexiva debe ser simple, honesta y profunda.
- Sintesis final cierra con elegancia y contundencia.
- Prioriza observaciones humanas y narrativas concretas por encima de resumenes conceptuales.
- La lectura debe parecer una observacion sobre la situacion del consultante, no una explicacion abstracta de conceptos.
- Busca frases que dejen imagenes mentales o situaciones reconocibles, no solo conclusiones sinteticas.
- Mantén la lectura principal como prioridad.
- Añade una seccion educativa separada y breve.
- No mezcles enseñanza con interpretación.
- aprendizaje_tarot.cartas_clave explica el aporte de cada carta dentro de la combinacion.
- aprendizaje_tarot.cartas_clave devuelve objetos con forma {"carta":"","aporte":""}.
- aprendizaje_tarot.interaccion_simbolica explica como interactuan las cartas entre si.
- aprendizaje_tarot.leccion_tarotista enseña un patron de lectura util para estudiantes.
- mentor_khael ofrece una observacion para evitar lecturas simplistas o errores comunes de principiantes.
- La parte educativa debe ser clara, practica y no repetir la lectura principal.
- Devuelve SOLO JSON valido minificado en una sola linea.
- Sin markdown.
- Sin texto antes o despues del JSON.

Estructura exacta:
{"mensaje_central":"","historia_profunda":"","dinamica_oculta":"","sombra":"","oportunidad":"","riesgo":"","consejo":"","accion_concreta":"","pregunta_reflexiva":"","aprendizaje_tarot":{"cartas_clave":[{"carta":"","aporte":""}],"interaccion_simbolica":"","leccion_tarotista":""},"mentor_khael":"","sintesis_final":""}`;
}

function buildProSpreadCompactPrompt(
  question: string,
  spreadType: SpreadType,
  cards: CompactCardContext[],
  structured: TarotStructuredInterpretation,
): string {
  const cardsBlock = cards
    .map((card, index) => `${index + 1}. ${card.position} | ${card.cardName} | ${orientationText(card.orientation)} | ${truncateText(firstSentence(card.scopeMeaning, 140), 140)}`)
    .join("\n");
  const structuredPayload = JSON.stringify({
    tema: structured.tema,
    carta_dominante: structured.carta_dominante,
    eje_central: structured.eje_central,
    nivel_transformacion: structured.nivel_transformacion,
    conflicto_principal: structured.conflicto_principal,
    tension_central: structured.tension_central,
    deseo_visible: structured.deseo_visible,
    miedo_oculto: structured.miedo_oculto,
    patron_repetido: structured.patron_repetido,
    bloqueo_actual: structured.bloqueo_actual,
    recurso_disponible: structured.recurso_disponible,
    oportunidad_real: structured.oportunidad_real,
    riesgo_real: structured.riesgo_real,
    direccion_recomendada: structured.direccion_recomendada,
    tono_emocional: structured.tono_emocional,
    narrativeTone: structured.narrativeTone,
    reversedWeight: structured.reversedWeight,
  });
  const dominantHint = buildDominantVocabularyHint(structured);
  const topicScope = resolvePrimaryScope(cards);
  const topicVocabulary = formatTopicVocabularyForPrompt(
    topicScope,
    getTopicVocabulary(topicScope),
  );

  return `Eres Khael Tarotista. Convierte esta interpretacion ya resuelta en una lectura PRO compacta y humana.
Pregunta: ${question}
Tirada: ${spreadType}
Modo: proMode=compact
Cartas:
${cardsBlock}
Base:
${structuredPayload}
Vocabulario por tema:
${topicVocabulary}
Reglas:
- Usa solo la base recibida.
- No expliques tarot ni nombres las cartas dentro de la lectura.
- No agregues conflictos nuevos ni intensifiques la sombra.
- ${dominantHint}
- Utiliza lenguaje natural propio del tema consultado.
- El tema modifica el vocabulario utilizado, no el significado simbolico.
- Prioridad: 1 carta dominante, 2 eje central, 3 tema.
- Respeta narrativeTone y reversedWeight; si reversedWeight es high, la inversion debe afectar sombra, riesgo y consejo.
- Cada campo cumple una funcion distinta.
- mensaje_central: 1 oracion memorable.
- historia_profunda: 2 oraciones.
- dinamica_oculta: 1 o 2 oraciones.
- sombra, oportunidad, riesgo, consejo, mentor_khael y sintesis_final: 1 oracion cada uno.
- accion_concreta: 1 oracion practica para menos de 48 horas.
- pregunta_reflexiva: 1 pregunta simple y honesta.
- Devuelve solo JSON valido. Sin markdown. Sin texto fuera del JSON. Sin comentarios. Sin comillas sueltas.
JSON exacto:
{"mensaje_central":"","historia_profunda":"","dinamica_oculta":"","sombra":"","oportunidad":"","riesgo":"","consejo":"","accion_concreta":"","pregunta_reflexiva":"","mentor_khael":"","sintesis_final":""}`;
}

function buildSpreadPrompt(
  question: string,
  spreadType: SpreadType,
  plan: PlanTier,
  cards: CompactCardContext[],
): string {
  const constraints = PLAN_CONSTRAINTS[plan];
  const numPredict = spreadType === "three_cards" ? 500 : constraints.numPredict;
  const cardsBlock = cards
    .map((card, index) => `${index + 1}. ${card.promptText}`)
    .join("\n");

  return `Eres un tarotista profesional con mas de 20 anos de experiencia interpretando tiradas para consultantes reales.
Tu trabajo NO es explicar el significado de las cartas.
Tu trabajo es interpretar la situacion que emerge de la combinacion de cartas.

Objetivo:
- Genera una lectura que parezca escrita por un tarotista humano experimentado.
- La lectura debe sentirse especifica, coherente, emocionalmente creible y directamente relacionada con las cartas recibidas.
- El usuario nunca debe sentir que esta leyendo una lista de significados.
- Debe sentir que las cartas estan contando una historia.

Pregunta: ${question}
Tirada: ${spreadType}
Plan: ${plan}
Usa solo este contexto oficial:
${cardsBlock}
Prohibiciones absolutas:
- No expliques carta por carta.
- No escribas frases como: "El Mago muestra...", "La Estrella indica...", "El Sol representa...", "El As de Oros te invita...", "La carta sugiere..." o "Esta carta habla de...".
- No describas significados individuales.
- No hagas listas de conceptos.
- No generes definiciones de tarot.
- No uses lenguaje de manual.
- No uses expresiones vacias o genericas como "energia positiva", "claridad", "crecimiento", "oportunidad", "vibracion", "alineacion", "manifestacion", "universo", "abundancia", "elevar frecuencia", "actuar con intencion" o "confiar en el proceso", salvo que sean imprescindibles.
- No menciones JSON, modelo, RAG ni base de datos.
- No expliques tu razonamiento.

Proceso interno obligatorio:
- Analiza todas las cartas juntas.
- Identifica el conflicto principal.
- Identifica la posibilidad principal.
- Identifica la tension central entre ambas.
- Construye una historia humana coherente.
- Recién despues divide esa historia en los campos solicitados.

Reglas de interpretacion:
- Responde solo desde el scope indicado en cada carta.
- No uses otros ambitos.
- Escribe en tiempo presente.
- Las cartas deben interactuar entre si.
- La interpretacion debe surgir de la combinacion completa.
- Cambiar una sola carta debe cambiar significativamente la lectura.
- Cada lectura debe sentirse unica.
- Describe situaciones humanas reales: decisiones, miedos, relaciones, dudas, bloqueos, avances, conflictos, expectativas y responsabilidades.
- No hables de conceptos abstractos cuando puedas describir comportamientos concretos.
- Si el spread incluye posiciones, usalas explicitamente en la interpretacion.
- Prioriza la narrativa sobre la descripcion de significados individuales.
- La lectura debe leerse como una conversacion entre un tarotista y un consultante.
- Debe sonar humana, observadora y cercana.
- No como un motor de generacion de texto.
- Cada bloque debe continuar naturalmente el anterior.
- Historia explica que esta ocurriendo realmente y describe la situacion sin mencionar cartas.
- Dinamica explica como interactuan las fuerzas presentes, que impulsa, que frena y que esta cambiando, sin mencionar cartas.
- Riesgo describe el patron que podria sabotear el resultado.
- Consejo explica que actitud o enfoque favorece el desarrollo positivo de la situacion.
- Accion da una sola accion concreta, observable y realizable en menos de 48 horas.
- No pidas al consultante que escriba, reflexione o piense una accion: indica que hacer.
- Corrige ortografia y tildes.
- Usa "siembra", nunca "sembra".
- Devuelve SOLO JSON valido minificado en una sola linea.
- Sin markdown.
- Sin texto antes o despues del JSON.
- Prioriza cerrar el JSON completo aunque debas usar la parte baja de los rangos.
Limites ${plan}:
- mensaje_central = 1 sola oracion memorable
- historia = ${constraints.historyWordMin}-${constraints.historyWordLimit} palabras
- dinamica = ${constraints.dynamicWordMin}-${constraints.dynamicWordLimit} palabras
- riesgo = ${constraints.riskWordMin}-${constraints.riskWordLimit} palabras
- consejo = ${constraints.adviceWordMin}-${constraints.adviceWordLimit} palabras
- accion = 1 sola frase concreta
- Mantente por debajo de ${numPredict} tokens de salida.
JSON exacto:
{"mensaje_central":"...","historia":"...","dinamica":"...","riesgo":"...","consejo":"...","accion":"..."}`;
}

function normalizeModelJson(raw: string): string {
  return raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .replace(/^\uFEFF/, "")
    .trim();
}

function tryParseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function repairModelJson(raw: string): string | null {
  const normalized = normalizeModelJson(raw);
  const firstBrace = normalized.indexOf("{");
  const lastBrace = normalized.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  const candidate = normalized.slice(firstBrace, lastBrace + 1);
  return candidate
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "\"")
    .replace(/([{,]\s*)([A-Za-zÁÉÍÓÚáéíóúÑñ_][A-Za-zÁÉÍÓÚáéíóúÑñ0-9_\s-]*)(\s*:)/g, '$1"$2"$3')
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractQuotedFieldFromText(raw: string, aliases: string[]): string {
  for (const alias of aliases) {
    const pattern = new RegExp(`"${escapeRegExp(alias)}"\\s*[:|,]\\s*"([^"]*)"`, "i");
    const match = raw.match(pattern);
    if (match?.[1]?.trim()) {
      return match[1].trim();
    }
  }

  const normalizedAliases = aliases.map((alias) => alias.toLowerCase().replace(/[^a-z]/g, ""));
  const genericPattern = /"([^"]+)"\s*[:|,]\s*"([^"]*)"/g;
  for (const match of raw.matchAll(genericPattern)) {
    const normalizedKey = match[1].toLowerCase().replace(/[^a-z]/g, "");
    if (normalizedAliases.some((alias) => normalizedKey === alias || normalizedKey.startsWith(alias) || alias.startsWith(normalizedKey))) {
      const value = match[2]?.trim();
      if (value) {
        return value;
      }
    }
  }

  return "";
}

function getFirstString(record: Record<string, unknown>, aliases: string[]): string {
  for (const alias of aliases) {
    const direct = record[alias];
    if (typeof direct === "string" && direct.trim()) {
      return direct.trim();
    }
  }

  const normalizedAliases = aliases.map((alias) => alias.toLowerCase().replace(/[^a-z]/g, ""));
  for (const [key, value] of Object.entries(record)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, "");
    if (typeof value === "string" && value.trim() && normalizedAliases.includes(normalizedKey)) {
      return value.trim();
    }
  }

  for (const [key, value] of Object.entries(record)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, "");
    if (
      typeof value === "string" &&
      value.trim() &&
      normalizedAliases.some(
        (alias) =>
          normalizedKey.startsWith(alias) ||
          alias.startsWith(normalizedKey) ||
          (alias.length >= 5 && normalizedKey.includes(alias.slice(0, 5))),
      )
    ) {
      return value.trim();
    }
  }

  return "";
}

function normalizeLearningCardKey(value: unknown): TarotLearningCardKey | null {
  if (typeof value === "string" && value.trim()) {
    return {
      carta: value.trim(),
      aporte: "aporte simbolico principal dentro de la tirada",
    };
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const carta = getFirstString(raw, ["carta", "card"]);
  const aporte = getFirstString(raw, ["aporte", "contribucion", "contribución", "meaning"]);

  if (!carta) {
    return null;
  }

  return {
    carta,
    aporte: aporte || "aporte simbolico principal dentro de la tirada",
  };
}

function normalizeCardNameKey(value: string): string {
  return compactWhitespace(value)
    .toLowerCase()
    .replace(/[{}[\]"]/g, "")
    .trim();
}

function isCorruptedCardName(value: string): boolean {
  const normalized = normalizeCardNameKey(value);
  return (
    !normalized ||
    normalized.includes("aporte") ||
    normalized.includes("carta:") ||
    normalized.includes("card:") ||
    normalized.includes("\\") ||
    normalized.length > 60
  );
}

function looksCorruptText(value: string): boolean {
  return /[{[\]}]|"\s*:|\\/.test(value);
}

function buildCartaClaveFallback(
  context: CompactCardContext,
  structuredInterpretation: TarotStructuredInterpretation,
): TarotLearningCardKey {
  return {
    carta: context.cardName,
    aporte: "",
  };
}

function normalizeCartasClave(
  rawCartasClave: TarotLearningCardKey[],
  inputCards: CompactCardContext[],
  structuredInterpretation: TarotStructuredInterpretation,
): TarotLearningCardKey[] {
  const contextsByKey = new Map(
    inputCards.map((context) => [normalizeCardNameKey(context.cardName), context]),
  );
  const selected = new Map<string, TarotLearningCardKey>();

  for (const item of rawCartasClave) {
    if (!item) continue;
    const carta = compactWhitespace(item.carta);
    const key = normalizeCardNameKey(carta);
    const context = contextsByKey.get(key);

    if (!context || isCorruptedCardName(carta) || selected.has(key)) {
      continue;
    }

    const aporte = compactWhitespace(item.aporte);
    selected.set(key, {
      carta: context.cardName,
      aporte:
        aporte && !looksCorruptText(aporte)
          ? truncateText(aporte, 180)
          : buildCleanCartaClave(context, structuredInterpretation).aporte,
    });
  }

  const orderedCards = inputCards.map((context) => {
    const key = normalizeCardNameKey(context.cardName);
    return selected.get(key) ?? buildCleanCartaClave(context, structuredInterpretation);
  });

  return orderedCards;
}

function stripTrailingDots(value: string): string {
  return value.replace(/\.\.+$/g, "").replace(/\.+$/g, "").trim();
}

function ensurePeriod(value: string): string {
  const trimmed = stripTrailingDots(compactWhitespace(value));
  if (!trimmed) {
    return "";
  }

  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function capitalizeFirstLetter(value: string): string {
  const trimmed = compactWhitespace(value);
  if (!trimmed) {
    return "";
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function applyBackendAccentFixes(value: string): string {
  return value
    .replace(/\bsimbolico\b/gi, "simbólico")
    .replace(/\bposicion\b/gi, "posición")
    .replace(/\bpresion\b/gi, "presión")
    .replace(/\bdireccion\b/gi, "dirección")
    .replace(/\bvision\b/gi, "visión")
    .replace(/\bleccion\b/gi, "lección")
    .replace(/\binteraccion\b/gi, "interacción")
    .replace(/\bademas\b/gi, "además")
    .replace(/\bproximas\b/gi, "próximas")
    .replace(/\bpractico\b/gi, "práctico")
    .replace(/\bsolo\b/gi, "solo")
    .replace(/\bposicion ganada\b/gi, "posición ganada")
    .replace(/\beje simbolico\b/gi, "eje simbólico");
}

function applyBackendAccentFixesClean(value: string): string {
  return value
    .replace(/simbÃ³lico/gi, "simbólico")
    .replace(/posiciÃ³n/gi, "posición")
    .replace(/presiÃ³n/gi, "presión")
    .replace(/direcciÃ³n/gi, "dirección")
    .replace(/visiÃ³n/gi, "visión")
    .replace(/lecciÃ³n/gi, "lección")
    .replace(/interacciÃ³n/gi, "interacción")
    .replace(/demÃ¡s/gi, "demás")
    .replace(/ademÃ¡s/gi, "además")
    .replace(/combinaciÃ³n/gi, "combinación")
    .replace(/relaciÃ³n/gi, "relación")
    .replace(/\bsimbolico\b/gi, "simbólico")
    .replace(/\bposicion\b/gi, "posición")
    .replace(/\bpresion\b/gi, "presión")
    .replace(/\bdireccion\b/gi, "dirección")
    .replace(/\bvision\b/gi, "visión")
    .replace(/\bleccion\b/gi, "lección")
    .replace(/\binteraccion\b/gi, "interacción")
    .replace(/\bdemas\b/gi, "demás")
    .replace(/\bademas\b/gi, "además")
    .replace(/\bcombinacion\b/gi, "combinación")
    .replace(/\brelacion\b/gi, "relación")
    .replace(/\bposicion ganada\b/gi, "posición ganada")
    .replace(/\beje simbolico\b/gi, "eje simbólico");
}

function cleanBackendSentence(value: string): string {
  return ensurePeriod(
    capitalizeFirstLetter(
      applyBackendAccentFixesClean(
        compactWhitespace(value)
          .replace(/\.\./g, ".")
          .replace(/\s+,/g, ",")
          .replace(/\s+\./g, ".")
          .replace(/\.\s*\./g, ".")
          .replace(/\s{2,}/g, " ")
          .trim(),
      ),
    ),
  );
}

function getThemeLabel(scope: TarotLocalScope): string {
  switch (scope) {
    case "amor":
      return "en el ámbito afectivo";
    case "trabajo":
      return "en el ámbito laboral";
    case "dinero":
      return "en el ámbito económico";
    case "salud":
      return "en el ámbito de la salud";
    case "viajes":
      return "en el ámbito de los viajes";
    case "espiritual":
      return "en el ámbito espiritual";
    default:
      return "en el tema consultado";
  }
}

function removeLearningPrefixes(value: string, context: CompactCardContext): string {
  const cardPattern = escapeRegExp(context.cardName);
  const cleaned = compactWhitespace(value)
    .replace(new RegExp(`^En\\s+${escapeRegExp(context.scope)}\\s*,?\\s*`, "i"), "")
    .replace(new RegExp(`^${cardPattern}\\s+(aporta|activa)\\s+`, "i"), "")
    .replace(new RegExp(`^En\\s+[^,]+,\\s*${cardPattern}\\s+(aporta|activa)\\s+`, "i"), "")
    .replace(new RegExp(`^${cardPattern}\\s+`, "i"), "")
    .replace(/^(derecho|derecha|invertido|invertida)\s+(activa|aporta|muestra|introduce)\s+/i, "")
    .replace(/^(aporta|activa)\s+/i, "")
    .replace(/\baporta en\b/gi, "")
    .replace(/\bactiva en\b/gi, "")
    .replace(/\bEn trabajo,\s*Rey de Bastos aporta en trabajo\b/gi, "")
    .trim();

  return cleaned;
}

function sanitizeLearningText(value: string, context?: CompactCardContext): string {
  const normalized = context ? removeLearningPrefixes(value, context) : value;
  return cleanBackendSentence(
    normalized
      .replace(/\.{3,}/g, ".")
      .replace(/\baporta en\b/gi, "")
      .replace(/\bactiva en\b/gi, "")
      .replace(/\beje simbolico\b/gi, "eje simbólico")
      .replace(/\bposicion ganada\b/gi, "posición ganada")
      .replace(/\bpresion\b/gi, "presión"),
  );
}

function hasInvalidLearningText(value: string): boolean {
  const normalized = compactWhitespace(value);
  return (
    !normalized ||
    normalized.includes("...") ||
    normalized.includes("..") ||
    /aporta en/i.test(normalized) ||
    /activa en/i.test(normalized) ||
    /^(derecho|derecha|invertido|invertida)\s+(activa|aporta|muestra|introduce)/i.test(normalized) ||
    /^En\s+(trabajo|amor|dinero|salud|viajes|espiritual|general),?/i.test(normalized) ||
    /\bmarca el eje simbolico\b/i.test(normalized) ||
    /\baporta dirigir\b/i.test(normalized) ||
    /En trabajo,\s*Rey de Bastos aporta en trabajo/i.test(normalized) ||
    /eje simbolico/i.test(normalized) ||
    /posicion ganada/i.test(normalized) ||
    /\bpresion\b/.test(normalized)
  );
}

function cardDisplayName(cardName: string): string {
  if (/^(El|La|Los|Las)\s/i.test(cardName)) {
    return cardName;
  }

  if (/^Reina\b/i.test(cardName)) {
    return `La ${cardName}`;
  }

  return `El ${cardName}`;
}

function getKnownLearningAporte(cardName: string): string | null {
  switch (cardName) {
    case "Rey de Bastos":
      return "Liderazgo, visión y capacidad de dirigir con madurez.";
    case "Siete de Copas":
      return "Posibilidades abiertas, deseos múltiples y necesidad de distinguir fantasía de opción real.";
    case "Siete de Bastos":
      return "Defensa de una posición ganada, límites firmes y presión externa.";
    case "Reina de Espadas":
      return "Discernimiento, límites claros y honestidad madura para enfrentar la verdad.";
    case "Dos de Bastos":
      return "Visión futura, planificación y elección consciente de rumbo.";
    case "La Torre":
      return "Ruptura necesaria de estructuras que ya no funcionan.";
    case "Tres de Bastos":
      return "Expansión en proceso, mirada de futuro y avance que empieza a tomar forma.";
    case "Seis de Oros":
      return "Intercambio, proporción y revisión de lo que se da y se recibe.";
    case "La Estrella":
      return "Confianza gradual, recuperación de sentido y orientación esperanzadora.";
    default:
      return null;
  }
}

function extractCleanSymbolicAporte(
  context: CompactCardContext,
  structuredInterpretation: TarotStructuredInterpretation,
): string {
  const knownAporte = getKnownLearningAporte(context.cardName);
  if (knownAporte) {
    return cleanBackendSentence(knownAporte);
  }

  const symbolicEvidence = structuredInterpretation.evidencia_simbolica?.[context.cardName];
  const source = symbolicEvidence || firstSentence(context.scopeMeaning, 150);
  const cleaned = sanitizeLearningText(source, context);

  if (!cleaned) {
    return cleanBackendSentence(firstSentence(context.scopeMeaning, 150));
  }

  return cleaned;
}

function buildCleanCartaClave(
  context: CompactCardContext,
  structuredInterpretation: TarotStructuredInterpretation,
): TarotLearningCardKey {
  return {
    carta: context.cardName,
    aporte: extractCleanSymbolicAporte(context, structuredInterpretation),
  };
}

function buildCleanInteraccionSimbolica(
  inputCards: CompactCardContext[],
  structuredInterpretation: TarotStructuredInterpretation,
): string {
  const dominant =
    inputCards.find((card) => card.cardName === structuredInterpretation.carta_dominante) ?? inputCards[0];
  const secondaryCards = inputCards.filter((card) => card.cardName !== dominant.cardName);
  const cardNames = new Set(inputCards.map((card) => card.cardName));

  if (
    dominant.cardName === "Siete de Bastos" &&
    cardNames.has("Rey de Bastos") &&
    cardNames.has("Siete de Copas")
  ) {
    return cleanBackendSentence(
      "El Siete de Bastos muestra que hay una posición que proteger antes de aceptar nuevas exigencias. El Rey de Bastos aporta autoridad y liderazgo, mientras que el Siete de Copas advierte que no toda posibilidad atractiva fortalece el camino.",
    );
  }

  const dominantSentence = `${cardDisplayName(dominant.cardName)} concentra la combinación en ${stripTrailingDots(applyBackendAccentFixesClean(structuredInterpretation.eje_central))}.`;

  if (secondaryCards.length === 0) {
    return cleanBackendSentence(dominantSentence);
  }

  if (secondaryCards.length === 1) {
    const secondary = secondaryCards[0];
    return cleanBackendSentence(
      `${dominantSentence} ${cardDisplayName(secondary.cardName)} muestra que condición debe cuidarse para que ese eje no se vuelva una respuesta automática.`
    );
  }

  const [firstSecondary, secondSecondary, ...rest] = secondaryCards;
  const secondaryParts = [
    `${cardDisplayName(firstSecondary.cardName)} señala qué recurso está disponible`,
    `mientras que ${cardDisplayName(secondSecondary.cardName).toLowerCase()} muestra qué condición puede confundir la decisión`,
    ...rest.map((card) => `${cardDisplayName(card.cardName)} completa la escena con una condición adicional`),
  ];

  return cleanBackendSentence(`${dominantSentence} ${secondaryParts.join(", ")}.`);
}

function buildCleanLeccionTarotista(
  inputCards: CompactCardContext[],
  structuredInterpretation: TarotStructuredInterpretation,
): string {
  const dominant =
    inputCards.find((card) => card.cardName === structuredInterpretation.carta_dominante) ?? inputCards[0];

  if (dominant.cardName === "Siete de Bastos") {
    return cleanBackendSentence(
      "Cuando el Siete de Bastos domina una tirada, las demás cartas deben leerse desde la defensa de límites, la presión externa y la necesidad de proteger una posición ya ganada.",
    );
  }

  return cleanBackendSentence(
    `Cuando ${cardDisplayName(dominant.cardName).toLowerCase()} domina una tirada, las demás cartas deben leerse desde ${lowerSentenceStart(stripTrailingDots(applyBackendAccentFixesClean(structuredInterpretation.eje_central)))}.`
  );
}

function buildTeacherInteraccionSimbolica(
  inputCards: CompactCardContext[],
  structuredInterpretation: TarotStructuredInterpretation,
): string {
  const dominant =
    inputCards.find((card) => card.cardName === structuredInterpretation.carta_dominante) ?? inputCards[0];
  const secondaryCards = inputCards.filter((card) => card.cardName !== dominant.cardName);
  const cardNames = new Set(inputCards.map((card) => card.cardName));

  if (
    dominant.cardName === "Siete de Bastos" &&
    cardNames.has("Rey de Bastos") &&
    cardNames.has("Siete de Copas")
  ) {
    return cleanBackendSentence(
      "El Siete de Bastos muestra que hay una posición que proteger antes de aceptar nuevas exigencias. El Rey de Bastos aporta autoridad y liderazgo, mientras que el Siete de Copas advierte que no toda posibilidad atractiva fortalece el camino.",
    );
  }

  if (
    dominant.cardName === "La Justicia" &&
    cardNames.has("Nueve de Bastos") &&
    cardNames.has("Siete de Espadas")
  ) {
    return cleanBackendSentence(
      "La Justicia obliga a mirar la situación con honestidad, pero el Nueve de Bastos muestra cansancio y necesidad de proteger lo construido. El Siete de Espadas sugiere que parte del conflicto nace de estrategias defensivas o conversaciones poco transparentes.",
    );
  }

  if (
    dominant.cardName === "El Loco" &&
    cardNames.has("Reina de Espadas") &&
    cardNames.has("Caballero de Copas")
  ) {
    return cleanBackendSentence(
      "El Loco impulsa un nuevo comienzo, pero la Reina de Espadas exige claridad antes de dar el paso. El Caballero de Copas invertido advierte que la ilusión puede avanzar más rápido que los hechos.",
    );
  }

  const dominantAporte = lowerSentenceStart(stripTrailingDots(extractCleanSymbolicAporte(dominant, structuredInterpretation)));

  if (secondaryCards.length === 0) {
    return cleanBackendSentence(`${cardDisplayName(dominant.cardName)} concentra la combinación en ${dominantAporte}.`);
  }

  if (secondaryCards.length === 1) {
    const secondary = secondaryCards[0];
    const secondaryAporte = lowerSentenceStart(stripTrailingDots(extractCleanSymbolicAporte(secondary, structuredInterpretation)));
    return cleanBackendSentence(
      `${cardDisplayName(dominant.cardName)} pone en primer plano ${dominantAporte}. ${cardDisplayName(secondary.cardName)} cambia la lectura porque suma ${secondaryAporte}.`,
    );
  }

  const [firstSecondary, secondSecondary] = secondaryCards;
  return cleanBackendSentence(
    `${cardDisplayName(dominant.cardName)} pone en primer plano ${dominantAporte}. ${cardDisplayName(firstSecondary.cardName)} aporta ${lowerSentenceStart(stripTrailingDots(extractCleanSymbolicAporte(firstSecondary, structuredInterpretation)))}, mientras que ${cardDisplayName(secondSecondary.cardName).toLowerCase()} muestra ${lowerSentenceStart(stripTrailingDots(extractCleanSymbolicAporte(secondSecondary, structuredInterpretation)))}.`,
  );
}

function buildTeacherLeccionTarotista(
  inputCards: CompactCardContext[],
  structuredInterpretation: TarotStructuredInterpretation,
): string {
  const dominant =
    inputCards.find((card) => card.cardName === structuredInterpretation.carta_dominante) ?? inputCards[0];

  if (dominant.cardName === "Siete de Bastos") {
    return cleanBackendSentence(
      "Cuando el Siete de Bastos domina una tirada, el aprendizaje no es resistir por orgullo, sino distinguir qué vale la pena proteger y qué exigencia solo aumenta la presión.",
    );
  }

  if (dominant.cardName === "La Justicia") {
    return cleanBackendSentence(
      "Cuando La Justicia aparece junto a cartas de desgaste o defensa, suele señalar que el problema no está solo afuera, sino en la dificultad para evaluar con objetividad qué es realmente justo para uno mismo.",
    );
  }

  if (dominant.cardName === "El Loco") {
    return cleanBackendSentence(
      "Cuando El Loco aparece junto a cartas de discernimiento, la lección no es lanzarse sin pensar, sino aprender a diferenciar confianza de impulsividad.",
    );
  }

  if (dominant.cardName === "La Muerte") {
    return cleanBackendSentence(
      "Cuando La Muerte domina una tirada, el aprendizaje no suele estar en el cambio mismo, sino en reconocer qué parte del proceso ya terminó antes de que el consultante lo admita.",
    );
  }

  return cleanBackendSentence(
    `Cuando ${cardDisplayName(dominant.cardName).toLowerCase()} domina una combinación, el estudiante debe observar si las otras cartas confirman su impulso, lo frenan o revelan una consecuencia que no era evidente al inicio.`,
  );
}

function buildAprendizajeTarot(
  inputCards: CompactCardContext[],
  structuredInterpretation: TarotStructuredInterpretation,
): TarotLearningBlock {
  const fallbackCartasClave = inputCards.map((context) => buildCleanCartaClave(context, structuredInterpretation));
  const cartas_clave = fallbackCartasClave.map((item, index) => {
    const sanitized = {
      carta: item.carta,
      aporte: sanitizeLearningText(item.aporte, inputCards[index]),
    };

    return hasInvalidLearningText(sanitized.aporte) ? fallbackCartasClave[index] : sanitized;
  });

  const fallbackInteraccion = buildTeacherInteraccionSimbolica(inputCards, structuredInterpretation);
  const interaccion_simbolica = hasInvalidLearningText(fallbackInteraccion) || containsStrictTeachingArtifact(fallbackInteraccion)
    ? cleanBackendSentence(
        `${cardDisplayName(inputCards[0]?.cardName ?? structuredInterpretation.carta_dominante)} se combina con las otras cartas para mostrar que la pregunta no depende de un solo significado, sino del contraste entre impulso, freno y consecuencia.`,
      )
    : fallbackInteraccion;

  const fallbackLeccion = buildTeacherLeccionTarotista(inputCards, structuredInterpretation);
  const leccion_tarotista = hasInvalidLearningText(fallbackLeccion) || containsStrictTeachingArtifact(fallbackLeccion)
    ? cleanBackendSentence(
        `Cuando ${cardDisplayName(structuredInterpretation.carta_dominante).toLowerCase()} domina una combinación, el estudiante debe observar si las otras cartas confirman su impulso, lo frenan o revelan una consecuencia que no era evidente al inicio.`,
      )
    : fallbackLeccion;

  return {
    cartas_clave,
    interaccion_simbolica,
    leccion_tarotista,
  };
}

function containsTemplateArtifact(value: string): boolean {
  return /Y la manera en que eso reorganiza consejo|las dem[aá]s cartas deben leerse desde en|esta carta activa|muestra el recurso que acompa[ñn]a el eje|introduce la tensi[oó]n que obliga|a[ñn]ade un matiz secundario/i.test(value);
}

function containsTeachingArtifact(value: string): boolean {
  return /Y la manera en que eso reorganiza consejo|las dem[aáÃ¡]s cartas deben leerse desde en|esta carta activa|muestra el recurso que acompa[ñnÃ±]a|matiz secundario|secuencia|estructura de la tirada|marca el eje|introduce la tensi[oóÃ³]n|condici[oóÃ³]n adicional|\beje\b/i.test(value);
}

function containsStrictTeachingArtifact(value: string): boolean {
  return containsTeachingArtifact(value) || /\brecurso\b|\beje\b|\bsecuencia\b|\bmatiz\b|\bestructura\b/i.test(value);
}

function buildMentorKhaelFallback(structured: TarotStructuredInterpretation): string {
  if (structured.reversedWeight === "high") {
    return "Cuando una inversión pesa tanto, no conviene decidir por lo que promete la superficie, sino por lo que los hechos ya vienen mostrando.";
  }

  if (structured.carta_dominante === "Siete de Bastos") {
    return "No toda oportunidad que exige más de ti representa un avance; algunas solo cambian el lugar desde el que cargas el peso.";
  }

  if (structured.carta_dominante === "Dos de Espadas") {
    return "A veces el problema no es la decisión, sino el precio emocional que pagas por seguir posponiéndola.";
  }

  if (structured.narrativeTone === "expansivo") {
    return "Cuando una puerta se abre demasiado rápido, también conviene mirar qué parte de ti quiere cruzarla sin revisar el costo.";
  }

  if (structured.narrativeTone === "emocional") {
    return "Lo que parece intensidad solo se vuelve confiable cuando puede sostener gestos concretos y no solo promesas.";
  }

  return "Una buena lectura no busca empujarte: te ayuda a ver qué parte de la situación ya estaba hablando antes de preguntar.";
}

function buildProFallbackReading(
  structured: TarotStructuredInterpretation,
): Omit<TarotSpreadProReading, "aprendizaje_tarot"> {
  return {
    mensaje_central: truncateText(structured.conflicto_principal, 180),
    historia_profunda: truncateText(
      `${structured.conflicto_principal} ${structured.deseo_visible}`,
      320,
    ),
    dinamica_oculta: truncateText(structured.tension_central, 220),
    sombra: truncateText(structured.bloqueo_actual, 190),
    oportunidad: truncateText(structured.oportunidad_real, 190),
    riesgo: truncateText(structured.riesgo_real, 190),
    consejo: truncateText(structured.direccion_recomendada, 190),
    accion_concreta: truncateText(
      `En las proximas 48 horas, define una accion concreta alineada con esto: ${lowerSentenceStart(firstSentence(structured.direccion_recomendada, 120))}`,
      180,
    ),
    pregunta_reflexiva: truncateText(
      `Que parte de ${structured.eje_central} ya estas viendo y aun no quieres nombrar del todo?`,
      160,
    ),
    mentor_khael: buildMentorKhaelFallback(structured),
    sintesis_final: buildDistinctSintesisFinal(structured),
  };
}

function sanitizeProField(value: string): string {
  return cleanBackendSentence(stripTemplateArtifacts(value));
}

function sanitizeProReadingFinal(
  reading: TarotSpreadProReading,
  structured: TarotStructuredInterpretation,
): TarotSpreadProReading {
  const sanitized: TarotSpreadProReading = {
    ...reading,
    mensaje_central: sanitizeProField(reading.mensaje_central),
    historia_profunda: sanitizeProField(reading.historia_profunda),
    dinamica_oculta: sanitizeProField(reading.dinamica_oculta),
    sombra: sanitizeProField(reading.sombra),
    oportunidad: sanitizeProField(reading.oportunidad),
    riesgo: sanitizeProField(reading.riesgo),
    consejo: sanitizeProField(reading.consejo),
    accion_concreta: sanitizeProField(reading.accion_concreta),
    pregunta_reflexiva: sanitizeProField(reading.pregunta_reflexiva),
    mentor_khael: sanitizeProField(reading.mentor_khael),
    sintesis_final: sanitizeProField(reading.sintesis_final),
    aprendizaje_tarot: {
      cartas_clave: reading.aprendizaje_tarot.cartas_clave.map((item) => ({
        carta: item.carta,
        aporte: sanitizeProField(item.aporte),
      })),
      interaccion_simbolica: sanitizeProField(reading.aprendizaje_tarot.interaccion_simbolica),
      leccion_tarotista: sanitizeProField(reading.aprendizaje_tarot.leccion_tarotista),
    },
  };

  if (
    containsTemplateArtifact(sanitized.mentor_khael) ||
    areTextsTooSimilar(sanitized.mentor_khael, sanitized.mensaje_central) ||
    areTextsTooSimilar(sanitized.mentor_khael, sanitized.sintesis_final)
  ) {
    sanitized.mentor_khael = buildMentorKhaelFallback(structured);
  }

  if (containsTemplateArtifact(sanitized.aprendizaje_tarot.interaccion_simbolica)) {
    sanitized.aprendizaje_tarot.interaccion_simbolica = cleanBackendSentence(
      `${structured.carta_dominante} organiza la lectura alrededor de ${stripTrailingDots(structured.eje_central)}, mientras las cartas secundarias muestran qué recurso, tensión o condición acompaña ese movimiento.`
    );
  }

  if (containsTemplateArtifact(sanitized.aprendizaje_tarot.leccion_tarotista)) {
    sanitized.aprendizaje_tarot.leccion_tarotista = cleanBackendSentence(
      `Cuando ${structured.carta_dominante} domina una tirada, la clave es leer las demas cartas desde el eje que esa carta impone, no como significados separados.`,
    );
  }

  if (containsStrictTeachingArtifact(sanitized.aprendizaje_tarot.interaccion_simbolica)) {
    sanitized.aprendizaje_tarot.interaccion_simbolica = cleanBackendSentence(
      `${structured.carta_dominante} se combina con las otras cartas para mostrar que la pregunta no depende de un solo significado, sino del contraste entre impulso, freno y consecuencia.`,
    );
  }

  if (containsStrictTeachingArtifact(sanitized.aprendizaje_tarot.leccion_tarotista)) {
    sanitized.aprendizaje_tarot.leccion_tarotista = cleanBackendSentence(
      `Cuando ${cardDisplayName(structured.carta_dominante).toLowerCase()} domina una combinación, el estudiante debe observar si las otras cartas confirman su impulso, lo frenan o revelan una consecuencia que no era evidente al inicio.`,
    );
  }

  return sanitized;
}

function finalizeProReading(
  partial: TarotSpreadProReading,
  structured: TarotStructuredInterpretation,
  inputCards: CompactCardContext[],
): TarotSpreadProReading {
  const fallback = buildProFallbackReading(structured);
  const backendLearning = buildAprendizajeTarot(inputCards, structured);

  const merged: TarotSpreadProReading = {
    mensaje_central: partial.mensaje_central || fallback.mensaje_central,
    historia_profunda: partial.historia_profunda || fallback.historia_profunda,
    dinamica_oculta: partial.dinamica_oculta || fallback.dinamica_oculta,
    sombra: partial.sombra || fallback.sombra,
    oportunidad: partial.oportunidad || fallback.oportunidad,
    riesgo: partial.riesgo || fallback.riesgo,
    consejo: partial.consejo || fallback.consejo,
    accion_concreta: partial.accion_concreta || fallback.accion_concreta,
    pregunta_reflexiva: partial.pregunta_reflexiva || fallback.pregunta_reflexiva,
    aprendizaje_tarot: backendLearning,
    mentor_khael: partial.mentor_khael || fallback.mentor_khael,
    sintesis_final: partial.sintesis_final || fallback.sintesis_final,
  };

  if (areTextsTooSimilar(merged.mensaje_central, merged.sintesis_final)) {
    merged.sintesis_final = buildDistinctSintesisFinal(structured);
  }

  return sanitizeProReadingFinal(merged, structured);
}

function normalizeComparableText(value: string): string {
  return compactWhitespace(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();
}

function areTextsTooSimilar(a: string, b: string): boolean {
  const left = normalizeComparableText(a);
  const right = normalizeComparableText(b);

  if (!left || !right) {
    return false;
  }

  if (left === right || left.includes(right) || right.includes(left)) {
    return true;
  }

  const leftWords = new Set(left.split(" ").filter(Boolean));
  const rightWords = new Set(right.split(" ").filter(Boolean));
  const overlap = [...leftWords].filter((word) => rightWords.has(word)).length;
  const denominator = Math.max(leftWords.size, rightWords.size, 1);

  return overlap / denominator >= 0.8;
}

function buildDistinctSintesisFinal(structuredInterpretation: TarotStructuredInterpretation): string {
  if (structuredInterpretation.carta_dominante === "La Torre") {
    return "La lectura no habla de perderlo todo, sino de dejar de sostener una forma de avanzar que ya no responde a la verdad del momento.";
  }

  if (structuredInterpretation.nivel_transformacion === "alto") {
    return "El cierre de la tirada no está en resistir el giro, sino en elegir con qué verdad vas a reconstruir lo que sigue.";
  }

  if (structuredInterpretation.nivel_transformacion === "medio") {
    return "La tirada se ordena cuando conviertes lo que ya viste en una decisión más honesta y menos aplazada.";
  }

  return "La lectura se completa cuando dejas de medir solo el resultado inmediato y empiezas a reconocer qué parte del proceso ya te está respondiendo.";
}

function normalizeSpreadReading(value: unknown): TarotSpreadReading | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const mensaje_central = getFirstString(raw, ["mensaje_central", "mensaje central", "central_message", "mensaje"]);
  const historia = getFirstString(raw, ["historia", "story", "contexto", "context"]);
  const dinamica = getFirstString(raw, ["dinamica", "dinámica", "dynamic", "dinamica_relacional"]);
  const riesgo = getFirstString(raw, ["riesgo", "risk", "bloqueo", "blockage"]);
  const consejo = getFirstString(raw, ["consejo", "advice", "recomendacion", "recomendación"]);
  const accion = getFirstString(raw, ["accion", "acción", "action"]);

  if (!mensaje_central || !historia || !dinamica || !riesgo || !consejo || !accion) {
    return null;
  }

  return {
    mensaje_central,
    historia,
    dinamica,
    riesgo,
    consejo,
    accion,
  };
}

function normalizeProSpreadReading(value: unknown): TarotSpreadProReading | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const mensaje_central = getFirstString(raw, ["mensaje_central", "mensaje central", "central_message", "mensaje"]);
  const historia_profunda = getFirstString(raw, ["historia_profunda", "historia profunda", "historia"]);
  const dinamica_oculta = getFirstString(raw, ["dinamica_oculta", "dinámica_oculta", "dinamica oculta", "dinamica"]);
  const sombra = getFirstString(raw, ["sombra", "shadow"]);
  const oportunidad = getFirstString(raw, ["oportunidad", "opportunity"]);
  const riesgo = getFirstString(raw, ["riesgo", "risk"]);
  const consejo = getFirstString(raw, ["consejo", "advice"]);
  const accion_concreta = getFirstString(raw, ["accion_concreta", "acción_concreta", "accion concreta", "action"]);
  const pregunta_reflexiva = getFirstString(raw, ["pregunta_reflexiva", "pregunta reflexiva", "reflection_question", "pregunta"]);
  const mentor_khael = getFirstString(raw, ["mentor_khael", "mentor khael", "mentor"]);
  const sintesis_final = getFirstString(raw, ["sintesis_final", "síntesis_final", "sintesis final", "cierre"]);
  const aprendizajeRaw =
    raw.aprendizaje_tarot && typeof raw.aprendizaje_tarot === "object"
      ? (raw.aprendizaje_tarot as Record<string, unknown>)
      : null;
  const cartasClaveRaw = Array.isArray(aprendizajeRaw?.cartas_clave)
    ? aprendizajeRaw.cartas_clave
    : Array.isArray(aprendizajeRaw?.cartasClave)
      ? (aprendizajeRaw.cartasClave as unknown[])
      : null;
  const cartas_clave = (cartasClaveRaw ?? [])
    .map(normalizeLearningCardKey)
    .filter((item): item is TarotLearningCardKey => item !== null);
  const interaccion_simbolica = aprendizajeRaw
    ? getFirstString(aprendizajeRaw, ["interaccion_simbolica", "interacción_simbolica", "interaccion simbolica", "interaccion"])
    : "";
  const leccion_tarotista = aprendizajeRaw
    ? getFirstString(aprendizajeRaw, ["leccion_tarotista", "lección_tarotista", "leccion tarotista", "leccion"])
    : "";

  if (
    !mensaje_central ||
    !historia_profunda ||
    !dinamica_oculta ||
    !sombra ||
    !oportunidad ||
    !riesgo ||
    !consejo ||
    !accion_concreta ||
    !pregunta_reflexiva ||
    !mentor_khael ||
    cartas_clave.length === 0 ||
    cartas_clave.some((item) => !item.carta || !item.aporte) ||
    !interaccion_simbolica ||
    !leccion_tarotista ||
    !sintesis_final
  ) {
    return null;
  }

  return {
    mensaje_central,
    historia_profunda,
    dinamica_oculta,
    sombra,
    oportunidad,
    riesgo,
    consejo,
    accion_concreta,
    pregunta_reflexiva,
    aprendizaje_tarot: {
      cartas_clave,
      interaccion_simbolica,
      leccion_tarotista,
    },
    mentor_khael,
    sintesis_final,
  };
}

function normalizeCompactProSpreadReading(value: unknown): TarotSpreadProReading | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const mensaje_central = getFirstString(raw, ["mensaje_central", "mensaje central", "central_message", "mensaje"]);
  const historia_profunda = getFirstString(raw, ["historia_profunda", "historia profunda", "historia"]);
  const dinamica_oculta = getFirstString(raw, ["dinamica_oculta", "dinámica_oculta", "dinamica oculta", "dinamica"]);
  const sombra = getFirstString(raw, ["sombra", "shadow"]);
  const oportunidad = getFirstString(raw, ["oportunidad", "opportunity"]);
  const riesgo = getFirstString(raw, ["riesgo", "risk"]);
  const consejo = getFirstString(raw, ["consejo", "advice"]);
  const accion_concreta = getFirstString(raw, ["accion_concreta", "acción_concreta", "accion concreta", "action"]);
  const pregunta_reflexiva = getFirstString(raw, ["pregunta_reflexiva", "pregunta reflexiva", "reflection_question", "pregunta"]);
  const mentor_khael = getFirstString(raw, ["mentor_khael", "mentor khael", "mentor"]);
  const sintesis_final = getFirstString(raw, ["sintesis_final", "síntesis_final", "sintesis final", "cierre"]);

  if (
    !mensaje_central &&
    !historia_profunda &&
    !dinamica_oculta &&
    !sombra &&
    !oportunidad &&
    !riesgo &&
    !consejo &&
    !accion_concreta &&
    !pregunta_reflexiva &&
    !mentor_khael &&
    !sintesis_final
  ) {
    return null;
  }

  return {
    mensaje_central,
    historia_profunda,
    dinamica_oculta,
    sombra,
    oportunidad,
    riesgo,
    consejo,
    accion_concreta,
    pregunta_reflexiva,
    aprendizaje_tarot: {
      cartas_clave: [],
      interaccion_simbolica: "",
      leccion_tarotista: "",
    },
    mentor_khael,
    sintesis_final,
  };
}

function validateSpreadReading(value: unknown): TarotSpreadReading | null {
  const normalized = normalizeSpreadReading(value);
  if (!normalized) {
    return null;
  }

  return normalized;
}

function validateProSpreadReading(value: unknown): TarotSpreadProReading | null {
  const normalized = normalizeProSpreadReading(value);
  if (!normalized) {
    return null;
  }

  return normalized;
}

function validateCompactProSpreadReading(value: unknown): TarotSpreadProReading | null {
  const normalized = normalizeCompactProSpreadReading(value);
  if (!normalized) {
    return null;
  }

  return normalized;
}

function normalizeReadingText(text: string): string {
  const normalized = text
    .replace(/\bsembra\b/gi, "siembra")
    .replace(/accion visible/gi, "movimiento claro")
    .replace(/senales perfectas/gi, "garantias absolutas")
    .replace(/la clave es/gi, "lo decisivo ahora es")
    .replace(/sembrar con responsabilidad/gi, "cuidar lo que inicias con constancia")
    .replace(/actua con intencion/gi, "elige un paso concreto y sostenlo")
    .replace(/energia se centra/gi, "el foco cae")
    .replace(/actua con claridad/gi, "mueve esto con criterio")
    .replace(/usa lo que tienes/gi, "reconoce y ordena tus recursos reales")
    .replace(/algo visible/gi, "un resultado concreto")
    .replace(/escribe una accion/gi, "define un paso real")
    .replace(/reflexiona una accion/gi, "elige un movimiento puntual")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.replace(/(^|[.!?]\s+)([a-záéíóúñ])/g, (_, prefix: string, letter: string) =>
    `${prefix}${letter.toUpperCase()}`,
  );
}

function normalizeSpreadReadingOutput(reading: TarotSpreadReading): TarotSpreadReading {
  return {
    mensaje_central: normalizeReadingText(reading.mensaje_central),
    historia: normalizeReadingText(reading.historia),
    dinamica: normalizeReadingText(reading.dinamica),
    riesgo: normalizeReadingText(reading.riesgo),
    consejo: normalizeReadingText(reading.consejo),
    accion: normalizeReadingText(reading.accion),
  };
}

function normalizeProSpreadReadingOutput(reading: TarotSpreadProReading): TarotSpreadProReading {
  return {
    mensaje_central: normalizeReadingText(reading.mensaje_central),
    historia_profunda: normalizeReadingText(reading.historia_profunda),
    dinamica_oculta: normalizeReadingText(reading.dinamica_oculta),
    sombra: normalizeReadingText(reading.sombra),
    oportunidad: normalizeReadingText(reading.oportunidad),
    riesgo: normalizeReadingText(reading.riesgo),
    consejo: normalizeReadingText(reading.consejo),
    accion_concreta: normalizeReadingText(reading.accion_concreta),
    pregunta_reflexiva: normalizeReadingText(reading.pregunta_reflexiva),
    aprendizaje_tarot: {
      cartas_clave: reading.aprendizaje_tarot.cartas_clave.map((item) => ({
        carta: normalizeReadingText(item.carta),
        aporte: normalizeReadingText(item.aporte),
      })),
      interaccion_simbolica: normalizeReadingText(reading.aprendizaje_tarot.interaccion_simbolica),
      leccion_tarotista: normalizeReadingText(reading.aprendizaje_tarot.leccion_tarotista),
    },
    mentor_khael: normalizeReadingText(reading.mentor_khael),
    sintesis_final: normalizeReadingText(reading.sintesis_final),
  };
}

function extractLooseSpreadReading(raw: string): TarotSpreadReading | null {
  const normalized = normalizeModelJson(raw);
  const mensaje_central = extractQuotedFieldFromText(normalized, ["mensaje_central", "mensaje central", "central_message", "mensaje"]);
  const historia = extractQuotedFieldFromText(normalized, ["historia", "story", "contexto", "context"]);
  const dinamica = extractQuotedFieldFromText(normalized, ["dinamica", "dinámica", "dynamic", "dinamica_relacional"]);
  const riesgo = extractQuotedFieldFromText(normalized, ["riesgo", "risk", "bloqueo", "blockage"]);
  const consejo = extractQuotedFieldFromText(normalized, ["consejo", "advice", "recomendacion", "recomendación"]);
  const accion = extractQuotedFieldFromText(normalized, ["accion", "acción", "action"]);

  if (!mensaje_central || !historia || !dinamica || !riesgo || !consejo || !accion) {
    return null;
  }

  return {
    mensaje_central,
    historia,
    dinamica,
    riesgo,
    consejo,
    accion,
  };
}

function extractLooseProSpreadReading(raw: string): TarotSpreadProReading | null {
  const normalized = normalizeModelJson(raw);
  const mensaje_central = extractQuotedFieldFromText(normalized, ["mensaje_central", "mensaje central", "central_message", "mensaje"]);
  const historia_profunda = extractQuotedFieldFromText(normalized, ["historia_profunda", "historia profunda", "historia"]);
  const dinamica_oculta = extractQuotedFieldFromText(normalized, ["dinamica_oculta", "dinámica_oculta", "dinamica oculta", "dinamica"]);
  const sombra = extractQuotedFieldFromText(normalized, ["sombra", "shadow"]);
  const oportunidad = extractQuotedFieldFromText(normalized, ["oportunidad", "opportunity"]);
  const riesgo = extractQuotedFieldFromText(normalized, ["riesgo", "risk"]);
  const consejo = extractQuotedFieldFromText(normalized, ["consejo", "advice"]);
  const accion_concreta = extractQuotedFieldFromText(normalized, ["accion_concreta", "acción_concreta", "accion concreta", "action"]);
  const pregunta_reflexiva = extractQuotedFieldFromText(normalized, ["pregunta_reflexiva", "pregunta reflexiva", "reflection_question", "pregunta"]);
  const mentor_khael = extractQuotedFieldFromText(normalized, ["mentor_khael", "mentor khael", "mentor"]);
  const sintesis_final = extractQuotedFieldFromText(normalized, ["sintesis_final", "síntesis_final", "sintesis final", "cierre"]);
  const cartas_clave = (
    normalized.match(/"cartas_clave"\s*:\s*\[(.*?)\]/i)?.[1]
      ?.split(/}\s*,\s*{|","|",\s*"|"\s*,\s*"/)
      .map((item) => item.replace(/[{}]/g, "").trim())
      .filter(Boolean) ?? []
  ).map((item) => {
    const cartaMatch = item.match(/carta"\s*:\s*"([^"]+)/i);
    const aporteMatch = item.match(/aporte"\s*:\s*"([^"]+)/i);
    if (cartaMatch?.[1]) {
      return {
        carta: cartaMatch[1].trim(),
        aporte: aporteMatch?.[1]?.trim() || "",
      };
    }

    return {
      carta: item.replace(/^["\s]+|["\s]+$/g, ""),
      aporte: "",
    };
  });
  const interaccion_simbolica = extractQuotedFieldFromText(normalized, ["interaccion_simbolica", "interacción_simbolica", "interaccion simbolica", "interaccion"]);
  const leccion_tarotista = extractQuotedFieldFromText(normalized, ["leccion_tarotista", "lección_tarotista", "leccion tarotista", "leccion"]);

  if (
    !mensaje_central ||
    !historia_profunda ||
    !dinamica_oculta ||
    !sombra ||
    !oportunidad ||
    !riesgo ||
    !consejo ||
    !accion_concreta ||
    !pregunta_reflexiva ||
    !mentor_khael ||
    cartas_clave.length === 0 ||
    cartas_clave.some((item) => !item.carta) ||
    !interaccion_simbolica ||
    !leccion_tarotista ||
    !sintesis_final
  ) {
    return null;
  }

  return {
    mensaje_central,
    historia_profunda,
    dinamica_oculta,
    sombra,
    oportunidad,
    riesgo,
    consejo,
    accion_concreta,
    pregunta_reflexiva,
    aprendizaje_tarot: {
      cartas_clave,
      interaccion_simbolica,
      leccion_tarotista,
    },
    mentor_khael,
    sintesis_final,
  };
}

function extractLooseCompactProSpreadReading(raw: string): TarotSpreadProReading | null {
  const normalized = normalizeModelJson(raw);
  const mensaje_central = extractQuotedFieldFromText(normalized, ["mensaje_central", "mensaje central", "central_message", "mensaje"]);
  const historia_profunda = extractQuotedFieldFromText(normalized, ["historia_profunda", "historia profunda", "historia"]);
  const dinamica_oculta = extractQuotedFieldFromText(normalized, ["dinamica_oculta", "dinámica_oculta", "dinamica oculta", "dinamica"]);
  const sombra = extractQuotedFieldFromText(normalized, ["sombra", "shadow"]);
  const oportunidad = extractQuotedFieldFromText(normalized, ["oportunidad", "opportunity"]);
  const riesgo = extractQuotedFieldFromText(normalized, ["riesgo", "risk"]);
  const consejo = extractQuotedFieldFromText(normalized, ["consejo", "advice"]);
  const accion_concreta = extractQuotedFieldFromText(normalized, ["accion_concreta", "acción_concreta", "accion concreta", "action"]);
  const pregunta_reflexiva = extractQuotedFieldFromText(normalized, ["pregunta_reflexiva", "pregunta reflexiva", "reflection_question", "pregunta"]);
  const mentor_khael = extractQuotedFieldFromText(normalized, ["mentor_khael", "mentor khael", "mentor"]);
  const sintesis_final = extractQuotedFieldFromText(normalized, ["sintesis_final", "síntesis_final", "sintesis final", "cierre"]);

  if (
    !mensaje_central &&
    !historia_profunda &&
    !dinamica_oculta &&
    !sombra &&
    !oportunidad &&
    !riesgo &&
    !consejo &&
    !accion_concreta &&
    !pregunta_reflexiva &&
    !mentor_khael &&
    !sintesis_final
  ) {
    return null;
  }

  return {
    mensaje_central,
    historia_profunda,
    dinamica_oculta,
    sombra,
    oportunidad,
    riesgo,
    consejo,
    accion_concreta,
    pregunta_reflexiva,
    aprendizaje_tarot: {
      cartas_clave: [],
      interaccion_simbolica: "",
      leccion_tarotista: "",
    },
    mentor_khael,
    sintesis_final,
  };
}

async function getResolvedPlan(userId: string, requestPlan: PlanTier | null): Promise<PlanTier> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { userPlan: true },
  });

  return resolvePlanTier(profile?.userPlan ?? requestPlan);
}

export async function POST(req: Request) {
  const endpointStartedAt = Date.now();
  let cardLookupMs = 0;
  let promptBuildMs = 0;
  let promptLength = 0;
  let ollamaCallMs = 0;
  let generatedTokens: number | null = null;
  let numPredictUsed: number | null = null;
  let outcome = "success";
  let jsonRepairApplied = false;
  let parseStage: "direct" | "repaired-simple" | "loose" | "failed" = "failed";
  let proMode: "compact" | "standard" | null = null;

  try {
    const user = await getCurrentUser();
    const allowDevAiTest =
      process.env.NODE_ENV === "development" &&
      process.env.ALLOW_DEV_AI_TEST === "true";

    if (!user && !allowDevAiTest) {
      outcome = "unauthorized";
      return NextResponse.json(
        { success: false, error: "No autorizado." },
        { status: 401 },
      );
    }

    const body = (await req.json().catch(() => null)) as TarotSpreadLocalRequest | null;
    if (!body) {
      outcome = "invalid_body";
      return NextResponse.json(
        { success: false, error: "Body JSON invalido." },
        { status: 400 },
      );
    }

    const question = normalizeInput(body.question);
    const spreadType = body.spreadType;
    const cards = validateCards(body.cards);
    const requestPlan = normalizePlan(body.plan);

    if (!question || !isSpreadType(spreadType) || !cards) {
      outcome = "invalid_payload";
      return NextResponse.json(
        {
          success: false,
          error: "Debes enviar question, spreadType y cards validos.",
        },
        { status: 400 },
      );
    }

    const countError = validateSpreadCardCount(spreadType, cards.length);
    if (countError) {
      outcome = "invalid_card_count";
      return NextResponse.json(
        { success: false, error: countError },
        { status: 400 },
      );
    }

    const plan = user ? await getResolvedPlan(user.id, requestPlan) : requestPlan ?? "FREE";
    const constraints = PLAN_CONSTRAINTS[plan];
    const spreadConfig = SPREAD_CONFIG[spreadType];

    if (spreadType === "custom") {
      if (!canUseManualSpreadCardCount(plan, cards.length)) {
        outcome = "plan_restricted";
        return NextResponse.json(
          {
            success: false,
            error: `Tu plan ${plan} no permite una tirada personalizada de ${cards.length} cartas.`,
          },
          { status: 403 },
        );
      }
    } else if (!canUseSpread(plan, spreadConfig.internalId)) {
      outcome = "plan_restricted";
      return NextResponse.json(
        {
          success: false,
          error: `Tu plan ${plan} no tiene acceso a la tirada ${spreadType}.`,
        },
        { status: 403 },
      );
    }

    const cardLookupStartedAt = Date.now();
    const resolvedCards = cards.map((item, index) => {
      const card = getTarotCardById(item.cardId) as TarotCardData;
      if (!card) {
        return {
          error: `Carta no encontrada en la posicion ${index + 1}.`,
        };
      }

      const compactContext = buildCompactCardContext(card, item.scope, item.orientation, item.position, {
        scopeMaxChars: constraints.scopeMaxChars,
        scopeMinChars: constraints.scopeMinChars,
        generalMaxChars: constraints.generalMaxChars,
      });
      if (!compactContext) {
        return {
          error: `No hay contexto suficiente para la carta ${item.cardId} en la posicion ${index + 1}.`,
        };
      }

      return {
        compactContext,
      };
    });
    cardLookupMs = Date.now() - cardLookupStartedAt;

    const cardError = resolvedCards.find((item) => "error" in item);
    if (cardError) {
      outcome = "card_resolution_failed";
      return NextResponse.json(
        { success: false, error: cardError.error },
        { status: 422 },
      );
    }

    if (IS_DEV) {
      for (const item of resolvedCards as Array<{ compactContext: CompactCardContext }>) {
        console.info(formatAiCardContextAudit(item.compactContext));
      }

      const breakdownText = (resolvedCards as Array<{ compactContext: CompactCardContext }>).map((item) =>
        formatCompactCardContextDebug(item.compactContext),
      ).join("\n\n");
      console.info(`[AI CONTEXT][tarot-spread-local]\n${breakdownText}`);
    }

    const isProReading = plan === "PRO";
    const structuredInterpretation = isProReading
      ? buildStructuredInterpretationProCompact(
          question,
          resolvedCards as Array<{ compactContext: CompactCardContext }>,
        )
      : null;
    proMode = isProReading ? "compact" : null;

    if (IS_DEV && structuredInterpretation) {
      console.info(
        `[AI STRUCTURED][tarot-spread-local]\n${JSON.stringify(structuredInterpretation, null, 2)}`,
      );
      console.info(
        `[AI STRUCTURED][dominante]\ncarta_dominante: ${structuredInterpretation.carta_dominante}\neje_central: ${structuredInterpretation.eje_central}\nnivel_transformacion: ${structuredInterpretation.nivel_transformacion}`,
      );
    }

    const numPredict = isProReading
      ? constraints.numPredict
      : spreadType === "three_cards"
        ? 500
        : constraints.numPredict;
    numPredictUsed = numPredict;

    const promptBuildStartedAt = Date.now();
    const compactContexts = (resolvedCards as Array<{ compactContext: CompactCardContext }>).map(
      (item) => item.compactContext,
    );
    const prompt = isProReading && structuredInterpretation
      ? buildProSpreadCompactPrompt(question, spreadType, compactContexts, structuredInterpretation)
      : buildSpreadPrompt(question, spreadType, plan, compactContexts);
    promptBuildMs = Date.now() - promptBuildStartedAt;

    const ollamaCallStartedAt = Date.now();
    const result = await generateWithOllamaDetailed(prompt, {
      temperature: constraints.temperature,
      num_predict: numPredict,
      think: false,
      format: "json",
    });
    ollamaCallMs = Date.now() - ollamaCallStartedAt;
    promptLength = result.promptLength;
    generatedTokens = result.generatedTokens;

    const directParsed = normalizeModelJson(result.answer);
    let reading: TarotSpreadReading | TarotSpreadProReading | null = isProReading
      ? validateCompactProSpreadReading(tryParseJson<TarotSpreadProReading>(directParsed))
      : validateSpreadReading(tryParseJson<TarotSpreadReading>(directParsed));
    if (reading) {
      parseStage = "direct";
    }

    if (!reading) {
      const repaired = repairModelJson(result.answer);
      if (repaired) {
        reading = isProReading
          ? validateCompactProSpreadReading(tryParseJson<TarotSpreadProReading>(repaired))
          : validateSpreadReading(tryParseJson<TarotSpreadReading>(repaired));
        if (reading) {
          jsonRepairApplied = true;
          parseStage = "repaired-simple";
          console.warn("[AI WARN][tarot-spread-local] Se reparo JSON invalido devuelto por Ollama.");
        }
      }
    }

    if (!reading) {
      const looseReading = isProReading
        ? extractLooseCompactProSpreadReading(result.answer)
        : extractLooseSpreadReading(result.answer);
      if (looseReading) {
        reading = looseReading;
        jsonRepairApplied = true;
        parseStage = "loose";
        console.warn("[AI WARN][tarot-spread-local] Se reconstruyo reading desde pseudo-JSON de Ollama.");
      }
    }

    if (!reading) {
      outcome = "invalid_model_json";
      console.warn("[AI WARN][tarot-spread-local] Ollama devolvio un JSON invalido o fuera de contrato.");
      if (IS_DEV) {
        console.warn("[AI WARN][tarot-spread-local][raw-answer]", result.answer.slice(0, 1200));
        console.warn("[AI WARN][tarot-spread-local][truncated-by-limit]", result.generatedTokens === numPredict);
      }
      return NextResponse.json(
        {
          success: false,
          error: "La IA local devolvio una respuesta invalida para la tirada.",
        },
        { status: 502 },
      );
    }

    if (isProReading && structuredInterpretation) {
      reading = normalizeProSpreadReadingOutput(finalizeProReading(
        reading as TarotSpreadProReading,
        structuredInterpretation,
        compactContexts,
      ));
    } else {
      reading = normalizeSpreadReadingOutput(reading as TarotSpreadReading);
    }

    const config = getOllamaRuntimeConfig();

    return NextResponse.json({
      provider: "ollama",
      model: config.model,
      success: true,
      reading,
    });
  } catch (error) {
    outcome = error instanceof OllamaClientError ? error.code : "internal_error";

    if (error instanceof OllamaClientError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.status },
      );
    }

    console.error("Tarot spread local AI route error:", error);
    return NextResponse.json(
      { success: false, error: "Error interno procesando la tirada local." },
      { status: 500 },
    );
  } finally {
    if (IS_DEV) {
      console.info("[AI PERF][tarot-spread-local]", {
        proMode,
        outcome,
        cardLookupMs,
        promptBuildMs,
        promptLength,
        num_predict: numPredictUsed,
        ollamaCallMs,
        generatedTokens,
        jsonRepairApplied,
        parseStage,
        totalEndpointMs: Date.now() - endpointStartedAt,
      });
    }
  }
}
