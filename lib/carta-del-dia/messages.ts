import { tarotCards } from "@/src/data/tarotCards";
import { buildEditorialDailyContent } from "@/lib/carta-del-dia/editorial";

export function getDailyCardMessage(
  cardId: string,
  orientation: "UPRIGHT" | "REVERSED",
): { mensajeDia: string; preguntaReflexion: string } {
  const card = tarotCards.find((candidate) => candidate.id === cardId);
  if (!card) {
    return {
      mensajeDia: "La energía de hoy todavía no se deja nombrar con claridad.",
      preguntaReflexion: "¿Qué te sorprendió de tu día y qué quiso mostrarte?",
    };
  }

  const editorial = buildEditorialDailyContent(card.nameEs, orientation);
  if (editorial?.mainMessage && editorial.reflectionQuestion) {
    return {
      mensajeDia: editorial.mainMessage,
      preguntaReflexion: editorial.reflectionQuestion,
    };
  }

  const isUpright = orientation === "UPRIGHT";
  const keywords = (isUpright ? card.keywordsUpright : card.keywordsReversed)
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  const keywordList = new Intl.ListFormat("es", {
    style: "long",
    type: "conjunction",
  }).format(keywords.slice(0, 3));

  const structuredMeaning = card.structuredMeaning
    ? isUpright
      ? card.structuredMeaning.upright
      : card.structuredMeaning.reversed
    : null;

  const fallbackLens =
    card.arcana === "major"
      ? "Esta carta habla de un aprendizaje de fondo y de una etapa que merece plena conciencia."
      : card.rank
        ? "Su figura muestra una actitud que hoy conviene encarnar o revisar con honestidad."
        : "Su número y su palo señalan una experiencia concreta que se manifiesta en lo cotidiano.";

  const mensajeDia = isUpright
    ? `${card.nameEs} se presenta para favorecer ${keywordList || "claridad y presencia"}. ${structuredMeaning || fallbackLens}`.trim()
    : `${card.nameEs} aparece invertida para pedir revisión en torno a ${keywordList || "lo que hoy permanece bloqueado"}. ${structuredMeaning || fallbackLens}`.trim();

  const preguntaReflexion =
    card.suit === "cups"
      ? "¿Qué emoción de hoy merecía ser escuchada con más honestidad?"
      : card.suit === "swords"
        ? "¿Qué verdad mental, conversación o decisión no conviene seguir postergando?"
        : card.suit === "wands"
          ? "¿Dónde se encendió tu impulso y qué te pide hacer de forma concreta?"
          : card.suit === "pentacles"
            ? "¿Qué hecho práctico te mostró hoy cómo estás cuidando tus recursos y tu energía?"
            : `¿Qué situación te mostró con más fuerza la enseñanza de ${card.nameEs}?`;

  return {
    mensajeDia,
    preguntaReflexion,
  };
}
