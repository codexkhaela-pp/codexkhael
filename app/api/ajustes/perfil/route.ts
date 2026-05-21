import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { displayName } = body;

    if (!displayName || typeof displayName !== "string" || displayName.trim() === "") {
      return NextResponse.json({ error: "El nombre es requerido y debe ser válido" }, { status: 400 });
    }

    const updatedName = displayName.trim();

    // Actualizamos tanto en el perfil (displayName) como en el usuario (name)
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { name: updatedName },
      }),
      prisma.userProfile.upsert({
        where: { userId: user.id },
        update: { displayName: updatedName },
        create: {
          userId: user.id,
          displayName: updatedName,
        },
      }),
    ]);

    return NextResponse.json({ success: true, displayName: updatedName });
  } catch (error) {
    console.error("Error actualizando perfil:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
