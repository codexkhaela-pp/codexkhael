import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateResetToken } from "@/lib/token-utils";
import { sendEmail } from "@/lib/mailer";

export const runtime = "nodejs";

const TOKEN_EXPIRY_MINUTES = 30;

type ForgotBody = {
  email?: string;
};

export async function POST(request: Request) {
  let body: ForgotBody;
  try {
    body = (await request.json()) as ForgotBody;
  } catch {
    return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();

  if (!email.includes("@")) {
    return NextResponse.json({ error: "Correo inválido." }, { status: 400 });
  }

  // Always return success to avoid user enumeration
  const genericResponse = NextResponse.json({
    ok: true,
    message: "Si el correo existe, recibirás instrucciones para restablecer tu contraseña.",
  });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, status: true },
  });

  if (!user || user.status !== "ACTIVE") {
    return genericResponse;
  }

  const { plainToken, tokenHash } = generateResetToken();

  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const resetUrl = `${getBaseUrl(request)}/reset-password?token=${plainToken}`;
  
  // Enviar correo real
  await sendEmail({
    to: user.email,
    subject: "Restablece tu contraseña - Mis Lecturas | Khael Tarotista",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #c9a66b; text-align: center;">Recuperación de Contraseña</h2>
        <p>Hola,</p>
        <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>Mis Lecturas</strong> de Khael Tarotista.</p>
        <p>Si no fuiste tú, puedes ignorar este correo de forma segura. El enlace caducará en 30 minutos.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #c9a66b; color: #09090f; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Restablecer mi contraseña</a>
        </div>
        <p style="font-size: 0.9em; color: #666;">O copia y pega este enlace en tu navegador:<br><a href="${resetUrl}">${resetUrl}</a></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 0.8em; color: #999; text-align: center;">Khael Tarotista &copy; ${new Date().getFullYear()}</p>
      </div>
    `
  });

  return genericResponse;
}

function getBaseUrl(request: Request): string {
  const host = request.headers.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}
