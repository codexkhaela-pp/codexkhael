import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { cartaId } = body;

    if (!cartaId) {
      return NextResponse.json({ error: "Falta cartaId" }, { status: 400 });
    }

    const carta = await prisma.cartaDelDia.findUnique({
      where: { id: cartaId },
    });

    if (!carta || carta.userId !== user.id) {
      return NextResponse.json({ error: "Carta no encontrada o no pertenece al usuario" }, { status: 404 });
    }

    const updated = await prisma.cartaDelDia.update({
      where: { id: cartaId },
      data: { isRevealed: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al revelar carta:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
