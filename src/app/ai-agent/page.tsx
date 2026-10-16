"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";

interface Stats {
  posts: number;
  drafts: number;
  scheduled: number;
  events: number;
  transactions: number;
  media: number;
  affiliateClicks: number;
}

export default function AIAgentPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [ideas, setIdeas] = useState<string[]>([]);
  const [reminders, setReminders] = useState<string[]>([]);
  const [strategy, setStrategy] = useState<string | null>(null);

  async function runAgent(action: string, extra: any = {}) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });

      // ⭐ HANDLE NON-JSON RESPONSE (504, 503, 500, dll)
      if (!res.ok) {
        const errText = await res.text();
        console.error(
          `[AI Agent] API error ${res.status}:`,
          errText.substring(0, 300)
        );

        if (res.status === 504) {
          setError(
            "⏱️ Server timeout — AI sedang overload. Mohon tunggu 2-3 menit lalu coba lagi."
          );
          return;
        }
        if (res.status === 503) {
          setError(
            "🚦 Server AI sedang ramai. Mohon tunggu 1-2 menit lalu coba lagi."
          );
          return;
        }
        if (res.status === 429) {
          setError(
            "⏸️ Terlalu banyak request. Mohon tunggu 1 menit lalu coba lagi."
          );
          return;
        }
        if (res.status >= 500) {
          setError(
            "🚨 Server error. Tim kami sedang memperbaiki. Coba lagi sebentar."
          );
          return;
        }
        setError(`Error ${res.status}: ${errText.substring(0, 100)}`);
        return;
      }

      // ⭐ SAFE JSON PARSE
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text.substring(0, 200));
        setError("Server mengirim response tidak valid. Coba lagi.");
        return;
      }

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
      console.error("AI Agent error:", err);
      setError(err.message || "Gagal menjalankan AI Agent. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main
        className="min-h-screen"
        style={{ background: "var(--theme-bg-primary)", color: "var(--theme-text-primary)" }}
      >
        <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
          {/* Header */}
          <div>
            <p
              className="text-xs font-bold tracking-widest mb-1"
              style={{ color: "var(--accent-color)" }}
            >
              AI AGENT
            </p>
            <h1 className="text-4xl font-bold mb-2">Nova Pulse Agent</h1>
            <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
              AI yang baca data kamu & kasih saran cerdas secara otomatis.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => runAgent("analyze")}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
              style={{
                background: "var(--accent-color)",
                color: "var(--theme-bg-primary)",
              }}
            >
              📊 Analyze Data
            </button>
            <button
              onClick={() => runAgent("generate")}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
              style={{
                background: "var(--theme-bg-tertiary)",
                color: "var(--theme-text-primary)",
              }}
            >
              ✨ Generate Ideas
            </button>
            <button
              onClick={() => runAgent("remind")}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
              style={{
                background: "var(--theme-bg-tertiary)",
                color: "var(--theme-text-primary)",
              }}
            >
              🔔 Reminder
            </button>
            <button
              onClick={() => runAgent("strategy")}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
              style={{
                background: "var(--theme-bg-tertiary)",
                color: "var(--theme-text-primary)",
              }}
            >
              🎯 Strategy
            </button>
          </div>

          {/* Error */}
          {error && (
            <div
              className="text-sm px-4 py-3 rounded-xl flex items-start gap-2"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#fca5a5",
              }}
            >
              <span>❌</span>
              <span className="flex-1">{error}</span>
              <button
                onClick={() => setError("")}
                className="text-xs opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div
              className="p-6 rounded-xl border text-center"
              style={{
                background: "var(--theme-card-bg)",
                borderColor: "var(--theme-border)",
              }}
            >
              <div className="inline-block">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                  <span
                    className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"
                    style={{ animationDelay: "0.3s" }}
                  />
                </div>
              </div>
              <p
                className="text-sm mt-3"
                style={{ color: "var(--theme-text-muted)" }}
              >
                AI sedang bekerja... Mohon tunggu sebentar.
              </p>
            </div>
          )}

          {/* Analysis Result */}
          {analysis && !loading && (
            <div
              className="p-6 rounded-xl border space-y-4"
              style={{
                background: "var(--theme-card-bg)",
                borderColor: "var(--theme-border)",
              }}
            >
              <h2 className="text-lg font-bold">📊 Analyze Data</h2>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {analysis}
              </p>

              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t" style={{ borderColor: "var(--theme-border)" }}>
                  {[
                    { label: "Posts", value: stats.posts },
                    { label: "Drafts", value: stats.drafts },
                    { label: "Scheduled", value: stats.scheduled },
                    { label: "Events", value: stats.events },
                    { label: "Transactions", value: stats.transactions },
                    { label: "Media", value: stats.media },
                    { label: "Affiliate Clicks", value: stats.affiliateClicks },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg"
                      style={{ background: "var(--theme-bg-tertiary)" }}
                    >
                      <div
                        className="text-xs"
                        style={{ color: "var(--theme-text-muted)" }}
                      >
                        {s.label}
                      </div>
                      <div
                        className="text-xl font-bold"
                        style={{ color: "var(--accent-color)" }}
                      >
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ideas */}
          {ideas.length > 0 && !loading && (
            <div
              className="p-6 rounded-xl border space-y-3"
              style={{
                background: "var(--theme-card-bg)",
                borderColor: "var(--theme-border)",
              }}
            >
              <h2 className="text-lg font-bold">✨ Generate Ideas</h2>
              <ul className="space-y-2">
                {ideas.map((idea, i) => (
                  <li
                    key={i}
                    className="p-3 rounded-lg text-sm"
                    style={{ background: "var(--theme-bg-tertiary)" }}
                  >
                    {idea}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reminders */}
          {reminders.length > 0 && !loading && (
            <div
              className="p-6 rounded-xl border space-y-3"
              style={{
                background: "var(--theme-card-bg)",
                borderColor: "var(--theme-border)",
              }}
            >
              <h2 className="text-lg font-bold">🔔 Reminder</h2>
              <ul className="space-y-2">
                {reminders.map((r, i) => (
                  <li
                    key={i}
                    className="p-3 rounded-lg text-sm"
                    style={{ background: "var(--theme-bg-tertiary)" }}
                  >
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Strategy */}
          {strategy && !loading && (
            <div
              className="p-6 rounded-xl border space-y-3"
              style={{
                background: "var(--theme-card-bg)",
                borderColor: "var(--theme-border)",
              }}
            >
              <h2 className="text-lg font-bold">🎯 Strategy</h2>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {strategy}
              </p>
            </div>
          )}

          {/* Empty state — Analyze Card */}
          {!analysis && !loading && !error && (
            <div
              className="p-6 rounded-xl border space-y-4"
              style={{
                background: "var(--theme-card-bg)",
                borderColor: "var(--theme-border)",
              }}
            >
              <h2 className="text-lg font-bold">📊 Analyze Data</h2>
              <p
                className="text-sm"
                style={{ color: "var(--theme-text-muted)" }}
              >
                AI akan baca semua data kamu (posts, transaksi, jadwal, media)
                dan kasih insight cerdas.
              </p>
              <button
                onClick={() => runAgent("analyze")}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm transition hover:scale-105 disabled:opacity-50"
                style={{
                  background: "linear-gradient(to right, var(--accent-color), #a855f7)",
                  color: "white",
                }}
              >
                🚀 Analyze Sekarang
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}