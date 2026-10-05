"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSettings } from "@/lib/settings-context";

export default function SettingsPanel() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleUpdate(partial: any) {
    await updateSettings(partial);
    setMessage("✓ Tersimpan");
    setTimeout(() => setMessage(""), 2000);
  }

  async function handleReset() {
    if (!confirm("Reset semua settings ke default?")) return;
    await resetSettings();
    setMessage("✓ Settings direset");
    setTimeout(() => setMessage(""), 2000);
  }

  function exportData() {
    const data = localStorage.getItem("nova_settings");
    const blob = new Blob([data || "{}"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nova-settings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const trigger = (
    <button
      onClick={() => setOpen(true)}
      aria-label="Settings"
      className="w-10 h-10 rounded-full border border-white/10 bg-white/5 text-cyan-400 hover:bg-cyan-500/10 hover:rotate-45 transition flex items-center justify-center"
    >
      ⚙
    </button>
  );

  if (!mounted) return trigger;

  return createPortal(
    <>
      {trigger}

      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 bg-black/80 z-[9998] transition ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        className={`fixed top-0 right-0 h-full w-[min(400px,92vw)] bg-slate-950 border-l-2 border-cyan-500/40 shadow-2xl shadow-cyan-500/20 z-[9999] overflow-y-auto transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="sticky top-0 bg-slate-950 z-10 p-6 border-b border-cyan-500/20 flex justify-between items-start">
          <div>
            <p className="text-cyan-400 text-xs font-bold tracking-widest">SETTINGS</p>
            <h2 className="text-2xl font-bold text-white mt-1">Pengaturan</h2>
            {message && <p className="text-green-400 text-xs mt-1">{message}</p>}
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-slate-400 hover:text-white text-3xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <h3 className="text-cyan-400 text-sm font-bold tracking-widest mb-4">
              🎨 APPEARANCE
            </h3>

            <div className="mb-4">
              <label className="block text-slate-300 text-sm mb-2 font-semibold">Theme</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "neon", label: "Neon", color: "from-cyan-400 to-purple-500" },
                  { id: "aurora", label: "Aurora", color: "from-green-400 to-blue-500" },
                  { id: "cyber", label: "Cyber", color: "from-yellow-400 to-red-500" },
                  { id: "minimal", label: "Minimal", color: "from-slate-400 to-slate-600" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleUpdate({ theme: t.id })}
                    className={`flex items-center gap-2 p-3 rounded-xl border transition ${
                      settings.theme === t.id
                        ? "border-cyan-500 bg-cyan-500/10"
                        : "border-slate-700 bg-slate-800/50 hover:border-cyan-500/30"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-gradient-to-br ${t.color}`} />
                    <span className="text-white text-sm">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-slate-300 text-sm mb-2 font-semibold">Ukuran Font</label>
              <div className="flex gap-2">
                {["small", "normal", "large"].map((size) => (
                  <button
                    key={size}
                    onClick={() => handleUpdate({ fontSize: size })}
                    className={`flex-1 py-2 rounded-lg text-sm border transition capitalize ${
                      settings.fontSize === size
                        ? "border-cyan-500 bg-cyan-500/20 text-white font-bold"
                        : "border-slate-700 bg-slate-800/50 text-slate-400"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-slate-300 text-sm mb-2 font-semibold">Warna Aksen</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) => handleUpdate({ accentColor: e.target.value })}
                  className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border border-slate-700"
                />
                <span className="text-slate-400 text-sm font-mono">{settings.accentColor}</span>
              </div>
            </div>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700 mb-2 cursor-pointer">
              <span className="text-slate-300 text-sm">Animasi Partikel</span>
              <input
                type="checkbox"
                checked={settings.particlesOn}
                onChange={(e) => handleUpdate({ particlesOn: e.target.checked })}
                className="w-4 h-4 accent-cyan-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700 cursor-pointer">
              <span className="text-slate-300 text-sm">Compact Mode</span>
              <input
                type="checkbox"
                checked={settings.compactMode}
                onChange={(e) => handleUpdate({ compactMode: e.target.checked })}
                className="w-4 h-4 accent-cyan-500"
              />
            </label>
          </section>

          <section>
            <h3 className="text-cyan-400 text-sm font-bold tracking-widest mb-4">
              🤖 AI PREFERENCES
            </h3>

            <label className="block text-slate-300 text-sm mb-2 font-semibold">Default AI Model</label>
            <select
              value={settings.aiModel}
              onChange={(e) => handleUpdate({ aiModel: e.target.value })}
              className="w-full bg-slate-800 text-white rounded-xl p-3 border border-slate-700 focus:border-cyan-500 outline-none mb-4"
            >
              <option value="gemini-3.5-flash">Gemini 3.5 Flash (cepat)</option>
              <option value="gemini-3.8-flash">Gemini 3.8 Flash (terbaru)</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (stabil)</option>
            </select>

            <label className="block text-slate-300 text-sm mb-2 font-semibold">
              Temperature: {settings.aiTemperature.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.aiTemperature}
              onChange={(e) => handleUpdate({ aiTemperature: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 mb-1"
            />
            <div className="flex justify-between text-xs text-slate-500 mb-4">
              <span>Fokus (0.0)</span>
              <span>Kreatif (1.0)</span>
            </div>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700 cursor-pointer">
              <span className="text-slate-300 text-sm">Auto-save Chat</span>
              <input
                type="checkbox"
                checked={settings.autoSaveChat}
                onChange={(e) => handleUpdate({ autoSaveChat: e.target.checked })}
                className="w-4 h-4 accent-cyan-500"
              />
            </label>
          </section>

          <section>
            <h3 className="text-cyan-400 text-sm font-bold tracking-widest mb-4">
              🔔 NOTIFICATIONS
            </h3>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700 mb-2 cursor-pointer">
              <span className="text-slate-300 text-sm">Email Reminder</span>
              <input
                type="checkbox"
                checked={settings.emailReminder}
                onChange={(e) => handleUpdate({ emailReminder: e.target.checked })}
                className="w-4 h-4 accent-cyan-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700 mb-2 cursor-pointer">
              <span className="text-slate-300 text-sm">Browser Notification</span>
              <input
                type="checkbox"
                checked={settings.browserNotify}
                onChange={async (e) => {
                  if (e.target.checked && "Notification" in window) {
                    const perm = await Notification.requestPermission();
                    if (perm !== "granted") {
                      alert("Izin notifikasi ditolak browser");
                      return;
                    }
                  }
                  handleUpdate({ browserNotify: e.target.checked });
                }}
                className="w-4 h-4 accent-cyan-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700 cursor-pointer">
              <span className="text-slate-300 text-sm">Daily Summary</span>
              <input
                type="checkbox"
                checked={settings.dailySummary}
                onChange={(e) => handleUpdate({ dailySummary: e.target.checked })}
                className="w-4 h-4 accent-cyan-500"
              />
            </label>
          </section>

          <section>
            <h3 className="text-cyan-400 text-sm font-bold tracking-widest mb-4">
              🌐 LANGUAGE & REGION
            </h3>

            <label className="block text-slate-300 text-sm mb-2 font-semibold">Bahasa</label>
            <select
              value={settings.language}
              onChange={(e) => handleUpdate({ language: e.target.value })}
              className="w-full bg-slate-800 text-white rounded-xl p-3 border border-slate-700 focus:border-cyan-500 outline-none mb-4"
            >
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>

            <label className="block text-slate-300 text-sm mb-2 font-semibold">Timezone</label>
            <select
              value={settings.timezone}
              onChange={(e) => handleUpdate({ timezone: e.target.value })}
              className="w-full bg-slate-800 text-white rounded-xl p-3 border border-slate-700 focus:border-cyan-500 outline-none mb-4"
            >
              <option value="Asia/Jakarta">WIB (Jakarta)</option>
              <option value="Asia/Makassar">WITA (Makassar)</option>
              <option value="Asia/Jayapura">WIT (Jayapura)</option>
            </select>

            <label className="block text-slate-300 text-sm mb-2 font-semibold">Currency</label>
            <select
              value={settings.currency}
              onChange={(e) => handleUpdate({ currency: e.target.value })}
              className="w-full bg-slate-800 text-white rounded-xl p-3 border border-slate-700 focus:border-cyan-500 outline-none"
            >
              <option value="IDR">IDR (Rupiah)</option>
              <option value="USD">USD (Dollar)</option>
              <option value="SGD">SGD (Singapore Dollar)</option>
            </select>
          </section>

          <section className="pt-6 border-t border-slate-700">
            <h3 className="text-cyan-400 text-sm font-bold tracking-widest mb-4">💾 DATA</h3>

            <button
              onClick={exportData}
              className="w-full bg-slate-800/50 border border-slate-700 text-slate-300 rounded-xl p-3 mb-2 hover:border-cyan-500/30 transition text-sm"
            >
              ⇩ Export Settings (JSON)
            </button>

            <button
              onClick={handleReset}
              className="w-full bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-3 hover:bg-red-500/20 transition text-sm"
            >
              ⟲ Reset ke Default
            </button>
          </section>
        </div>
      </aside>
    </>,
    document.body
  );
}
