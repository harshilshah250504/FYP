import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";

const PUBLIC_PATHS = new Set(["/login", "/signup"]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip Next internals & assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap")
  ) {
    return NextResponse.next();
  }

  // Skip auth endpoints
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE_NAME)?.value);

  // If already logged in, keep them out of login/signup
  if (hasSession && PUBLIC_PATHS.has(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Require auth for everything else (including /api/search, /insights, /)
  if (!hasSession && !PUBLIC_PATHS.has(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};

