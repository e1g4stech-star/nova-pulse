"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function BackupPage() {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [importFile, setImportFile] = useState<File | null>(null);

  useEffect(() => {
    fetch("/api/export")
      .then((r) => r.json())
      .then((data) => setPreview(data.stats || null))
      .catch(() => setMessage("❌ Gagal load stats"));
  }, []);

  function downloadJson() {
    setBusy("json");
    setMessage("");
    const a = document.createElement("a");
    a.href = "/api/export";
    a.download = "";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => {
      setBusy(null);
      setMessage("✅ Backup JSON ter-download");
    }, 800);
  }

  async function importData() {
            if (!importFile) {
      setMessage("⚠️ Pilih file JSON dulu");
      return;
    }
    if (!confirm("Import akan MENGGABUNGKAN data. Lanjutkan?")) return;

    setBusy("import");
    setMessage("");

    try {
            const text = await importFile.text();
            let json;
      try {
        json = JSON.parse(text);
              } catch (parseErr: any) {
        console.error("❌ JSON parse error:", parseErr.message);
        setMessage(`❌ File bukan JSON valid: ${parseErr.message}`);
        setBusy(null);
        return;
      }

            const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
            const responseText = await res.text();
            let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        setMessage(`❌ Response bukan JSON`);
        setBusy(null);
        return;
      }

            if (result.success) {
        const stats = result.stats || {};
        const msg = `✅ Import sukses! Posts: ${stats.posts ?? 0}, Notes: ${stats.notes ?? 0}, Transactions: ${stats.transactions ?? 0}`;
                setMessage(msg);
      } else {
        setMessage(`❌ Import error: ${result.error || "Unknown"}`);
      }
    } catch (err: any) {
      console.error("💥 Catch error:", err);
      setMessage(`❌ Import gagal: ${err.message}`);
    } finally {
      setBusy(null);
          }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-cyan-400 hover:text-cyan-300 text-sm">
          ← Kembali ke Dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white">📦 Export & Backup</h1>
        <p className="text-slate-400 mt-1">
          Amankan semua data kamu. Export untuk backup, import untuk restore.
        </p>
      </div>

      {message && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-sm text-slate-300">
          {message}
        </div>
      )}

      {preview && (
        <section className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-3">📊 Data Kamu</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(preview).map(([key, val]) => (
              <div
                key={key}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-3"
              >
                <div className="text-xs text-slate-400 capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </div>
                <div className="text-2xl font-bold text-cyan-400">{String(val)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">⬇ Export Data</h2>
        <button
          onClick={downloadJson}
          disabled={busy === "json"}
          className="w-full bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-5 text-left hover:bg-cyan-500/20 transition disabled:opacity-50 flex items-start gap-4"
        >
          <div className="text-4xl">📄</div>
          <div className="flex-1">
            <div className="font-bold text-white text-lg">
              {busy === "json" ? "⏳ Mengunduh..." : "Backup Full (JSON)"}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Semua data: posts, notes, transactions, calendar events, media, AI chats, affiliate links, settings
            </div>
          </div>
        </button>
        <p className="text-xs text-slate-500 mt-3">
          💡 File akan tersimpan sebagai{" "}
          <code className="bg-slate-800 px-1 rounded">nova-pulse-backup-YYYY-MM-DD.json</code>
        </p>
      </section>

      <section className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">⬆ Import Data</h2>
        <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center">
          <input
            type="file"
            accept=".json"
            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            className="block mx-auto text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:text-cyan-300 file:hover:bg-cyan-500/30 file:cursor-pointer"
          />
          {importFile && (
            <p className="text-xs text-slate-400 mt-3">
              📎 {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>
        <button
          onClick={importData}
          disabled={!importFile || busy === "import"}
          className="mt-4 w-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 rounded-xl p-3 font-bold hover:bg-cyan-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy === "import" ? "⏳ Mengimport..." : "🚀 Restore dari Backup"}
        </button>
        <p className="text-xs text-slate-500 mt-3">
          ⚠️ Import akan <strong>menggabungkan</strong> data (bukan replace). Entity yang di-import saat ini: <strong>posts, notes, transactions</strong>.
        </p>
      </section>

      <section className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-200">
        <p className="font-bold mb-1">💡 Tips Backup Rutin:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Export JSON setiap minggu untuk backup lengkap</li>
          <li>Simpan file di Google Drive / Dropbox untuk backup cloud</li>
          <li>Test import di akun test dulu sebelum production</li>
          <li>Kalau butuh CSV / Markdown, kita bisa tambahkan endpoint baru nanti</li>
        </ul>
      </section>
    </div>
  );
}


