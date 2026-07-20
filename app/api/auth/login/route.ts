import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { AUTH_COOKIE_NAME, createSessionCookieValue } from "@/lib/auth";
import {
  createAuthSession,
  getRequestIpAddress,
  revokeActiveUserSessions,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth-session-store";
import { logAccess } from "@/lib/access-log";
import { prisma } from "@/lib/prisma";
import { isPrismaConnectionError } from "@/lib/prisma-errors";

export const runtime = "nodejs";

type LoginBody = {
  username?: string;
  password?: string;
};

function logAuthEvent(stage: string, details: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production" && process.env.AUTH_DEBUG !== "1") {
    return;
  }

  console.info(`[auth/login] ${stage}`, details);
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Método no permitido. Usa POST para iniciar sesión." },
    { status: 405 },
  );
}

export async function POST(request: Request) {
  let createdSession: { id: string; userId: string; sessionToken: string } | null = null;

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
      select: { id: true, email: true, passwordHash: true, status: true, roles: true },
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

    if (userFound && !isActive && hasPasswordHash && passwordValid) {
      return NextResponse.json(
        { error: "Tu cuenta está creada, pero sigue pendiente de activación." },
        { status: 403 },
      );
    }

    if (!userFound || !isActive || !hasPasswordHash || !passwordValid || !user) {
      return NextResponse.json({ error: "Usuario o contraseña inválidos." }, { status: 401 });
    }

    const sessionToken = randomUUID();
    const userAgent = request.headers.get("user-agent") ?? null;
    const ipAddress = getRequestIpAddress(request);
    const now = new Date();

    createdSession = await prisma.$transaction(async (tx) => {
      await revokeActiveUserSessions(tx, user.id, now);

      const session = await createAuthSession(tx, {
        userId: user.id,
        sessionToken,
        userAgent,
        ipAddress,
        now,
      });

      return {
        id: session.id,
        userId: session.userId,
        sessionToken: session.sessionToken,
      };
    });

    logAuthEvent("session_created", {
      sessionId: createdSession.id,
      userId: createdSession.userId,
    });

    await logAccess({ userId: user.id, email: user.email, action: "login", userAgent });

    const response = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, roles: user.roles } });
    response.cookies.set(
      AUTH_COOKIE_NAME,
      createSessionCookieValue({
        sessionId: createdSession.id,
        userId: user.id,
        email: user.email,
        sessionToken: createdSession.sessionToken,
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: SESSION_MAX_AGE_SECONDS,
      },
    );

    return response;
  } catch (error) {
    if (createdSession) {
      try {
        await prisma.authSession.updateMany({
          where: {
            id: createdSession.id,
            userId: createdSession.userId,
            sessionToken: createdSession.sessionToken,
            revokedAt: null,
          },
          data: {
            revokedAt: new Date(),
          },
        });
      } catch (rollbackError) {
        logAuthEvent("session_rollback_failed", {
          sessionId: createdSession.id,
          message: rollbackError instanceof Error ? rollbackError.message : "unknown_error",
        });
      }
    }

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
