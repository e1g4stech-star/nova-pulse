"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name: email.split("@")[0] }),
        });

        const data = await res.json();

        if (!data.success) {
          setError(data.error || "Gagal register");
          setLoading(false);
          return;
        }
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Email atau password salah");
        return;
      }

      // Berhasil — redirect ke /ai-studio
      router.push("/ai-studio");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500 mb-4">
            <span className="text-3xl font-bold text-slate-900">N</span>
          </div>
          <h1 className="text-3xl font-bold text-cyan-400">Nova Pulse</h1>
          <p className="text-slate-400 mt-2">
            {mode === "login" ? "Masuk ke akunmu" : "Buat akun baru"}
          </p>
        </div>

        <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-8 border border-cyan-500/20">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-cyan-300 mb-2 font-semibold text-sm">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="kamu@email.com"
                autoComplete="email"
                className="w-full bg-slate-900/80 text-white rounded-xl p-3 border border-slate-700 focus:border-cyan-500 outline-none"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-cyan-300 mb-2 font-semibold text-sm">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Minimal 6 karakter"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="w-full bg-slate-900/80 text-white rounded-xl p-3 border border-slate-700 focus:border-cyan-500 outline-none"
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
              className="text-cyan-400 hover:text-cyan-300 text-sm"
            >
              {mode === "login"
                ? "Belum punya akun? Daftar"
                : "Sudah punya akun? Masuk"}
            </button>
          </div>

          <p className="mt-6 text-center text-slate-500 text-xs">
            <a href="/" className="hover:text-cyan-400">
              ← Kembali ke Beranda
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}