export const AUTH_COOKIE_NAME = "codexkhael_session";

export type AppSession = {
  sessionId?: string;
  userId: string;
  email: string;
  sessionToken: string;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function createSessionCookieValue(session: AppSession): string {
  const params = new URLSearchParams();
  if (session.sessionId) {
    params.set("s", session.sessionId);
  }
  params.set("u", session.userId);
  params.set("e", normalizeEmail(session.email));
  params.set("t", session.sessionToken);
  return params.toString();
}

export function parseSessionCookieValue(cookieValue: string | undefined): AppSession | null {
  if (!cookieValue) {
    return null;
  }

  const params = new URLSearchParams(cookieValue);
  const sessionId = params.get("s")?.trim() ?? "";
  const userId = params.get("u")?.trim() ?? "";
  const email = normalizeEmail(params.get("e") ?? "");
  const sessionToken = params.get("t")?.trim() ?? "";

  if (
    (sessionId && !UUID_REGEX.test(sessionId)) ||
    !UUID_REGEX.test(userId) ||
    !email.includes("@") ||
    !sessionToken
  ) {
    return null;
  }

  return { sessionId: sessionId || undefined, userId, email, sessionToken };
}

export function isSessionAuthenticated(cookieValue: string | undefined): boolean {
  return parseSessionCookieValue(cookieValue) !== null;
}
