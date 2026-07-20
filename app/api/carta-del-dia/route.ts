import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import {
  formatDateKeyForDisplay,
  getOrGenerateDailyCard,
  getPublicDailyCard,
  normalizeTimezone,
} from "@/lib/carta-del-dia/service";
import { tarotCards } from "@/src/data/tarotCards";
import { CardOrientation } from "@/src/generated/prisma/client";
import { buildEditorialDailyContent } from "@/lib/carta-del-dia/editorial";

export const runtime = "nodejs";

type HistoryItem = {
  cardId: string;
  fechaLocal: string;
  orientation: CardOrientation;
};

function buildHistoryLabel(index: number): string {
  if (index === 0) return "Hoy";
  if (index === 1) return "Ayer";
  return `Hace ${index} días`;
}

function buildHistoryResponse(items: HistoryItem[]) {
  return items.map((item, index) => {
    const itemData = tarotCards.find((card) => card.id === item.cardId);
    return {
      label: buildHistoryLabel(index),
      fecha: formatDateKeyForDisplay(item.fechaLocal),
      cardName: itemData?.nameEs ?? item.cardId,
      orientation: item.orientation,
    };
  });
}

function buildFallbackDailyExperience(args: {
  cardName: string;
  orientation: CardOrientation;
  mensajeDia: string;
  preguntaReflexion: string;
}) {
  const isReversed = args.orientation === CardOrientation.REVERSED;

  return {
    HeroMensaje: args.mensajeDia,
    NombreCarta: args.cardName,
    MensajePrincipal: args.mensajeDia,
    Amor: isReversed
      ? "Hoy conviene detener una conversación que solo está repitiendo defensa y confusión. Antes de responder, escucha qué verdad emocional estás evitando."
      : "La energía del día favorece vínculos más honestos, pausados y presentes. Lo importante no es hablar más, sino decir lo verdadero con cuidado.",
    Dinero: isReversed
      ? "No tomes decisiones económicas para salir rápido de la incomodidad. Primero ordena los datos, después decide."
      : "Avanza solo con aquello que puedas sostener con claridad. Hoy vale más un criterio limpio que un movimiento apresurado.",
    Trabajo: isReversed
      ? "Si algo viene tensándose, ya no conviene seguir postergándolo. Revisa el punto exacto del bloqueo y resuélvelo con precisión."
      : "El trabajo pide enfoque, orden y una decisión concreta. Evita la dispersión: una sola prioridad bien cerrada vale más que varias abiertas.",
    CrecimientoPersonal: isReversed
      ? "Tu aprendizaje aparece cuando dejas de justificar la evasión y nombras con honestidad lo que ya no puedes seguir esquivando."
      : "Tu crecimiento hoy depende menos de entenderlo todo y más de sostener una pequeña verdad sin volver a distraerte de ella.",
    AccionRecomendada: isReversed
      ? "Pon por escrito aquello que vienes evitando y decide cuál es el primer gesto concreto para dejar de aplazarlo."
      : "Haz una acción breve, visible y coherente con la enseñanza de la carta antes de que termine el día.",
    PreguntaReflexion: args.preguntaReflexion,
    Sombra: isReversed
      ? "La sombra se hace fuerte cuando confundes evitar con protegerte. A veces el alivio no llega al mirar hacia otro lado, sino al atreverte a ordenar lo que te incomoda."
      : "Toda virtud se distorsiona cuando se convierte en exceso o en refugio. Observa dónde podrías estar usando esta energía para no tocar una verdad más profunda.",
  };
}

function buildDailyExperience(args: {
  cardName: string;
  orientation: CardOrientation;
  mensajeDia: string;
  preguntaReflexion: string;
}) {
  const editorial = buildEditorialDailyContent(args.cardName, args.orientation);
  if (!editorial) {
    return buildFallbackDailyExperience(args);
  }

  return {
    HeroMensaje: editorial.heroMessage || args.mensajeDia,
    NombreCarta: args.cardName,
    MensajePrincipal: editorial.mainMessage || args.mensajeDia,
    Amor: editorial.loveMessage || buildFallbackDailyExperience(args).Amor,
    Dinero: editorial.moneyMessage || buildFallbackDailyExperience(args).Dinero,
    Trabajo: editorial.workMessage || buildFallbackDailyExperience(args).Trabajo,
    CrecimientoPersonal:
      editorial.growthMessage || buildFallbackDailyExperience(args).CrecimientoPersonal,
    AccionRecomendada: editorial.actionMessage || buildFallbackDailyExperience(args).AccionRecomendada,
    PreguntaReflexion: editorial.reflectionQuestion || args.preguntaReflexion,
    Sombra: editorial.shadowMessage || buildFallbackDailyExperience(args).Sombra,
  };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const timezone = normalizeTimezone(url.searchParams.get("timezone"));
    const user = await getCurrentUser();

    let resolvedCard: {
      id: string;
      cardId: string;
      orientation: CardOrientation;
      isRevealed: boolean;
      mensajeDia: string;
      preguntaReflexion: string;
      fechaLocal: string;
      hasReflection: boolean;
      history: HistoryItem[];
    };

    if (user) {
      const carta = await getOrGenerateDailyCard(user.id, timezone);
      const hasReflection =
        (await prisma.reflexionCartaDia.count({
          where: { cartaDelDiaId: carta.id },
        })) > 0;

      const recentCards = await prisma.cartaDelDia.findMany({
        where: { userId: user.id },
        orderBy: { fechaLocal: "desc" },
        take: 3,
        select: {
          cardId: true,
          fechaLocal: true,
          orientation: true,
        },
      });

      resolvedCard = {
        id: carta.id,
        cardId: carta.cardId,
        orientation: carta.orientation,
        isRevealed: carta.isRevealed,
        mensajeDia: carta.mensajeDia,
        preguntaReflexion: carta.preguntaReflexion,
        fechaLocal: carta.fechaLocal,
        hasReflection,
        history: recentCards,
      };
    } else {
      const carta = getPublicDailyCard(timezone);
      resolvedCard = {
        id: carta.id,
        cardId: carta.cardId,
        orientation: carta.orientation,
        isRevealed: carta.isRevealed,
        mensajeDia: carta.mensajeDia,
        preguntaReflexion: carta.preguntaReflexion,
        fechaLocal: carta.fechaLocal,
        hasReflection: false,
        history: carta.history,
      };
    }

    const tarotData = tarotCards.find((card) => card.id === resolvedCard.cardId);
    if (!tarotData) {
      return NextResponse.json({ error: "Carta base no encontrada." }, { status: 500 });
    }

    const dailyExperience = buildDailyExperience({
      cardName: tarotData.nameEs,
      orientation: resolvedCard.orientation,
      mensajeDia: resolvedCard.mensajeDia,
      preguntaReflexion: resolvedCard.preguntaReflexion,
    });

    return NextResponse.json({
      id: resolvedCard.id,
      cardId: resolvedCard.cardId,
      orientation: resolvedCard.orientation,
      isRevealed: resolvedCard.isRevealed,
      hasReflection: resolvedCard.hasReflection,
      mensajeDia: resolvedCard.mensajeDia,
      preguntaReflexion: resolvedCard.preguntaReflexion,
      cardImage: tarotData.image,
      cardName: tarotData.nameEs,
      timezone,
      Fecha: formatDateKeyForDisplay(resolvedCard.fechaLocal),
      ImagenCarta: tarotData.image,
      ...dailyExperience,
      historialEnergetico: buildHistoryResponse(resolvedCard.history),
    });
  } catch (error) {
    console.error("Error al obtener la carta del día:", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
