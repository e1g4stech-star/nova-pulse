"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";

interface AIResult {
  hooks: string[];
  captions: string[];
  hashtags: string[];
  visualSuggestions: string[];
  readinessScore: number;
  bestPostingTime: string;
}

export default function AIStudioPage() {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [error, setError] = useState("");

  const [imageLoading, setImageLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  async function handleGenerate() {
    if (!idea.trim()) {
      setError("Tulis dulu ide kontenmu!");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setSaveMessage("");

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });

      const json = await res.json();

      if (json.success) {
        setResult(json.data);
      } else {
        setError(json.error || "Gagal generate");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateImage() {
    if (!idea.trim()) {
      setImageError("Tulis dulu ide kontenmu!");
      return;
    }

    setImageLoading(true);
    setImageError("");
    setImageUrl("");

    try {
      const prompt = `Buat gambar profesional untuk konten media sosial dengan ide: "${idea}". Style: modern, aesthetic, high quality, Instagram/TikTok ready, 1:1 aspect ratio.`;

      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const json = await res.json();

      if (json.success && json.data.image) {
        setImageUrl(json.data.image);
      } else {
        setImageError(json.error || "Gagal generate gambar");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setImageError(msg);
    } finally {
      setImageLoading(false);
    }
  }

  async function handleSaveToDraft() {
    if (!result) return;

    setSaving(true);
    setSaveMessage("");

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "instagram",
          title: result.hooks[0] || idea,
          desc: result.captions[0] || "",
          status: "draft",
          hashtags: result.hashtags || [],
        }),
      });

      const json = await res.json();

      if (json.success) {
        setSaveMessage("Tersimpan di database! Cek di /posts");
        setTimeout(() => setSaveMessage(""), 5000);
      } else {
        setSaveMessage(`Gagal: ${json.error}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setSaveMessage(`Error: ${msg}`);
    } finally {
      setSaving(false);
    }
  }

  function downloadImage() {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `nova-pulse-${Date.now()}.png`;
    link.click();
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-cyan-400 mb-2">
            AI Virality Studio
          </h1>
          <p className="text-slate-400 mb-8">
            Ketik ide kontenmu, biar AI bantu bikin hook, caption, hashtag, dan visual.
          </p>

          <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 mb-6 border border-cyan-500/20">
            <label className="block text-cyan-300 mb-3 font-semibold">
              Apa yang ingin kamu posting?
            </label>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Contoh: Launch produk skincare futuristik untuk Gen Z..."
              rows={4}
              className="w-full bg-slate-900/80 text-white rounded-xl p-4 border border-slate-700 focus:border-cyan-500 outline-none resize-none"
            />
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition"
              >
                {loading ? "Generating..." : "Generate Teks AI"}
              </button>
              <button
                onClick={handleGenerateImage}
                disabled={imageLoading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition"
              >
                {imageLoading ? "Creating Image..." : "Generate Visual AI"}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-xl mb-6">
              {error}
            </div>
          )}

          {imageError && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-xl mb-6">
              {imageError}
            </div>
          )}

          {saveMessage && (
            <div className="bg-green-500/20 border border-green-500 text-green-300 p-4 rounded-xl mb-6">
              {saveMessage}
            </div>
          )}

          {imageUrl && (
            <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 mb-6 border border-pink-500/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-pink-400 font-bold">Generated Visual</h3>
                <button
                  onClick={downloadImage}
                  className="bg-pink-500/20 text-pink-300 px-4 py-2 rounded-lg text-sm hover:bg-pink-500/30 transition"
                >
                  Download PNG
                </button>
              </div>
              <div className="flex justify-center">
                <img
                  src={imageUrl}
                  alt="AI Generated Visual"
                  className="rounded-xl max-w-full max-h-96 object-contain shadow-2xl"
                />
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-500/20 to-cyan-500/20 backdrop-blur rounded-2xl p-4 border border-green-500/30 flex justify-between items-center">
                <div>
                  <p className="text-green-300 font-bold">Konten siap disimpan</p>
                  <p className="text-slate-400 text-sm">Simpan sebagai draft untuk dikelola nanti</p>
                </div>
                <button
                  onClick={handleSaveToDraft}
                  disabled={saving}
                  className="bg-gradient-to-r from-green-500 to-cyan-500 text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition whitespace-nowrap"
                >
                  {saving ? "Menyimpan..." : "Simpan ke Draft"}
                </button>
              </div>

              <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-cyan-500/20">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Virality Readiness</span>
                  <span className="text-4xl font-bold text-cyan-400">
                    {result.readinessScore}
                    <span className="text-xl text-slate-500">/100</span>
                  </span>
                </div>
                <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all"
                    style={{ width: `${result.readinessScore}%` }}
                  />
                </div>
                <p className="text-slate-400 text-sm mt-3">
                  Waktu terbaik posting: <strong className="text-cyan-300">{result.bestPostingTime}</strong>
                </p>
              </div>

              <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-cyan-500/20">
                <h3 className="text-cyan-400 font-bold mb-3">Hooks (3 Detik Pertama)</h3>
                <ul className="space-y-2">
                  {result.hooks.map((h, i) => (
                    <li key={i} className="text-slate-200 bg-slate-900/50 p-3 rounded-lg">
                      {i + 1}. {h}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-cyan-500/20">
                <h3 className="text-cyan-400 font-bold mb-3">Captions</h3>
                <div className="space-y-3">
                  {result.captions.map((c, i) => (
                    <div key={i} className="text-slate-200 bg-slate-900/50 p-4 rounded-lg">
                      {c}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-cyan-500/20">
                <h3 className="text-cyan-400 font-bold mb-3">Hashtags</h3>
                <div className="flex flex-wrap gap-2">
                  {result.hashtags.map((h, i) => (
                    <span
                      key={i}
                      className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-sm"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-cyan-500/20">
                <h3 className="text-cyan-400 font-bold mb-3">Saran Visual</h3>
                <ul className="space-y-2">
                  {result.visualSuggestions.map((v, i) => (
                    <li key={i} className="text-slate-200 bg-slate-900/50 p-3 rounded-lg">
                      {v}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}