import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, parseSessionCookieValue } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAccess } from "@/lib/access-log";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = parseSessionCookieValue(raw);

  if (session) {
    // Only clear sessionToken in DB if it still matches this session's token.
    // If another login already replaced it, don't touch the DB — just clear the cookie.
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { sessionToken: true },
    });

    if (user && user.sessionToken === session.sessionToken) {
      await prisma.user.update({
        where: { id: session.userId },
        data: { sessionToken: null },
      });
    }

    const userAgent = request.headers.get("user-agent") ?? null;
    await logAccess({ userId: session.userId, email: session.email, action: "logout", userAgent });
  }

  cookieStore.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  cookieStore.delete(AUTH_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
