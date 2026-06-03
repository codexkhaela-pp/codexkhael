import { tarotCards } from "@/src/data/tarotCards";

export function getDailyCardMessage(
  cardId: string,
  orientation: "UPRIGHT" | "REVERSED"
): { mensajeDia: string; preguntaReflexion: string } {
  const card = tarotCards.find((c) => c.id === cardId);
  if (!card) {
    return {
      mensajeDia: "La energía de hoy es un misterio por descubrir.",
      preguntaReflexion: "¿Qué te sorprendió en el día de hoy?",
    };
  }

  const isUpright = orientation === "UPRIGHT";
  const keywords = isUpright ? card.keywordsUpright : card.keywordsReversed;

  const mensajeDia = isUpright
    ? `Hoy, la energía de ${card.nameEs} se manifiesta en su luz. Sus cualidades (${keywords}) te acompañan para afrontar tu jornada con claridad.`
    : `Hoy, ${card.nameEs} aparece de forma invertida, invitándote a la reflexión interna o pidiéndote cautela frente a ciertas energías (${keywords}).`;

  const preguntaReflexion = isUpright
    ? `¿Cómo lograste integrar la energía luminosa de ${card.nameEs} durante tus actividades o decisiones de hoy?`
    : `¿En qué momento del día sentiste el bloqueo, la resistencia o la necesidad de introspección que sugería ${card.nameEs}?`;

  return {
    mensajeDia,
    preguntaReflexion,
  };
}
