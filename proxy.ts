import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, isSessionAuthenticated } from "@/lib/auth";

const PUBLIC_PATHS = new Set([
  "/",
  "/lecturas",
  "/carta-del-dia",
  "/acerca-de-mi",
  "/codex-khael",
  "/suscribete",
  "/sobre-mi",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/mis-lecturas/login",
]);
const PUBLIC_PREFIXES = ["/assets/", "/tarot/"];
const AUTH_API_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/register",
  "/api/auth/subscribe",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
]);
const INTERNAL_API_PATHS = new Set(["/api/cron/keepalive"]);
const PUBLIC_API_PATHS = new Set(["/api/carta-del-dia"]);

function allowDevAiTestBypass(pathname: string): boolean {
  return (
    (pathname === "/api/ai/tarot-local" || pathname === "/api/ai/tarot-spread-local") &&
    process.env.NODE_ENV === "development" &&
    process.env.ALLOW_DEV_AI_TEST === "true"
  );
}

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) {
    return true;
  }
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const cookieValue = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const authenticated = isSessionAuthenticated(cookieValue);
  const devAiBypass = allowDevAiTestBypass(pathname);

  if (
    AUTH_API_PATHS.has(pathname) ||
    INTERNAL_API_PATHS.has(pathname) ||
    PUBLIC_API_PATHS.has(pathname) ||
    isPublicPath(pathname)
  ) {
    return NextResponse.next();
  }

  if (authenticated || devAiBypass) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  const currentPath = `${pathname}${search}`;
  loginUrl.searchParams.set("next", currentPath);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
