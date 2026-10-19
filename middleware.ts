import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Daftar halaman yang HANYA boleh diakses oleh pengguna Berbayar (Pro/Business)
const PREMIUM_ROUTES = [
  "/studio-konten",
  "/ai-agent",
  "/media-studio"
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Cek apakah halaman yang diakses termasuk premium
  const isPremiumRoute = PREMIUM_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isPremiumRoute) {
    // Ambil session token cookie (sesuaikan dengan nama cookie auth kamu, misal "next-auth.session-token" atau custom)
    // Karena kamu pakai custom auth, kita cek via API /api/auth/me
    try {
      const meUrl = new URL("/api/auth/me", request.url);
      const res = await fetch(meUrl, {
        headers: { cookie: request.headers.get("cookie") || "" },
      });
      
      if (res.ok) {
        const data = await res.json();
        const user = data.user || data.data;
        
        // Jika user login dan plan-nya masih "free", alihkan ke /pricing
        if (user && user.plan === "free") {
          return NextResponse.redirect(new URL("/pricing?upgrade=required", request.url));
        }
      }
    } catch (error) {
      console.error("Middleware auth error:", error);
    }
  }

  return NextResponse.next();
}

// Jalankan middleware untuk semua route kecuali API, static files, dll.
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};