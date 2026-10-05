"use client";

import Link from "next/link";
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function LandingPage() {
  const { user: session } = useCurrentUser();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
              <span className="text-slate-900 font-bold text-lg">N</span>
            </div>
            <span className="font-bold text-cyan-400 text-lg">Nova Pulse</span>
          </div>

          <div className="flex items-center gap-3">
            {session ? (
              <Link
                href="/ai-studio"
                className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold px-5 py-2 rounded-xl hover:opacity-90 transition"
              >
                Masuk Studio
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-slate-300 hover:text-cyan-400 transition hidden md:block"
                >
                  Masuk
                </Link>
                <Link
                  href="/login"
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold px-5 py-2 rounded-xl hover:opacity-90 transition"
                >
                  Daftar Gratis
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold tracking-widest mb-6">
            ✦ SOCIAL COMMAND CENTER 2026
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            Semua kontenmu.
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Satu pusat kendali.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Kelola postingan, generate caption dengan AI, dan pantau performa
            sosial mediamu dalam satu dashboard futuristik.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={session ? "/ai-studio" : "/login"}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition text-lg"
            >
              {session ? "Buka Studio →" : "Mulai Gratis →"}
            </Link>
            <a
              href="#features"
              className="bg-slate-800/60 backdrop-blur border border-cyan-500/20 text-white font-bold px-8 py-4 rounded-xl hover:border-cyan-500/50 transition text-lg"
            >
              Lihat Fitur
            </a>
          </div>

          <p className="text-slate-500 text-sm mt-6">
            Gratis · Tanpa kartu kredit · Setup dalam 30 detik
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "10x", label: "Lebih cepat" },
            { value: "50+", label: "Model AI" },
            { value: "5", label: "Platform" },
            { value: "100%", label: "Gratis" },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-cyan-500/20 text-center"
            >
              <div className="text-3xl md:text-4xl font-bold text-cyan-400 mb-2">
                {stat.value}
              </div>
              <div className="text-slate-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-cyan-400 text-sm font-bold tracking-widest mb-3">
              FITUR UNGGULAN
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Semua yang kamu butuhkan.
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Dari generate caption sampai analisis performa — semua dalam satu
              platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "✦",
                title: "AI Content Generator",
                desc: "Generate caption, hook, dan hashtag dalam 3 detik dengan Google Gemini AI.",
                color: "from-cyan-500 to-blue-500",
              },
              {
                icon: "🎨",
                title: "Visual AI",
                desc: "Buat gambar profesional untuk setiap postingan tanpa perlu desainer.",
                color: "from-pink-500 to-purple-500",
              },
              {
                icon: "📊",
                title: "Analytics Dashboard",
                desc: "Pantau performa postingan, engagement, dan reach dalam satu tampilan.",
                color: "from-purple-500 to-indigo-500",
              },
              {
                icon: "📅",
                title: "Smart Scheduling",
                desc: "Jadwalkan postingan otomatis di waktu terbaik untuk engagement.",
                color: "from-green-500 to-cyan-500",
              },
              {
                icon: "🔗",
                title: "Multi-Platform",
                desc: "Kelola Instagram, TikTok, YouTube, Facebook, dan Pinterest sekaligus.",
                color: "from-yellow-500 to-orange-500",
              },
              {
                icon: "🔐",
                title: "Aman & Private",
                desc: "Password terenkripsi bcrypt, data milikmu 100% aman.",
                color: "from-red-500 to-pink-500",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-slate-800/40 backdrop-blur rounded-2xl p-6 border border-cyan-500/10 hover:border-cyan-500/40 transition group"
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur rounded-3xl p-12 border border-cyan-500/30 text-center relative overflow-hidden">
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-0 left-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Siap jadi creator?
            </h2>
            <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">
              Bergabung dengan ribuan creator yang sudah mengotomatisasi content
              workflow mereka.
            </p>

            <Link
              href={session ? "/ai-studio" : "/login"}
              className="inline-block bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold px-10 py-4 rounded-xl hover:opacity-90 transition text-lg"
            >
              {session ? "Buka Studio →" : "Mulai Gratis Sekarang →"}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-cyan-500/10 px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
              <span className="text-slate-900 font-bold text-xs">N</span>
            </div>
            <span>© 2026 Nova Pulse. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-cyan-400 transition">
              Masuk
            </Link>
            <a href="#features" className="hover:text-cyan-400 transition">
              Fitur
            </a>
            <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition">
              Powered by Gemini
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
