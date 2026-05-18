import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { AUTH_COOKIE_NAME, createSessionCookieValue } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAccess } from "@/lib/access-log";

export const runtime = "nodejs";

type LoginBody = {
  username?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as LoginBody;
  const username = body.username?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!username || !password) {
    return NextResponse.json({ error: "Usuario o contraseña inválidos." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: username },
    select: { id: true, email: true, passwordHash: true, status: true },
  });

  if (!user || user.status !== "ACTIVE" || !user.passwordHash || user.passwordHash !== password) {
    return NextResponse.json({ error: "Usuario o contraseña inválidos." }, { status: 401 });
  }

  const sessionToken = randomUUID();

  // Save new sessionToken in DB — invalidates any previous session
  await prisma.user.update({
    where: { id: user.id },
    data: { sessionToken },
  });

  const userAgent = request.headers.get("user-agent") ?? null;
  await logAccess({ userId: user.id, email: user.email, action: "login", userAgent });

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, createSessionCookieValue({ userId: user.id, email: user.email, sessionToken }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
}
