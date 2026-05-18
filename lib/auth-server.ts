import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, parseSessionCookieValue, type AppSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AuthenticatedUser = {
  id: string;
  email: string;
};

export async function getCurrentSession(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return parseSessionCookieValue(raw);
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await getCurrentSession();
  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, status: true, sessionToken: true },
  });

  if (
    !user ||
    user.email.toLowerCase() !== session.email.toLowerCase() ||
    user.status !== "ACTIVE" ||
    user.sessionToken !== session.sessionToken
  ) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
  };
}
