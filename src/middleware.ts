import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Cek custom session cookie
  const sessionCookie = req.cookies.get("nova_session");
  const isLoggedIn = !!sessionCookie?.value;

  // Halaman publik (tidak perlu auth)
  const isPublicPath =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/billing/webhook") ||
    pathname.startsWith("/r/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/sw.js" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/manifest.json" ||
    pathname.startsWith("/icons/");

  // Kalau di /login & sudah login → redirect ke /ai-studio
  if (pathname.startsWith("/login") && isLoggedIn) {
    return NextResponse.redirect(new URL("/ai-studio", req.url));
  }

  // Kalau bukan public & belum login → redirect ke /login
  if (!isPublicPath && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|js|ico|webmanifest|xml|txt)$).*)",
  ],
};