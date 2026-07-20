import majorData from "@/src/data/arcanos_mayores_modal_data_PRO_FINAL_v2.json";
import cupsData from "@/src/data/arcanos_menores_copas_modal_data_PRO_FINAL_v1.json";
import pentaclesData from "@/src/data/arcanos_menores_oros_modal_data_PRO_FINAL_v1.json";
import wandsData from "@/src/data/arcanos_menores_bastos_modal_data_PRO_FINAL_v1.json";
import swordsData from "@/src/data/arcanos_menores_espadas_modal_data_PRO_FINAL_v1.json";
import type { TarotCard as DeckTarotCard } from "@/src/data/tarotCards";
import { normalizeCardId } from "@/lib/tarot-data";

export type InterpretationTone = "mystic" | "psychological" | "direct";

export interface InterpretacionBloque {
  titulo: string;
  general: string;
  detalle: string;
  consejo: string;
  preguntas: string[];
}

export interface TarotCard {
  id: string;
  nombre: string;
  arcano: "Mayor" | "Menor";
  palo?: "Oros" | "Bastos" | "Copas" | "Espadas";
  ambitos: {
    [ambito: string]: {
      derecho: InterpretacionBloque;
      invertido: InterpretacionBloque;
    };
  };
  profundidad_pro: {
    insights: string[];
    combinaciones?: Array<{ con: string; significado: string }>;
    micro_reto_24h: string;
    mantra: string;
  };
}

export interface CartaPosicionada {
  carta: TarotCard;
  orientacion: "derecho" | "invertido";
  intencionPosicion: string;
  numeroPosicion: number;
}

export type PosicionData = InterpretacionBloque;
export type TarotCardData = TarotCard;
export type CartaEnMesa = CartaPosicionada;

export type SpreadInterpretationCard = {
  position: string | { id?: number; label: string; subtitle?: string };
  card: DeckTarotCard;
  reversed: boolean;
  ambito?: string;
};

export type PositionReading = {
  positionNumber: number;
  positionName: string;
  positionSubtitle: string;
  cardName: string;
  orientation: string;
  interpretation: string;
};

export type QuickInterpretationOutput = {
  summary: string;
  positionReadings: PositionReading[];
  relationships: string;
  finalAdvice: string;
};

type QuickInterpretationInput = {
  spreadId: string;
  cards: SpreadInterpretationCard[];
  tone: InterpretationTone;
  question?: string | null;
  spreadName?: string | null;
};

type TarotCardsRoot = {
  cartas: TarotCard[];
};

type AmbitoActivo = "amor" | "trabajo" | "dinero" | "salud" | "viajes" | "espiritual";
type HtmlBuilder = string[];

const ALL_LOCAL_CARDS: TarotCard[] = [
  ...(majorData as TarotCardsRoot).cartas,
  ...(cupsData as TarotCardsRoot).cartas,
  ...(pentaclesData as TarotCardsRoot).cartas,
  ...(wandsData as TarotCardsRoot).cartas,
  ...(swordsData as TarotCardsRoot).cartas,
];

