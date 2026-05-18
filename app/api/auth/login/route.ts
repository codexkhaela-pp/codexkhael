import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, createSessionCookieValue } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, createSessionCookieValue({ userId: user.id, email: user.email }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
}
