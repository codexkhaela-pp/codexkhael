import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { getOrGenerateDailyCard } from "@/lib/carta-del-dia/service";
import { tarotCards } from "@/src/data/tarotCards";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const carta = await getOrGenerateDailyCard(user.id);
    const tarotData = tarotCards.find((c) => c.id === carta.cardId);

    if (!tarotData) {
      return NextResponse.json({ error: "Carta base no encontrada" }, { status: 500 });
    }

    const hasReflection = await prisma.reflexionCartaDia.count({
      where: { cartaDelDiaId: carta.id },
    }) > 0;

    return NextResponse.json({
      id: carta.id,
      cardId: carta.cardId,
      orientation: carta.orientation,
      isRevealed: carta.isRevealed,
      mensajeDia: carta.mensajeDia,
      preguntaReflexion: carta.preguntaReflexion,
      cardImage: tarotData.image,
      cardName: tarotData.nameEs,
      hasReflection,
    });
  } catch (error) {
    console.error("Error al obtener carta del día:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
