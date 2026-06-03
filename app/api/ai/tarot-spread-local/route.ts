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

function validateSpreadReading(value: unknown): TarotSpreadReading | null {
  const normalized = normalizeSpreadReading(value);
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

    const numPredict = spreadType === "three_cards" ? 500 : constraints.numPredict;

    const promptBuildStartedAt = Date.now();
    const prompt = buildSpreadPrompt(
      question,
      spreadType,
      plan,
      (resolvedCards as Array<{ compactContext: CompactCardContext }>).map((item) => item.compactContext),
    );
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

    const directParsed = tryParseJson<TarotSpreadReading>(normalizeModelJson(result.answer));
    let reading = validateSpreadReading(directParsed);
    if (reading) {
      parseStage = "direct";
    }

    if (!reading) {
      const repaired = repairModelJson(result.answer);
      if (repaired) {
        const repairedParsed = tryParseJson<TarotSpreadReading>(repaired);
        reading = validateSpreadReading(repairedParsed);
        if (reading) {
          jsonRepairApplied = true;
          parseStage = "repaired";
          console.warn("[AI WARN][tarot-spread-local] Se reparo JSON invalido devuelto por Ollama.");
        }
      }
    }

    if (!reading) {
      const looseReading = extractLooseSpreadReading(result.answer);
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

    reading = normalizeSpreadReadingOutput(reading);

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
