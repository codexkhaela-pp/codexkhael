import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || typeof currentPassword !== "string" || currentPassword.trim() === "") {
      return NextResponse.json({ error: "La contraseña actual es requerida" }, { status: 400 });
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length < 6) {
      return NextResponse.json({ error: "La nueva contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    // Buscamos el usuario real en la BD para obtener su contraseña actual
    const user = await prisma.user.findUnique({
      where: { id: userSession.id },
      select: { passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Nota: Como MVP, la contraseña está en texto plano, pero aquí verificamos como si fuera hash.
    // En el futuro, si se usa bcrypt, se reemplazaría por bcrypt.compare(currentPassword, user.passwordHash)
    if (user.passwordHash !== currentPassword) {
      return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 400 });
    }

    // Actualizamos con la nueva contraseña (texto plano por MVP)
    // En el futuro: await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: userSession.id },
      data: { 
        passwordHash: newPassword,
        requiresPasswordChange: false
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error actualizando contraseña:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
