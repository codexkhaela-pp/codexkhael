import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  getAuthPassword,
  getAuthUser,
  getSessionToken,
} from "@/lib/auth";

type LoginBody = {
  username?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as LoginBody;
  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";

  if (username !== getAuthUser() || password !== getAuthPassword()) {
    return NextResponse.json(
      { error: "Usuario o contraseña inválidos." },
      { status: 401 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, getSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}

