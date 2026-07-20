import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, parseSessionCookieValue, type AppSession } from "@/lib/auth";
import { findActiveAuthSession } from "@/lib/auth-session-store";

export type AuthenticatedUser = {
  id: string;
  email: string;
  roles: string[];
};

function logSessionEvent(stage: string, details: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production" && process.env.AUTH_DEBUG !== "1") {
    return;
  }

  console.info(`[auth/session] ${stage}`, details);
}

export async function getCurrentSession(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = parseSessionCookieValue(raw);

  if (!session) {
    logSessionEvent("cookie_missing_or_invalid", { hasCookie: Boolean(raw) });
  }

  return session;
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await getCurrentSession();
  if (!session) {
    return null;
  }

  const authSession = await findActiveAuthSession(session);

  if (!authSession) {
    logSessionEvent("session_not_found_or_revoked", {
      userId: session.userId,
      hasSessionId: Boolean(session.sessionId),
    });
    return null;
  }

  if (authSession.user.email.toLowerCase() !== session.email.toLowerCase()) {
    logSessionEvent("email_mismatch", {
      userId: session.userId,
      cookieEmail: session.email,
      databaseEmail: authSession.user.email,
    });
    return null;
  }

  if (authSession.user.status !== "ACTIVE") {
    logSessionEvent("user_inactive", { userId: session.userId, status: authSession.user.status });
    return null;
  }

  return {
    id: authSession.user.id,
    email: authSession.user.email,
    roles: authSession.user.roles.map((r) => r.role.name),
  };
}
