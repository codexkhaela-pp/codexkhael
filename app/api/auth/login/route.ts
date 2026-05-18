import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { AUTH_COOKIE_NAME, createSessionCookieValue } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAccess } from "@/lib/access-log";
import { isPrismaConnectionError, isPrismaMissingColumnError } from "@/lib/prisma-errors";

export const runtime = "nodejs";

type LoginBody = {
  username?: string;
  password?: string;
};

function logAuthEvent(stage: string, details: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production" && process.env.AUTH_DEBUG !== "1") {
    return;
  }

  // Controlled temporary logs for production debugging (no password/hash output).
  console.info(`[auth/login] ${stage}`, details);
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Método no permitido. Usa POST para iniciar sesión." },
    { status: 405 },
  );
}

export async function POST(request: Request) {
  try {
    let body: LoginBody;
    try {
      body = (await request.json()) as LoginBody;
    } catch {
      logAuthEvent("validation_failed", { reason: "invalid_json_body" });
      return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
    }

    const username = body.username?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    logAuthEvent("request_received", {
      hasUsername: Boolean(username),
      passwordLength: password.length,
      hasAtSymbol: username.includes("@"),
    });

    if (!username || !password) {
      logAuthEvent("validation_failed", { reason: "missing_credentials" });
      return NextResponse.json({ error: "Usuario o contraseña inválidos." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: username },
      select: { id: true, email: true, passwordHash: true, status: true },
    });

    const userFound = Boolean(user);
    const isActive = user?.status === "ACTIVE";
    const hasPasswordHash = Boolean(user?.passwordHash);
    const passwordValid = Boolean(user && user.passwordHash && user.passwordHash === password);

    logAuthEvent("user_lookup", {
      userFound,
      isActive,
      hasPasswordHash,
      passwordValid,
    });

    if (!userFound || !isActive || !hasPasswordHash || !passwordValid || !user) {
      return NextResponse.json({ error: "Usuario o contraseña inválidos." }, { status: 401 });
    }

    const sessionToken = randomUUID();
    logAuthEvent("session_token_generated", { generated: Boolean(sessionToken) });

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { sessionToken },
      });
      logAuthEvent("session_token_persisted", { persisted: true, userId: user.id });
    } catch (error) {
      if (isPrismaMissingColumnError(error, "sessionToken")) {
        logAuthEvent("session_token_persist_skipped", {
          reason: "missing_sessiontoken_column",
          userId: user.id,
        });
      } else {
        throw error;
      }
    }

    const userAgent = request.headers.get("user-agent") ?? null;
    await logAccess({ userId: user.id, email: user.email, action: "login", userAgent });

    const cookieStore = await cookies();
    cookieStore.set(
      AUTH_COOKIE_NAME,
      createSessionCookieValue({ userId: user.id, email: user.email, sessionToken }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      },
    );

    logAuthEvent("cookie_set", {
      cookieName: AUTH_COOKIE_NAME,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAgeSeconds: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      logAuthEvent("database_unreachable", {
        message: error instanceof Error ? error.message : "database_connection_error",
      });
      return NextResponse.json(
        { error: "No se pudo conectar con la base de datos. Intenta nuevamente en unos minutos." },
        { status: 503 },
      );
    }

    logAuthEvent("unexpected_error", {
      message: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json({ error: "No se pudo iniciar sesión." }, { status: 500 });
  }
}
