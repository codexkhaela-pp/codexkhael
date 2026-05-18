import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateResetToken } from "@/lib/token-utils";

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

  // DEV MODE: log the reset link to console since no email service is configured yet.
  const resetUrl = `${getBaseUrl(request)}/reset-password?token=${plainToken}`;
  console.log("─────────────────────────────────────────");
  console.log("🔑 PASSWORD RESET LINK (dev mode):");
  console.log(`   Email: ${user.email}`);
  console.log(`   URL:   ${resetUrl}`);
  console.log(`   Expira: ${expiresAt.toISOString()}`);
  console.log("─────────────────────────────────────────");

  return genericResponse;
}

function getBaseUrl(request: Request): string {
  const host = request.headers.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}
