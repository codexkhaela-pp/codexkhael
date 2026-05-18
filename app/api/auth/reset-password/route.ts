import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/token-utils";
import { logAccess } from "@/lib/access-log";

export const runtime = "nodejs";

type ResetBody = {
  token?: string;
  password?: string;
};

export async function POST(request: Request) {
  let body: ResetBody;
  try {
    body = (await request.json()) as ResetBody;
  } catch {
    return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
  }

  const plainToken = (body.token ?? "").trim();
  const newPassword = body.password ?? "";

  if (!plainToken) {
    return NextResponse.json({ error: "Token de recuperación requerido." }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres." }, { status: 400 });
  }

  const tokenHash = hashToken(plainToken);

  const resetRecord = await prisma.passwordResetToken.findFirst({
    where: { tokenHash },
    include: { user: { select: { id: true, email: true, status: true } } },
  });

  if (!resetRecord) {
    return NextResponse.json({ error: "Token inválido o expirado." }, { status: 400 });
  }

  if (resetRecord.used) {
    return NextResponse.json({ error: "Este enlace ya fue utilizado." }, { status: 400 });
  }

  if (resetRecord.expiresAt < new Date()) {
    return NextResponse.json({ error: "Este enlace ha expirado. Solicita uno nuevo." }, { status: 400 });
  }

  if (resetRecord.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Usuario no activo." }, { status: 400 });
  }

  // Update password + invalidate all sessions + mark token as used
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: {
        passwordHash: newPassword, // Still plain-text MVP — pending bcrypt migration
        sessionToken: null, // Invalidate all active sessions
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { used: true },
    }),
  ]);

  const userAgent = request.headers.get("user-agent") ?? null;
  await logAccess({
    userId: resetRecord.userId,
    email: resetRecord.user.email,
    action: "password_reset",
    userAgent,
  });

  return NextResponse.json({ ok: true, message: "Contraseña actualizada correctamente." });
}
