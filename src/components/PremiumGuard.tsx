"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface User {
  id: string;
  email: string;
  plan: string;
}

export default function PremiumGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkPlan() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          // API /me biasanya mengembalikan { user: {...} } atau { data: {...} }
          setUser(data.user || data.data || null);
        }
      } catch (err) {
        console.error("Gagal cek plan:", err);
      } finally {
        setLoading(false);
      }
    }
    checkPlan();
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--theme-bg-primary)" }}>
          <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-color)", borderTopColor: "transparent" }}></div>
        </div>
      </>
    );
  }

  // Jika tidak login, arahkan ke halaman login
  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
  }

  // LOGIKA PEMBATASAN FITUR
  // Jika plan user adalah "free", tampilkan layar blokir
  if (user.plan === "free") {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--theme-bg-primary)", color: "var(--theme-text-primary)" }}>
          <div className="max-w-md w-full rounded-2xl border p-8 text-center space-y-5" style={{ background: "var(--theme-card-bg)", borderColor: "var(--theme-border)" }}>
            <div className="text-5xl">🔒</div>
            <h1 className="text-2xl font-bold">Fitur Premium</h1>
            <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
              Kamu saat ini menggunakan paket <b>Gratis</b>. Untuk mengakses fitur canggih ini (Studio Konten, AI Agent, dll), silakan upgrade ke paket Pro atau Business.
            </p>
            <div className="pt-4 flex flex-col gap-3">
              <Link href="/pricing"
                className="px-6 py-3 rounded-lg font-bold text-white transition hover:opacity-90"
                style={{ background: "linear-gradient(to right, var(--accent-color), #a855f7)" }}>
                Lihat Paket Harga
              </Link>
              <Link href="/dashboard" className="text-sm hover:underline" style={{ color: "var(--theme-text-muted)" }}>
                Kembali ke Dashboard
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Jika plan bukan "free" (Pro/Business), render halaman aslinya
  return <>{children}</>;
}