import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;

  // Halaman publik yang selalu bisa diakses
  const isPublicPath =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon");

  // Kalau di halaman login & sudah login → redirect ke /ai-studio
  if (pathname.startsWith("/login") && isLoggedIn) {
    return NextResponse.redirect(new URL("/ai-studio", req.url));
  }

  // Kalau bukan halaman publik & belum login → redirect ke /login
  if (!isPublicPath && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Selain itu, lanjut normal
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};