import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, isSessionAuthenticated } from "@/lib/auth";

const PUBLIC_PATHS = new Set(["/", "/login", "/register", "/forgot-password", "/reset-password"]);
const PUBLIC_PREFIXES = ["/tarot/"];
const AUTH_API_PATHS = new Set(["/api/auth/login", "/api/auth/logout", "/api/auth/register", "/api/auth/forgot-password", "/api/auth/reset-password"]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) {
    return true;
  }
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const cookieValue = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const authenticated = isSessionAuthenticated(cookieValue);

  if (AUTH_API_PATHS.has(pathname) || isPublicPath(pathname)) {
    if (authenticated && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (authenticated) {
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
