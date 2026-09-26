"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === "loading") return null;

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/ai-studio", label: "AI Studio" },
    { href: "/posts", label: "Posts" },
    { href: "/finance", label: "Keuangan" },
    { href: "/visualisasi", label: "Visualisasi" },
  ];

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname?.startsWith(href);
  }

  return (
    <nav className="bg-slate-900/80 backdrop-blur border-b border-cyan-500/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center group-hover:scale-105 transition">
              <span className="text-slate-900 font-bold">N</span>
            </div>
            <span className="font-bold text-cyan-400">Nova Pulse</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    active
                      ? "text-cyan-400 bg-cyan-500/10 font-semibold"
                      : "text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {session?.user && (
            <>
              <span className="text-slate-400 text-sm hidden md:block">
                {session.user.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="bg-red-500/20 text-red-300 px-3 py-1.5 rounded-lg text-sm hover:bg-red-500/30 transition"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>

      <div className="md:hidden border-t border-cyan-500/10 px-6 py-2 flex gap-2 overflow-x-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition ${
                active
                  ? "text-cyan-400 bg-cyan-500/10 font-semibold"
                  : "text-slate-300 hover:text-cyan-400"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}