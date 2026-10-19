"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function PrivacyPolicyPage() {
  const lastUpdated = new Date().toLocaleDateString("id-ID", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <>
      <Navbar />
      <main className="min-h-screen py-12 px-4" style={{ background: "var(--theme-bg-primary)", color: "var(--theme-text-primary)" }}>
        <div className="max-w-3xl mx-auto">
          
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight mb-3">Kebijakan Privasi</h1>
            <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
              Terakhir diperbarui: {lastUpdated}
            </p>
          </div>

          <div className="space-y-8 text-sm leading-relaxed" style={{ color: "var(--theme-text-secondary)" }}>
            
            <section>
              <h2 className="text-lg font-bold mb-3" style={{ color: "var(--theme-text-primary)" }}>1. Pendahuluan</h2>
              <p>
                Selamat datang di Nova Pulse. Kami sangat menghargai privasi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda saat menggunakan aplikasi web dan mobile Nova Pulse.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-3" style={{ color: "var(--theme-text-primary)" }}>2. Informasi yang Kami Kumpulkan</h2>
              <p className="mb-3">Kami mengumpulkan beberapa jenis informasi untuk menyediakan layanan yang lebih baik:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Informasi Akun:</strong> Nama, alamat email, dan kata sandi (yang di-hash) saat Anda mendaftar.</li>
                <li><strong>Data Konten:</strong> Postingan, catatan, kalender, draft, dan kartu Studio Konten yang Anda buat di dalam aplikasi.</li>
                <li><strong>Data Transaksi:</strong> Catatan pembayaran dan riwayat langganan Anda (diproses melalui Midtrans).</li>
                <li><strong>Data Penggunaan & Analitik:</strong> Interaksi Anda dengan aplikasi (dikumpulkan secara anonim melalui PostHog untuk memperbaiki UI/UX).</li>
                <li><strong>Data AI:</strong> Teks yang Anda masukkan ke fitur AI (Chat, Agent, Studio) diproses oleh penyedia pihak ketiga (Google Gemini, Groq, OpenRouter).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-3" style={{ color: "var(--theme-text-primary)" }}>3. Bagaimana Kami Menggunakan Informasi Anda</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Menyediakan, memelihara, dan meningkatkan layanan Nova Pulse.</li>
                <li>Memproses transaksi dan mengelola langganan Anda.</li>
                <li>Memberikan fitur AI yang dipersonalisasi (seperti pembuatan naskah dan caption).</li>
                <li>Menganalisis tren penggunaan dan mengoptimalkan performa aplikasi.</li>
                <li>Berkomunikasi dengan Anda terkait pembaruan, keamanan, atau dukungan.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-3" style={{ color: "var(--theme-text-primary)" }}>4. Berbagi Informasi dengan Pihak Ketiga</h2>
              <p className="mb-3">Kami tidak menjual data pribadi Anda. Kami hanya membagikan data kepada penyedia layanan tepercaya untuk mengoperasikan aplikasi:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Vercel:</strong> Hosting aplikasi web dan performa.</li>
                <li><strong>Neon (PostgreSQL):</strong> Penyimpanan database yang aman.</li>
                <li><strong>Midtrans:</strong> Pemrosesan pembayaran yang aman.</li>
                <li><strong>Google Gemini, Groq, OpenRouter:</strong> Pemrosesan permintaan AI Anda.</li>
                <li><strong>PostHog:</strong> Analitik produk dan pelacakan error.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-3" style={{ color: "var(--theme-text-primary)" }}>5. Keamanan Data</h2>
              <p>
                Kami menggunakan enkripsi standar industri (HTTPS/SSL) dan praktik keamanan terbaik untuk melindungi data Anda. Namun, tidak ada metode transmisi internet yang 100% aman. Kami berkomitmen untuk melindungi data Anda sebaik mungkin.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-3" style={{ color: "var(--theme-text-primary)" }}>6. Hak Anda</h2>
              <p>
                Anda berhak untuk mengakses, memperbarui, atau menghapus data pribadi Anda kapan saja melalui pengaturan akun atau dengan menghubungi kami. Anda juga berhak untuk menolak pelacakan analitik dengan menonaktifkan cookie di browser Anda.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-3" style={{ color: "var(--theme-text-primary)" }}>7. Perubahan pada Kebijakan Ini</h2>
              <p>
                Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Kami akan memberi tahu Anda tentang perubahan signifikan melalui aplikasi atau email. Versi terbaru akan selalu tersedia di halaman ini.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-3" style={{ color: "var(--theme-text-primary)" }}>8. Hubungi Kami</h2>
              <p>
                Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami di <strong>support@novapulse.com</strong> atau melalui fitur bantuan di aplikasi.
              </p>
            </section>

            <div className="pt-8 border-t mt-10" style={{ borderColor: "var(--theme-border)" }}>
              <Link href="/dashboard" className="text-sm font-semibold hover:underline" style={{ color: "var(--accent-color)" }}>
                ← Kembali ke Dashboard
              </Link>
            </div>
            
          </div>
        </div>
      </main>
    </>
  );
}