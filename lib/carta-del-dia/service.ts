import { prisma } from "@/lib/prisma";
import { tarotCards } from "@/src/data/tarotCards";
import { getDailyCardMessage } from "./messages";
import { CardOrientation } from "@/src/generated/prisma/client";

export function getLimaDateString(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

export async function getOrGenerateDailyCard(userId: string) {
  const fechaLocal = getLimaDateString();
  
  let carta = await prisma.cartaDelDia.findUnique({
    where: {
      userId_fechaLocal: {
        userId,
        fechaLocal,
      },
    },
  });

  if (carta) {
    return carta;
  }

  // Generate a new one
  const previousDraws = await prisma.cartaDelDia.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { cardId: true, orientation: true, fechaLocal: true },
  });

  const last78Ids = new Set(previousDraws.slice(0, 78).map(d => d.cardId));
  let availableCards = tarotCards.filter(c => !last78Ids.has(c.id));

  // If pool empty, try to at least exclude the last 30 days
  if (availableCards.length === 0) {
    const last30Ids = new Set(previousDraws.slice(0, 30).map(d => d.cardId));
    availableCards = tarotCards.filter(c => !last30Ids.has(c.id));
    if (availableCards.length === 0) {
      availableCards = tarotCards;
    }
  }

  const selectedCard = availableCards[Math.floor(Math.random() * availableCards.length)];
  
  // Prioritize opposite orientation if drawn before
  const pastDrawsOfCard = previousDraws.filter(d => d.cardId === selectedCard.id);
  let orientation = Math.random() > 0.5 ? CardOrientation.UPRIGHT : CardOrientation.REVERSED;
  if (pastDrawsOfCard.length > 0) {
    const lastDraw = pastDrawsOfCard[0];
    orientation = lastDraw.orientation === CardOrientation.UPRIGHT ? CardOrientation.REVERSED : CardOrientation.UPRIGHT;
  }

  const { mensajeDia, preguntaReflexion } = getDailyCardMessage(selectedCard.id, orientation);

  carta = await prisma.cartaDelDia.create({
    data: {
      userId,
      fechaLocal,
      cardId: selectedCard.id,
      orientation,
      mensajeDia,
      preguntaReflexion,
    },
  });

  return carta;
}
