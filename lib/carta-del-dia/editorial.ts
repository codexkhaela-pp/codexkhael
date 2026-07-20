import majorArcanaData from "@/src/data/arcanos_mayores_modal_data_PRO_FINAL_v2.json";
import wandsData from "@/src/data/arcanos_menores_bastos_modal_data_PRO_FINAL_v1.json";
import cupsData from "@/src/data/arcanos_menores_copas_modal_data_PRO_FINAL_v1.json";
import swordsData from "@/src/data/arcanos_menores_espadas_modal_data_PRO_FINAL_v1.json";
import pentaclesData from "@/src/data/arcanos_menores_oros_modal_data_PRO_FINAL_v1.json";
import type { CardOrientation } from "@/src/generated/prisma/client";

type OrientationKey = "derecho" | "invertido";
type ScopeKey = "amor" | "trabajo" | "dinero" | "espiritual";

type EditorialBlock = {
  titulo?: string;
  texto?: string;
};

type EditorialScopeEntry = {
  titulo?: string;
  general?: string;
  detalle?: string;
  consejo?: string;
  preguntas?: string[];
  bloques?: EditorialBlock[];
};

type EditorialSummary = {
  derecho?: string;
  invertido?: string;
  mensaje_clave?: string;
  tip_practico?: string;
  afirmacion?: string;
  frase_corta?: Record<OrientationKey, string>;
  energia_general?: Record<OrientationKey, string>;
  momento_clave?: Record<OrientationKey, string>;
};

type EditorialSymbol = {
  lectura_visual?: string;
  pregunta_reflexion?: string;
};

type EditorialCard = {
  nombre?: string;
  resumen?: EditorialSummary;
  ambitos?: Partial<Record<ScopeKey, Partial<Record<OrientationKey, EditorialScopeEntry>>>>;
  simbologia?: EditorialSymbol[];
};

const EDITORIAL_CARDS = [
  ...((majorArcanaData as { cartas?: EditorialCard[] }).cartas ?? []),
  ...((wandsData as { cartas?: EditorialCard[] }).cartas ?? []),
  ...((cupsData as { cartas?: EditorialCard[] }).cartas ?? []),
  ...((swordsData as { cartas?: EditorialCard[] }).cartas ?? []),
  ...((pentaclesData as { cartas?: EditorialCard[] }).cartas ?? []),
];

function orientationKeyFromPrisma(orientation: CardOrientation): OrientationKey {
  return orientation === "REVERSED" ? "invertido" : "derecho";
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function cleanPrefix(value: string): string {
  return normalizeWhitespace(
    value
      .replace(/^Consejo:\s*/i, "")
      .replace(/^Relaciones:\s*/i, "")
      .replace(/^Solteros:\s*/i, "")
      .replace(/^Parejas:\s*/i, "")
      .replace(/^Consejo práctico:\s*/i, ""),
  );
}

function takeNonEmpty(parts: Array<string | undefined>, maxParts = parts.length): string[] {
  return parts
    .map((part) => (part ? cleanPrefix(part) : ""))
    .filter(Boolean)
    .slice(0, maxParts);
}

function joinParagraphs(parts: Array<string | undefined>, maxParts = parts.length): string {
  return takeNonEmpty(parts, maxParts).join("\n\n");
}

function joinSentences(parts: Array<string | undefined>, maxParts = parts.length): string {
  return takeNonEmpty(parts, maxParts).join(" ");
}

function firstSentence(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = cleanPrefix(value);
  const match = normalized.match(/^.+?[.!?](?=\s|$)/);
  return match ? match[0].trim() : normalized;
}

function ensureSentence(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = cleanPrefix(value);
  return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
}

function adaptScopeLead(scope: ScopeKey, value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = cleanPrefix(value)
    .replace(/^En amor,\s*/i, "En lo afectivo, ")
    .replace(/^En trabajo,\s*/i, "En lo laboral, ")
    .replace(/^En dinero,\s*/i, "En lo económico, ")
    .replace(/^En salud,\s*/i, "En tu bienestar, ")
    .replace(/^En viajes,\s*/i, "En tus movimientos, ")
    .replace(/^En espiritual,\s*/i, "A nivel interior, ");

  if (scope === "espiritual") {
    return normalized
      .replace(/\bintuición\b/gi, "intuición")
      .replace(/\bespiritual\b/gi, "interior");
  }

  return normalized;
}

export function getEditorialCard(cardName: string): EditorialCard | null {
  return EDITORIAL_CARDS.find((card) => card.nombre === cardName) ?? null;
}

export function buildEditorialDailyContent(cardName: string, orientation: CardOrientation) {
  const editorialCard = getEditorialCard(cardName);
  if (!editorialCard) {
    return null;
  }

  const orientationKey = orientationKeyFromPrisma(orientation);
  const oppositeKey: OrientationKey = orientationKey === "derecho" ? "invertido" : "derecho";
  const summary = editorialCard.resumen ?? {};
  const scopes = editorialCard.ambitos ?? {};
  const amor = scopes.amor?.[orientationKey];
  const dinero = scopes.dinero?.[orientationKey];
  const trabajo = scopes.trabajo?.[orientationKey];
  const espiritual = scopes.espiritual?.[orientationKey];
  const symbol = editorialCard.simbologia?.[0];

  const heroMessage =
    summary.frase_corta?.[orientationKey] ||
    summary.mensaje_clave ||
    summary.momento_clave?.[orientationKey] ||
    summary[orientationKey] ||
    null;

  const mainMessage = joinParagraphs(
    [
      summary[orientationKey],
      summary.momento_clave?.[orientationKey],
      summary.mensaje_clave,
    ],
    3,
  );

  const actionMessage = joinSentences(
    [
      ensureSentence(summary.energia_general?.[orientationKey]),
      summary.tip_practico,
    ],
    2,
  );

  const loveMessage = joinSentences(
    [
      adaptScopeLead("amor", amor?.detalle),
      firstSentence(amor?.consejo),
    ],
    2,
  );

  const moneyMessage = joinSentences(
    [
      adaptScopeLead("dinero", dinero?.detalle),
      firstSentence(dinero?.consejo),
    ],
    2,
  );

  const workMessage = joinSentences(
    [
      adaptScopeLead("trabajo", trabajo?.detalle),
      firstSentence(trabajo?.consejo),
    ],
    2,
  );

  const growthMessage = joinSentences(
    [
      adaptScopeLead("espiritual", espiritual?.detalle),
      firstSentence(espiritual?.consejo),
    ],
    2,
  );

  const reflectionQuestion =
    espiritual?.preguntas?.[0] ||
    amor?.preguntas?.[0] ||
    trabajo?.preguntas?.[0] ||
    dinero?.preguntas?.[0] ||
    symbol?.pregunta_reflexion ||
    null;

  const shadowMessage = joinParagraphs(
    [
      symbol?.lectura_visual,
      scopes.espiritual?.[oppositeKey]?.detalle,
      scopes.amor?.[oppositeKey]?.detalle,
    ],
    2,
  );

  return {
    heroMessage,
    mainMessage,
    actionMessage,
    loveMessage,
    moneyMessage,
    workMessage,
    growthMessage,
    reflectionQuestion,
    shadowMessage,
    affirmation: summary.afirmacion ?? null,
  };
}
