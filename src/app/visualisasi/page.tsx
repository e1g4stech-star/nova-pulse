"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import BattleVisualization2D from "@/components/BattleVisualization2D";
import BattleVisualization3D from "@/components/BattleVisualization3D";

export default function VisualisasiPage() {
  const [tab, setTab] = useState<"2d" | "3d">("2d");

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <p className="text-cyan-400 text-sm font-bold tracking-widest mb-2">
              VISUALISASI PERTEMPURAN
            </p>
            <h1 className="text-4xl font-bold text-white mb-3">
              Perang Badar — Simulasi Strategi
            </h1>
            <p className="text-slate-400">
              17 Ramadhan 2 H / 13 Maret 624 M · 313 Muslim vs 1000 Quraisy
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setTab("2d")}
              className={`px-6 py-3 rounded-xl font-bold transition ${
                tab === "2d"
                  ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white"
                  : "bg-slate-800/60 text-slate-400 hover:bg-slate-700"
              }`}
            >
              📊 Visualisasi 2D
            </button>
            <button
              onClick={() => setTab("3d")}
              className={`px-6 py-3 rounded-xl font-bold transition ${
                tab === "3d"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "bg-slate-800/60 text-slate-400 hover:bg-slate-700"
              }`}
            >
              🌐 Visualisasi 3D
            </button>
          </div>

          {/* Content */}
          {tab === "2d" && <BattleVisualization2D />}
          {tab === "3d" && <BattleVisualization3D />}

          {/* Info */}
          <div className="mt-6 bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-cyan-500/20">
            <h3 className="text-cyan-400 font-bold mb-3">ℹ️ Cara Pakai untuk Konten Video</h3>
            <ul className="text-slate-300 text-sm space-y-2">
              <li>1. Klik <strong className="text-cyan-300">▶ Play</strong> untuk lihat animasi</li>
              <li>2. Adjust <strong className="text-cyan-300">⏩ kecepatan</strong> (1x / 2x / 4x)</li>
              <li>3. Klik <strong className="text-red-300">🎥 Record</strong> untuk export ke video (WebM format)</li>
              <li>4. Video otomatis ter-download setelah animasi selesai (~18 detik)</li>
              <li>5. Convert WebM ke MP4 pakai <a href="https://cloudconvert.com/webm-to-mp4" target="_blank" rel="noreferrer" className="text-cyan-400 underline">CloudConvert</a> kalau perlu</li>
            </ul>
          </div>
        </div>
      </main>
    </>
  );
}