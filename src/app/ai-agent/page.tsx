"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";

interface Stats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  scheduledPosts: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  upcomingEvents: number;
  mediaCount: number;
}

interface Idea {
  title: string;
  platform: string;
  hook: string;
  format: string;
  why: string;
  bestTime: string;
}

export default function AIAgentPage() {
  const [activeTab, setActiveTab] = useState<"analyze" | "generate" | "remind" | "strategy">("analyze");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [reminders, setReminders] = useState<string[]>([]);
  const [strategy, setStrategy] = useState("");
  const [generateCount, setGenerateCount] = useState(5);

  async function callAgent(action: string, extra: any = {}) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || "Gagal");
        return;
      }

      if (action === "analyze") {
        setAnalysis(json.data.analysis);
        setStats(json.data.stats);
      } else if (action === "generate") {
        setIdeas(json.data.ideas || []);
        if (json.data.raw) {
          setError("AI response bukan JSON valid. Coba lagi.");
        }
      } else if (action === "remind") {
        setReminders(json.data.reminders || []);
      } else if (action === "strategy") {
        setStrategy(json.data.strategy);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <p className="text-cyan-400 text-sm font-bold tracking-widest mb-2">
              AI AGENT
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center gap-3">
              <span className="text-cyan-400">🤖</span>
              Nova Pulse Agent
            </h1>
            <p className="text-slate-400">
              AI yang baca data kamu & kasih saran cerdas secara otomatis.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {[
              { id: "analyze", label: "Analyze Data", icon: "📊" },
              { id: "generate", label: "Generate Ideas", icon: "✨" },
              { id: "remind", label: "Reminder", icon: "🔔" },
              { id: "strategy", label: "Strategy", icon: "🎯" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-cyan-500 text-white"
                    : "bg-slate-800/60 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-xl mb-6">
              ❌ {error}
            </div>
          )}

          {/* ANALYZE TAB */}
          {activeTab === "analyze" && (
            <div className="space-y-6">
              <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-cyan-500/20">
                <h2 className="text-xl font-bold text-white mb-2">
                  📊 Analyze Data
                </h2>
                <p className="text-slate-400 text-sm mb-4">
                  AI akan baca semua data kamu (posts, transaksi, jadwal, media) dan kasih insight cerdas.
                </p>
                <button
                  onClick={() => callAgent("analyze")}
                  disabled={loading}
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition"
                >
                  {loading ? "⏳ Menganalisa..." : "🚀 Analyze Sekarang"}
                </button>
              </div>

              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-800/60 backdrop-blur rounded-xl p-4 border border-cyan-500/20">
                    <p className="text-slate-400 text-xs">Total Posts</p>
                    <p className="text-2xl font-bold text-cyan-400">{stats.totalPosts}</p>
                  </div>
                  <div className="bg-slate-800/60 backdrop-blur rounded-xl p-4 border border-green-500/20">
                    <p className="text-slate-400 text-xs">Saldo</p>
                    <p className="text-lg font-bold text-green-400">
                      {formatCurrency(stats.balance)}
                    </p>
                  </div>
                  <div className="bg-slate-800/60 backdrop-blur rounded-xl p-4 border border-yellow-500/20">
                    <p className="text-slate-400 text-xs">Event</p>
                    <p className="text-2xl font-bold text-yellow-400">{stats.upcomingEvents}</p>
                  </div>
                  <div className="bg-slate-800/60 backdrop-blur rounded-xl p-4 border border-purple-500/20">
                    <p className="text-slate-400 text-xs">Media</p>
                    <p className="text-2xl font-bold text-purple-400">{stats.mediaCount}</p>
                  </div>
                </div>
              )}

              {analysis && (
                <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-cyan-500/20">
                  <h3 className="text-lg font-bold text-white mb-4">
                    🧠 AI Analysis
                  </h3>
                  <div className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                    {analysis}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GENERATE TAB */}
          {activeTab === "generate" && (
            <div className="space-y-6">
              <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-cyan-500/20">
                <h2 className="text-xl font-bold text-white mb-2">
                  ✨ Generate Content Ideas
                </h2>
                <p className="text-slate-400 text-sm mb-4">
                  AI akan buat ide konten baru berdasarkan niche & data kamu.
                </p>

                <div className="flex flex-wrap gap-3 items-center mb-4">
                  <label className="text-cyan-300 text-sm font-semibold">
                    Jumlah ide:
                  </label>
                  <select
                    value={generateCount}
                    onChange={(e) => setGenerateCount(Number(e.target.value))}
                    className="bg-slate-900 text-white rounded-lg px-3 py-2 border border-slate-700 focus:border-cyan-500 outline-none"
                  >
                    <option value={3}>3 ide</option>
                    <option value={5}>5 ide</option>
                    <option value={10}>10 ide</option>
                  </select>
                </div>

                <button
                  onClick={() => callAgent("generate", { count: generateCount })}
                  disabled={loading}
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition"
                >
                  {loading ? "⏳ Generating..." : "✨ Generate Ideas"}
                </button>
              </div>

              {ideas.length > 0 && (
                <div className="grid gap-4">
                  {ideas.map((idea, i) => (
                    <div
                      key={i}
                      className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-cyan-500/20 hover:border-cyan-500/40 transition"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-white font-bold text-lg">
                          {i + 1}. {idea.title}
                        </h3>
                        <span className="text-xs px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 whitespace-nowrap">
                          {idea.platform}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <p className="text-slate-300">
                          <span className="text-cyan-400 font-semibold">🎣 Hook:</span>{" "}
                          {idea.hook}
                        </p>
                        <p className="text-slate-300">
                          <span className="text-cyan-400 font-semibold">📱 Format:</span>{" "}
                          {idea.format}
                        </p>
                        <p className="text-slate-300">
                          <span className="text-cyan-400 font-semibold">💡 Why:</span>{" "}
                          {idea.why}
                        </p>
                        <p className="text-slate-300">
                          <span className="text-cyan-400 font-semibold">⏰ Best Time:</span>{" "}
                          {idea.bestTime}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* REMIND TAB */}
          {activeTab === "remind" && (
            <div className="space-y-6">
              <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-cyan-500/20">
                <h2 className="text-xl font-bold text-white mb-2">
                  🔔 Reminder Hari Ini
                </h2>
                <p className="text-slate-400 text-sm mb-4">
                  Lihat jadwal & event hari ini.
                </p>
                <button
                  onClick={() => callAgent("remind")}
                  disabled={loading}
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition"
                >
                  {loading ? "⏳ Checking..." : "🔔 Check Reminder"}
                </button>
              </div>

              {reminders.length > 0 && (
                <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-cyan-500/20">
                  <div className="space-y-3">
                    {reminders.map((r, i) => (
                      <p
                        key={i}
                        className="text-slate-200 whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{
                          __html: r.replace(/\*\*(.+?)\*\*/g, '<strong class="text-cyan-300">$1</strong>'),
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STRATEGY TAB */}
          {activeTab === "strategy" && (
            <div className="space-y-6">
              <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-cyan-500/20">
                <h2 className="text-xl font-bold text-white mb-2">
                  🎯 Content Strategy
                </h2>
                <p className="text-slate-400 text-sm mb-4">
                  AI akan buat strategi konten 7 hari ke depan berdasarkan data kamu.
                </p>
                <button
                  onClick={() => callAgent("strategy")}
                  disabled={loading}
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition"
                >
                  {loading ? "⏳ Menyusun strategi..." : "🎯 Buat Strategi 7 Hari"}
                </button>
              </div>

              {strategy && (
                <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-cyan-500/20">
                  <h3 className="text-lg font-bold text-white mb-4">
                    📋 Strategi Minggu Ini
                  </h3>
                  <div className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                    {strategy}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}