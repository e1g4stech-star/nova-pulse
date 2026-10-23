"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";

const VISUAL_ENGINES = [
  { id: "imagine", name: "Imagine.art", url: "https://www.imagine.art", desc: "Workflow visual & generate gambar", icon: "🪄" },
  { id: "kling", name: "Kling AI", url: "https://klingai.com", desc: "Video sinematik + gambar detail", icon: "🎬" },
  { id: "runway", name: "Runway", url: "https://runwayml.com", desc: "Video profesional 1080p", icon: "🎥" },
  { id: "grok", name: "Grok AI", url: "https://grok.com", desc: "Gambar kreatif & realistis", icon: "⚡" },
  { id: "google", name: "Google Veo", url: "https://labs.google/veo", desc: "Video AI dari Google Labs", icon: "🔷" },
  { id: "leonardo", name: "Leonardo AI", url: "https://leonardo.ai", desc: "Gambar artistik & game asset", icon: "🎨" },
  { id: "ideogram", name: "Ideogram", url: "https://ideogram.ai", desc: "Gambar dengan teks di dalamnya", icon: "✍️" },
];

export default function AIStudioPage() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEngines, setShowEngines] = useState(false);
  const [copied, setCopied] = useState(false);
  const [provider, setProvider] = useState("");

  async function generateText() {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult("");
    setProvider("");

    try {
      const res = await fetch("/api/ai-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert("Error: " + (d.error || "Gagal generate"));
        return;
      }
      const d = await res.json();
      setResult(d.result);
      setProvider(d.provider);
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenEngine(engine: { name: string; url: string }) {
    if (prompt.trim()) {
      navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
    window.open(engine.url, "_blank");
    setShowEngines(false);
  }

  function copyResult() {
    if (!result) return;
    navigator.clipboard.writeText(result);
    alert("Hasil berhasil disalin!");
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen py-10 px-4" style={{ background: "var(--theme-bg-primary)", color: "var(--theme-text-primary)" }}>
        <div className="max-w-4xl mx-auto">
          
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight">AI Virality Studio</h1>
            <p className="text-sm mt-1" style={{ color: "var(--theme-text-muted)" }}>
              Ketik ide kontenmu, biarkan AI bantu bikin hook, caption, hashtag, dan visual.
            </p>
          </div>

          <div className="rounded-2xl border p-6 mb-6" style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)" }}>
            <label className="block mb-4">
              <span className="text-sm font-semibold" style={{ color: "var(--theme-text-muted)" }}>Apa yang ingin kamu posting?</span>
              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Contoh: Launch produk skincare futuristik untuk Gen Z, dengan nuansa neon di kota malam..."
                className="w-full mt-2 px-4 py-3 rounded-xl border text-sm"
                style={{ background: "var(--theme-bg-primary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }}
              />
            </label>

            <div className="flex flex-col md:flex-row gap-3">
              <button
                onClick={generateText}
                disabled={loading || !prompt.trim()}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition"
                style={{ background: "linear-gradient(to right, #06b6d4, #3b82f6)" }}
              >
                {loading ? "Menyusun Teks..." : "Generate Teks AI"}
              </button>

              <button
                onClick={() => {
                  if (!prompt.trim()) { alert("Isi ide konten dulu di kolom atas."); return; }
                  setShowEngines(true);
                }}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition"
                style={{ background: "linear-gradient(to right, #ec4899, #a855f7)" }}
              >
                Generate Visual AI
              </button>
            </div>
            {copied && <p className="text-xs mt-3 text-green-400">✅ Prompt berhasil disalin! Tinggal paste (Ctrl+V) di website AI yang terbuka.</p>}
          </div>

          {result && (
            <div className="rounded-2xl border p-6 mb-6" style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)" }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold">Hasil Generate {provider && <span className="text-xs font-normal ml-2 px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">via {provider}</span>}</h2>
                <button onClick={copyResult} className="px-3 py-1 rounded border text-xs" style={{ borderColor: "var(--theme-border)" }}>
                  Salin
                </button>
              </div>
              <div className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "var(--theme-text-primary)" }}>
                {result}
              </div>
            </div>
          )}

          {showEngines && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
              <div className="w-full max-w-lg rounded-2xl border p-5 max-h-[80vh] overflow-y-auto" style={{ background: "var(--theme-bg-primary)", borderColor: "var(--theme-border)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Pilih Mesin Visual AI</h2>
                  <button onClick={() => setShowEngines(false)} className="text-xl font-bold px-2">×</button>
                </div>
                <p className="text-xs mb-4" style={{ color: "var(--theme-text-muted)" }}>
                  Nova Pulse akan menyalin promptmu otomatis. Kamu tinggal paste (Ctrl+V) di website AI yang terbuka.
                </p>

                <div className="space-y-2">
                  {VISUAL_ENGINES.map((engine) => (
                    <button
                      key={engine.id}
                      onClick={() => handleOpenEngine(engine)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition hover:opacity-80"
                      style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)" }}
                    >
                      <span className="text-2xl">{engine.icon}</span>
                      <div className="flex-1">
                        <div className="font-bold text-sm">{engine.name}</div>
                        <div className="text-xs" style={{ color: "var(--theme-text-muted)" }}>{engine.desc}</div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-300">Buka ↗</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
}