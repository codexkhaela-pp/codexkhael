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
    const { cartaId, sintioEnergia, textoReflexion, aprendizaje, moodLevel } = body;

    if (!cartaId || !sintioEnergia || !textoReflexion || !aprendizaje) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const carta = await prisma.cartaDelDia.findUnique({
      where: { id: cartaId },
    });

    if (!carta || carta.userId !== user.id) {
      return NextResponse.json({ error: "Carta no encontrada o no pertenece al usuario" }, { status: 404 });
    }

    // Comprobar si ya tiene reflexión
    const existingReflection = await prisma.reflexionCartaDia.findUnique({
      where: { cartaDelDiaId: cartaId },
    });

    if (existingReflection) {
      return NextResponse.json({ error: "La reflexión ya fue registrada para esta carta" }, { status: 400 });
    }

    // Guardar la reflexión base
    const reflection = await prisma.reflexionCartaDia.create({
      data: {
        cartaDelDiaId: cartaId,
        userId: user.id,
        sintioEnergia,
        textoReflexion,
        aprendizaje,
        moodLevel: moodLevel || null,
        porcentajeCoincidencia: null, // Default
        analisisCoincidencia: null, // Default
      },
    });

    // TODO: AI Energetic Match para PRO
    // Para no bloquear, se puede disparar asincronamente o dejar pendiente
    // if (userProfile.userPlan === "PRO") {
    //   generateEnergeticMatchAsync(reflection.id, carta.cardId, carta.orientation, textoReflexion);
    // }

    return NextResponse.json(reflection);
  } catch (error) {
    console.error("Error al guardar reflexión:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
