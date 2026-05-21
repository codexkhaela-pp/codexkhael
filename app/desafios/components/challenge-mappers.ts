import type { ChallengeCategory, ChallengeItem, ChallengeDetail } from "@/app/desafios/components/types";

export function challengeTypeToCategory(type: ChallengeItem["type"]): Exclude<ChallengeCategory, "TODOS"> {
  if (type === "DAILY") return "DIARIOS";
  if (type === "GUIDED" || type === "HARD_DECISION") return "GUIADOS";
  if (type === "COMPLETE_CARD") return "QUE_FALTA";
  if (type === "ERROR_DETECTION") return "DETECCION_ERRORES";
  return "INTERPRETACION_LIBRE";
}

export function challengeTypeToLabel(type: ChallengeItem["type"]): string {
  if (type === "DAILY") return "DIARIO";
  if (type === "GUIDED") return "GUIADO";
  if (type === "COMPLETE_CARD") return "¿QUÉ FALTA?";
  if (type === "ERROR_DETECTION") return "DETECCIÓN DE ERRORES";
  if (type === "VEIL_READING") return "INTERPRETACIÓN LIBRE";
  return "DECISIÓN CRÍTICA";
}

export function challengeTypeToTone(type: ChallengeItem["type"]): ChallengeItem["typeTone"] {
  if (type === "DAILY") return "violet";
  if (type === "GUIDED" || type === "HARD_DECISION") return "green";
  if (type === "COMPLETE_CARD") return "blue";
  if (type === "ERROR_DETECTION") return "red";
  return "gold";
}

export function challengeTypeToIcon(type: ChallengeItem["type"]): string {
  if (type === "DAILY") return "☀";
  if (type === "GUIDED") return "👁";
  if (type === "COMPLETE_CARD") return "🂠";
  if (type === "ERROR_DETECTION") return "✕";
  if (type === "VEIL_READING") return "✨";
  return "⚖";
}

export function toChallengeItem(detail: ChallengeDetail): ChallengeItem {
  return {
    id: detail.id,
    type: detail.type,
    typeLabel: challengeTypeToLabel(detail.type),
    typeTone: challengeTypeToTone(detail.type),
    category: challengeTypeToCategory(detail.type),
    icon: challengeTypeToIcon(detail.type),
    name: detail.title,
    description: detail.description,
    difficulty: detail.difficulty as ChallengeItem["difficulty"],
    xpReward: detail.baseXp,
  };
}

export function cardIdToImage(cardId: string): string {
  const clean = cardId.replace(/^major-/, "");
  const map: Record<string, string> = {
    "00": "/tarot/the_fool.jpg",
    "01": "/tarot/the_magician.jpg",
    "02": "/tarot/the_high_priestess.jpg",
    "03": "/tarot/the_empress.jpg",
    "04": "/tarot/the_emperor.jpg",
    "05": "/tarot/the_hierophant.jpg",
    "06": "/tarot/the_lovers.jpg",
    "07": "/tarot/the_chariot.jpg",
    "08": "/tarot/strength.jpg",
    "09": "/tarot/the_hermit.jpg",
    "10": "/tarot/wheel_of_fortune.jpg",
    "11": "/tarot/justice.jpg",
    "12": "/tarot/the_hanged_man.jpg",
    "13": "/tarot/death.jpg",
    "14": "/tarot/temperance.jpg",
    "15": "/tarot/the_devil.jpg",
    "16": "/tarot/the_tower.jpg",
    "17": "/tarot/the_star.jpg",
    "18": "/tarot/the_moon.jpg",
    "19": "/tarot/the_sun.jpg",
    "20": "/tarot/judgement.jpg",
    "21": "/tarot/the_world.jpg",
  };
  return map[clean] ?? "/tarot/the_fool.jpg";
}

export function cardIdToLabel(cardId: string): string {
  const map: Record<string, string> = {
    "major-00": "El Loco",
    "major-01": "El Mago",
    "major-02": "La Sacerdotisa",
    "major-03": "La Emperatriz",
    "major-04": "El Emperador",
    "major-05": "El Hierofante",
    "major-06": "Los Enamorados",
    "major-07": "El Carro",
    "major-08": "La Fuerza",
    "major-09": "El Ermitaño",
    "major-10": "Rueda de la Fortuna",
    "major-11": "La Justicia",
    "major-12": "El Colgado",
    "major-13": "La Muerte",
    "major-14": "La Templanza",
    "major-15": "El Diablo",
    "major-16": "La Torre",
    "major-17": "La Estrella",
    "major-18": "La Luna",
    "major-19": "El Sol",
    "major-20": "El Juicio",
    "major-21": "El Mundo",
  };
  return map[cardId] ?? cardId;
}