const EMPTY_INTERPRETACION_BLOQUE: InterpretacionBloque = {
  titulo: "",
  general: "",
  detalle: "",
  consejo: "",
  preguntas: [],
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function cleanText(value: string | null | undefined): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function escapeHtml(value: string | null | undefined): string {
  return cleanText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function pushEscapedParagraph(builder: HtmlBuilder, value: string | null | undefined, className?: string): void {
  const text = escapeHtml(value);
  if (!text) return;
  builder.push(className ? `<p class="${className}">${text}</p>` : `<p>${text}</p>`);
}

function pushRawParagraph(builder: HtmlBuilder, html: string, className?: string): void {
  if (!html.trim()) return;
  builder.push(className ? `<p class="${className}">${html}</p>` : `<p>${html}</p>`);
}

function getPositionLabel(position: SpreadInterpretationCard["position"]): string {
  return typeof position === "string" ? position : position.label;
}

function getPositionNumber(entry: SpreadInterpretationCard, fallbackIndex: number): number {
  if (typeof entry.position !== "string" && typeof entry.position.id === "number") {
    return entry.position.id;
  }
  return fallbackIndex + 1;
}

function detectAmbito(question?: string | null): AmbitoActivo {
  const value = normalize(question ?? "");

  if (/\b(amor|pareja|relacion|relaciones|vinculo|ex|sentimientos?)\b/.test(value)) return "amor";
  if (/\b(trabajo|empleo|negocio|proyecto|carrera|profesion|ascenso|promocion|jefe|empresa|puesto|cargo|salario|sueldo)\b/.test(value)) return "trabajo";
  if (/\b(dinero|finanzas|economia|pago|deuda|inversion)\b/.test(value)) return "dinero";
  if (/\b(salud|cuerpo|energia|ansiedad|dolor|bienestar)\b/.test(value)) return "salud";
  if (/\b(viaje|viajes|mudanza|traslado|extranjero)\b/.test(value)) return "viajes";
  if (/\b(espiritual|alma|proposito|camino|energia|ritual)\b/.test(value)) return "espiritual";

  return "espiritual";
}

function findLocalCard(card: DeckTarotCard): TarotCard | null {
  const candidates = [card.slug, card.id, card.nameEs, normalizeCardId(card.slug), normalizeCardId(card.id)].filter(Boolean);

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeCardId(candidate);
    const match = ALL_LOCAL_CARDS.find(
      (localCard) =>
        localCard.id === normalizedCandidate ||
        normalize(localCard.id) === normalize(candidate) ||
        normalize(localCard.nombre) === normalize(candidate) ||
        normalize(localCard.nombre) === normalize(card.nameEs),
    );

    if (match) return match;
  }

  return null;
}

function getAmbitoData(carta: TarotCard, ambito: string, orientacion: CartaPosicionada["orientacion"]): InterpretacionBloque {
  const ambitos = carta.ambitos ?? {};
  const normalizedAmbito = normalize(ambito);
  const selectedAmbito = ambitos[normalizedAmbito] ?? ambitos.espiritual ?? Object.values(ambitos)[0];
  return selectedAmbito?.[orientacion] ?? selectedAmbito?.derecho ?? EMPTY_INTERPRETACION_BLOQUE;
}

function adaptCards(cards: SpreadInterpretationCard[], question?: string | null): { lectura: CartaPosicionada[]; ambito: AmbitoActivo } {
  const ambito = detectAmbito(question);
  const lectura = cards
    .map((entry, index): CartaPosicionada | null => {
      const carta = findLocalCard(entry.card);
      if (!carta) return null;

      return {
        carta,
        orientacion: entry.reversed ? "invertido" : "derecho",
        intencionPosicion: getPositionLabel(entry.position),
        numeroPosicion: getPositionNumber(entry, index),
      };
    })
    .filter((item): item is CartaPosicionada => Boolean(item))
    .sort((a, b) => a.numeroPosicion - b.numeroPosicion);

  return { lectura, ambito };
}

function getByPosition(lectura: CartaPosicionada[], numeroPosicion: number): CartaPosicionada | null {
  return lectura.find((item) => item.numeroPosicion === numeroPosicion) ?? null;
}

function getCartaGuia(lectura: CartaPosicionada[]): CartaPosicionada {
  return getByPosition(lectura, 2) ?? lectura[0];
}

function getCartaFinal(lectura: CartaPosicionada[]): CartaPosicionada {
  return getByPosition(lectura, 10) ?? lectura[lectura.length - 1];
}

function formatCardLabel(item: CartaPosicionada | null | undefined): string {
  if (!item) return "";
  return `${item.carta.nombre}${item.orientacion === "invertido" ? " Invertida" : ""}`;
}

function getFirstQuestion(data: InterpretacionBloque): string {
  return cleanText(data.preguntas?.[0]);
}

function renderResumenGeneral(lectura: CartaPosicionada[], ambito: string): string {
  const c1 = getByPosition(lectura, 1) ?? lectura[0];
  const c2 = getCartaGuia(lectura);
  const c3 = getByPosition(lectura, 3) ?? lectura[Math.min(2, lectura.length - 1)];
  const c4 = getByPosition(lectura, 4);
  const c5 = getByPosition(lectura, 5);
  const c6 = getByPosition(lectura, 6);
  const c7 = getByPosition(lectura, 7);
  const c8 = getByPosition(lectura, 8);
  const c9 = getByPosition(lectura, 9);
  const c10 = getCartaFinal(lectura);
  const c2Data = getAmbitoData(c2.carta, ambito, c2.orientacion);
  const c5Data = c5 ? getAmbitoData(c5.carta, ambito, c5.orientacion) : null;
  const c6Data = c6 ? getAmbitoData(c6.carta, ambito, c6.orientacion) : null;
  const c7Data = c7 ? getAmbitoData(c7.carta, ambito, c7.orientacion) : null;
  const c8Data = c8 ? getAmbitoData(c8.carta, ambito, c8.orientacion) : null;
  const c9Data = c9 ? getAmbitoData(c9.carta, ambito, c9.orientacion) : null;
  const c10Data = getAmbitoData(c10.carta, ambito, c10.orientacion);
  const timeline = c4
    ? `${formatCardLabel(c1)} → ${formatCardLabel(c2)} → Reto: ${formatCardLabel(c4)} → ${formatCardLabel(c3)}`
    : `${formatCardLabel(c1)} → ${formatCardLabel(c2)} → ${formatCardLabel(c3)}`;
  const builder: HtmlBuilder = [];

  builder.push(`<div class="resumen-general-block sacred-map-summary">`);
  builder.push(`<section class="sacred-axis-block sacred-axis-block--core">`);
  builder.push(`<h4>Núcleo central</h4>`);
  pushEscapedParagraph(builder, timeline, "sacred-axis-timeline");
  pushRawParagraph(builder, `<strong>${escapeHtml(c2.intencionPosicion)}:</strong> ${escapeHtml(c2Data.general)}`);
  builder.push(`</section>`);

  if (c5 || c6) {
    builder.push(`<section class="sacred-axis-block sacred-axis-block--consciousness">`);
    builder.push(`<h4>Eje de conciencia</h4>`);
    builder.push(`<div class="sacred-axis-pair">`);
    if (c5 && c5Data) {
      builder.push(`<article><strong>${escapeHtml(c5.intencionPosicion)}</strong>`);
      pushEscapedParagraph(builder, c5Data.detalle);
      builder.push(`</article>`);
    }
    if (c6 && c6Data) {
      builder.push(`<article><strong>${escapeHtml(c6.intencionPosicion)}</strong>`);
      pushEscapedParagraph(builder, c6Data.detalle);
      builder.push(`</article>`);
    }
    builder.push(`</div>`);
    builder.push(`</section>`);
  }

  builder.push(`<section class="sacred-axis-block sacred-axis-block--consultant">`);
  builder.push(`<h4>Columna del consultante</h4>`);
  if (c7 && c7Data) pushRawParagraph(builder, `• <strong>${escapeHtml(c7.intencionPosicion)}:</strong> ${escapeHtml(c7Data.detalle)}`);
  if (c8 && c8Data) pushRawParagraph(builder, `• <strong>${escapeHtml(c8.intencionPosicion)}:</strong> ${escapeHtml(c8Data.detalle)}`);
  if (c9 && c9Data) pushRawParagraph(builder, `• <strong>${escapeHtml(c9.intencionPosicion)}:</strong> ${escapeHtml(c9Data.detalle)}`);
  pushRawParagraph(builder, `• <strong>${escapeHtml(c10.intencionPosicion)}:</strong> ${escapeHtml(c10Data.general)}`);
  builder.push(`</section>`);
  builder.push(`</div>`);

  return builder.join("");
}

function renderLecturaPorPosicion(lectura: CartaPosicionada[], ambito: string): PositionReading[] {
  return lectura.map((item) => {
    const dataAmbito = getAmbitoData(item.carta, ambito, item.orientacion);
    const orientacionLabel = item.orientacion === "derecho" ? "Derecho" : "Invertido";
    const firstQuestion = getFirstQuestion(dataAmbito);
    const interpretation = `
      <div class="posicion-item local-position-reading border-b border-slate-800 py-4">
        <span class="text-xs font-mono uppercase tracking-widest text-amber-500">Posición ${item.numeroPosicion}: ${escapeHtml(item.intencionPosicion)}</span>
        <h4 class="text-md font-bold text-gray-100 mt-1">${escapeHtml(item.carta.nombre)} (${orientacionLabel})</h4>
        <p class="position-reading-meta">Ámbito: ${escapeHtml(ambito)}</p>
        <p class="text-sm text-gray-300 mt-1 leading-relaxed">${escapeHtml(dataAmbito.general)}</p>
        <p class="text-sm text-gray-400 mt-1 leading-relaxed">${escapeHtml(dataAmbito.detalle)}</p>
        ${firstQuestion ? `<p class="position-reading-question"><strong>Pregunta:</strong> ${escapeHtml(firstQuestion)}</p>` : ""}
      </div>`;

    return {
      positionNumber: item.numeroPosicion,
      positionName: item.intencionPosicion,
      positionSubtitle: "",
      cardName: item.carta.nombre,
      orientation: orientacionLabel,
      interpretation,
    };
  });
}

function renderRelacionesEntreCartas(lectura: CartaPosicionada[]): string {
  const builder: HtmlBuilder = [];
  const rendered = new Set<string>();

  for (const item of lectura) {
    const combinations = item.carta.profundidad_pro.combinaciones ?? [];

    for (const combination of combinations) {
      const related = lectura.find(
        (candidate) =>
          candidate.carta.id !== item.carta.id &&
          normalize(candidate.carta.nombre) === normalize(combination.con),
      );

      if (!related) continue;

      const key = [item.carta.id, related.carta.id].sort().join("|");
      if (rendered.has(key)) continue;
      rendered.add(key);

      builder.push(
        `<div class="combination-item bg-slate-950 p-3 rounded-md mb-2 border border-slate-800">
          <span class="text-amber-400 font-bold">${escapeHtml(item.carta.nombre)} (${escapeHtml(item.intencionPosicion)}) + ${escapeHtml(related.carta.nombre)} (${escapeHtml(related.intencionPosicion)}):</span>
          <p class="text-gray-300 text-sm mt-1">${escapeHtml(combination.significado)}</p>
        </div>`,
      );
    }
  }

  if (builder.length > 0) return builder.join("");
  return "<p class='text-gray-400 text-sm italic'>No hay combinaciones exactas registradas entre estas cartas en los JSON locales.</p>";
}

function renderConsejoFinalIntegrado(lectura: CartaPosicionada[], ambito: string): string {
  const cartaFinal = getCartaFinal(lectura);
  const cartaGuia = getCartaGuia(lectura);
  const dataConsejoFinal = getAmbitoData(cartaFinal.carta, ambito, cartaFinal.orientacion);

  return `
    <div class="consejo-final-wrapper p-4 bg-slate-900 rounded-xl border border-slate-800">
      <h3 class="text-base font-bold text-amber-400 mb-2">Consejo final integrado</h3>
      <p class="text-gray-300 text-sm leading-relaxed mb-4">${escapeHtml(dataConsejoFinal.consejo)}</p>
      <div class="border-t border-slate-800 pt-3 text-center">
        <p class="text-xs text-amber-500 font-semibold mb-1">Micro-reto de integración</p>
        <p class="text-gray-300 text-sm mb-3">${escapeHtml(cartaGuia.carta.profundidad_pro.micro_reto_24h)}</p>
        <p class="text-xs text-amber-500 font-semibold mb-1">Mantra de integración</p>
        <p class="font-serif italic text-gray-200">&quot;${escapeHtml(cartaGuia.carta.profundidad_pro.mantra)}&quot;</p>
      </div>
    </div>`;
}

export function getQuickInterpretation({ cards, question }: QuickInterpretationInput): QuickInterpretationOutput {
  if (cards.length === 0) {
    return {
      summary: "",
      positionReadings: [],
      relationships: "",
      finalAdvice: "",
    };
  }

  const { lectura, ambito } = adaptCards(cards, question);
  if (lectura.length === 0) {
    return {
      summary: "",
      positionReadings: [],
      relationships: "",
      finalAdvice: "",
    };
  }

  return {
    summary: renderResumenGeneral(lectura, ambito),
    positionReadings: renderLecturaPorPosicion(lectura, ambito),
    relationships: renderRelacionesEntreCartas(lectura),
    finalAdvice: renderConsejoFinalIntegrado(lectura, ambito),
  };
}
