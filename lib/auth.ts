export const AUTH_COOKIE_NAME = "codexkhael_session";

const DEFAULT_AUTH_USER = "admin";
const DEFAULT_AUTH_PASSWORD = "cambia-esta-clave";
const DEFAULT_SESSION_TOKEN =
  "codexkhael_dev_session_token_change_this_in_env_local";

export function getAuthUser(): string {
  return process.env.TEMP_AUTH_USER ?? DEFAULT_AUTH_USER;
}

export function getAuthPassword(): string {
  return process.env.TEMP_AUTH_PASSWORD ?? DEFAULT_AUTH_PASSWORD;
}

export function getSessionToken(): string {
  return process.env.TEMP_AUTH_SESSION_TOKEN ?? DEFAULT_SESSION_TOKEN;
}

export function isSessionAuthenticated(cookieValue: string | undefined): boolean {
  if (!cookieValue) {
    return false;
  }
  return cookieValue === getSessionToken();
}

