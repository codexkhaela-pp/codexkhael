import type { ChallengeCategory, ChallengeItem, ChallengeDetail } from "@/app/desafios/components/types";
import { tarotCards } from "@/src/data/tarotCards";

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
    description: detail.type === "DAILY"
      ? "Analiza la combinación de cartas y elige la interpretación correcta."
      : detail.description,
    difficulty: detail.difficulty as ChallengeItem["difficulty"],
    xpReward: detail.baseXp,
  };
}

function findTarotCard(cardId: string) {
  if (!cardId) return undefined;
  const idClean = cardId.toLowerCase().trim().replace(/[-_\s]/g, "");
  return tarotCards.find((c) => {
    const cId = c.id.toLowerCase().replace(/[-_\s]/g, "");
    const cNameEs = c.nameEs.toLowerCase().replace(/[-_\s]/g, "");
    const cNameEn = c.nameEn.toLowerCase().replace(/[-_\s]/g, "");
    const cSlug = c.slug.toLowerCase().replace(/[-_\s]/g, "");
    return cId === idClean || cNameEs === idClean || cNameEn === idClean || cSlug === idClean;
  });
}

export function cardIdToImage(cardId: string): string {
  const found = findTarotCard(cardId);
  if (found) {
    return found.image;
  }
  console.error("Card image not found for key:", cardId);
  return "/tarot/placeholder.jpg";
}

export function cardIdToLabel(cardId: string): string {
  const found = findTarotCard(cardId);
  if (found) {
    return found.nameEs;
  }
  console.error("Card label not found for key:", cardId);
  return cardId;
}

export function cleanQuestionText(text: string, isDaily?: boolean): string {
  if (isDaily || text.startsWith("Dada la tirada:") || text.includes("¿cuál es la interpretación más adecuada?")) {
    return "¿Cuál es la interpretación más adecuada?";
  }
  return text;
}

export function cleanDescription(description: string, isDaily?: boolean): string {
  if (isDaily || description.startsWith("Un desafío de interpretación intuitiva") || description.includes("tirada del día")) {
    return "Analiza la combinación de cartas y elige la interpretación correcta.";
  }
  return description;
}
