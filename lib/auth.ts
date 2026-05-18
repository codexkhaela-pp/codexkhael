export const AUTH_COOKIE_NAME = "codexkhael_session";

export type AppSession = {
  userId: string;
  email: string;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function createSessionCookieValue(session: AppSession): string {
  const params = new URLSearchParams();
  params.set("u", session.userId);
  params.set("e", normalizeEmail(session.email));
  return params.toString();
}

export function parseSessionCookieValue(cookieValue: string | undefined): AppSession | null {
  if (!cookieValue) {
    return null;
  }

  const params = new URLSearchParams(cookieValue);
  const userId = params.get("u")?.trim() ?? "";
  const email = normalizeEmail(params.get("e") ?? "");

  if (!UUID_REGEX.test(userId) || !email.includes("@")) {
    return null;
  }

  return { userId, email };
}

export function isSessionAuthenticated(cookieValue: string | undefined): boolean {
  return parseSessionCookieValue(cookieValue) !== null;
}
