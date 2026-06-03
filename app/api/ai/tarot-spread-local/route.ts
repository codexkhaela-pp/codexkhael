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
    numPredict: 900,
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
  mensaje_central: string;
  historia_profunda: string;
  dinamica_oculta: string;
  sombra: string;
  oportunidad: string;
  riesgo: string;
  consejo: string;
  accion_concreta: string;
  pregunta_reflexiva: string;
  sintesis_final: string;
};

type TarotStructuredInterpretation = {
  tema: string;
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

  return {
    tema: question,
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
- Devuelve SOLO JSON valido minificado en una sola linea.
- Sin markdown.
- Sin texto antes o despues del JSON.

Estructura exacta:
{"mensaje_central":"","historia_profunda":"","dinamica_oculta":"","sombra":"","oportunidad":"","riesgo":"","consejo":"","accion_concreta":"","pregunta_reflexiva":"","sintesis_final":""}`;
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
  const sintesis_final = getFirstString(raw, ["sintesis_final", "síntesis_final", "sintesis final", "cierre"]);

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
  const sintesis_final = extractQuotedFieldFromText(normalized, ["sintesis_final", "síntesis_final", "sintesis final", "cierre"]);

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
  let outcome = "success";
  let jsonRepairApplied = false;
  let parseStage: "direct" | "repaired" | "loose" | "failed" = "failed";

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
      ? buildStructuredInterpretationPro(
          question,
          resolvedCards as Array<{ compactContext: CompactCardContext }>,
        )
      : null;

    if (IS_DEV && structuredInterpretation) {
      console.info(
        `[AI STRUCTURED][tarot-spread-local]\n${JSON.stringify(structuredInterpretation, null, 2)}`,
      );
    }

    const numPredict = isProReading
      ? constraints.numPredict
      : spreadType === "three_cards"
        ? 500
        : constraints.numPredict;

    const promptBuildStartedAt = Date.now();
    const compactContexts = (resolvedCards as Array<{ compactContext: CompactCardContext }>).map(
      (item) => item.compactContext,
    );
    const prompt = isProReading && structuredInterpretation
      ? buildProSpreadPrompt(question, spreadType, compactContexts, structuredInterpretation)
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
      ? validateProSpreadReading(tryParseJson<TarotSpreadProReading>(directParsed))
      : validateSpreadReading(tryParseJson<TarotSpreadReading>(directParsed));
    if (reading) {
      parseStage = "direct";
    }

    if (!reading) {
      const repaired = repairModelJson(result.answer);
      if (repaired) {
        reading = isProReading
          ? validateProSpreadReading(tryParseJson<TarotSpreadProReading>(repaired))
          : validateSpreadReading(tryParseJson<TarotSpreadReading>(repaired));
        if (reading) {
          jsonRepairApplied = true;
          parseStage = "repaired";
          console.warn("[AI WARN][tarot-spread-local] Se reparo JSON invalido devuelto por Ollama.");
        }
      }
    }

    if (!reading) {
      const looseReading = isProReading
        ? extractLooseProSpreadReading(result.answer)
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

    reading = isProReading
      ? normalizeProSpreadReadingOutput(reading as TarotSpreadProReading)
      : normalizeSpreadReadingOutput(reading as TarotSpreadReading);

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
        outcome,
        cardLookupMs,
        promptBuildMs,
        promptLength,
        ollamaCallMs,
        generatedTokens,
        jsonRepairApplied,
        parseStage,
        totalEndpointMs: Date.now() - endpointStartedAt,
      });
    }
  }
}
