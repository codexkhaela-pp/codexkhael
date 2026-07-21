import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { ClientReadingViewer } from "./client-reading-viewer";
import { tarotCards } from "@/src/data/tarotCards";

export default async function MisLecturasDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/mis-lecturas/login");
  }

  const { id } = await params;
  const reading = await prisma.clientReading.findUnique({
    where: { id },
    include: {
      cards: {
        orderBy: { positionIndex: "asc" },
      }
    },
  });

  if (!reading) {
    notFound();
  }

  // Verificar que la lectura pertenece al cliente autenticado
  if (reading.clientId !== user.id && !user.roles.includes("ADMIN") && !user.roles.includes("TAROTIST")) {
    // Si no es el dueño ni un admin/tarotista, redirigir
    redirect("/mis-lecturas");
  }

  // Filtrar notas privadas y devolver solo datos públicos para el visor
  const publicCards = reading.cards.map(card => ({
    id: card.id,
    visualCardId: card.visualCardId,
    cardName: card.cardName,
    positionName: card.positionName,
    interpretation: card.interpretation,
    x: card.x,
    y: card.y,
    rotation: card.rotation,
    relativeScale: card.relativeScale,
    zIndex: card.zIndex,
  }));

  return <ClientReadingViewer reading={reading} cards={publicCards} availableCards={tarotCards} user={user} />;
}
