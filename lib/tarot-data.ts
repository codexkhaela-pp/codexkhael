import majorData from "@/src/data/arcanos_mayores_modal_data_PRO_FINAL_v2.json";
import cupsData from "@/src/data/arcanos_menores_copas_modal_data_PRO_FINAL_v1.json";
import pentaclesData from "@/src/data/arcanos_menores_oros_modal_data_PRO_FINAL_v1.json";
import wandsData from "@/src/data/arcanos_menores_bastos_modal_data_PRO_FINAL_v1.json";
import swordsData from "@/src/data/arcanos_menores_espadas_modal_data_PRO_FINAL_v1.json";
import { rawTarotCards } from "@/src/data/tarotCards";

const ALL_CARDS = [
  ...majorData.cartas,
  ...cupsData.cartas,
  ...pentaclesData.cartas,
  ...wandsData.cartas,
  ...swordsData.cartas
];

const SUITS_ES_EN: Record<string, string> = {
  copas: "cups",
  oros: "pentacles",
  coins: "pentacles",
  disks: "pentacles",
  bastos: "wands",
  espadas: "swords"
};

const RANKS_ES_EN: Record<string, string> = {
  as: "ace",
  sota: "page",
  caballo: "knight",
  reina: "queen",
  rey: "king",
  dos: "two",
  tres: "three",
  cuatro: "four",
  cinco: "five",
  seis: "six",
  siete: "seven",
  ocho: "eight",
  nueve: "nine",
  diez: "ten"
};

export function normalizeCardId(identifier: string): string {
  let norm = identifier.toLowerCase().replace(/_/g, '-').trim();
  
  if (ALL_CARDS.some(c => c.id === norm)) return norm;

  norm = norm.replace(/\s+/g, '-');
  norm = norm.replace(/-de-/g, '-');

  const parts = norm.split('-');
  if (parts.length === 2) {
    const rank = parts[0];
    const suit = parts[1];
    
    const engRank = RANKS_ES_EN[rank] || rank;
    const engSuit = SUITS_ES_EN[suit] || suit;
    
    return `${engRank}-of-${engSuit}`;
  }

  return norm;
}

export function getTarotCardById(identifier: string) {
  if (!identifier) return null;
  const normalized = normalizeCardId(identifier);
  
  const card = ALL_CARDS.find(c => c.id === normalized || c.id === identifier);
  return card || null;
}

// Development Validation
if (process.env.NODE_ENV === "development") {
  const missing = rawTarotCards.filter(visualCard => !getTarotCardById(visualCard.slug));
  if (missing.length > 0) {
    console.warn("Cartas sin data PRO:", missing.map(c => ({ id: c.id, slug: c.slug, nameEs: c.nameEs })));
  } else {
    console.log(`[TarotData] Las ${rawTarotCards.length} cartas visuales resuelven a data PRO correctamente.`);
  }
}
