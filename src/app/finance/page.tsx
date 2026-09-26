"use client";

import { useState, useEffect, FormEvent } from "react";
import Navbar from "@/components/Navbar";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string | null;
  date: string;
}

interface Summary {
  income: number;
  expense: number;
  balance: number;
}

const CATEGORIES = {
  income: ["Gaji", "Bonus", "Freelance", "Investasi", "Lainnya"],
  expense: ["Makanan", "Transport", "Belanja", "Tagihan", "Hiburan", "Kesehatan", "Lainnya"],
};

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({ income: 0, expense: 0, balance: 0 });
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"income" | "expense">("income");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("Gaji");
  const [formNote, setFormNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function fetchTransactions() {
    try {
      const res = await fetch("/api/transactions");
      const json = await res.json();
      if (json.success) {
        setTransactions(json.data.transactions);
        setSummary(json.data.summary);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      console.error(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formType,
          amount: formAmount,
          category: formCategory,
          note: formNote,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setFormAmount("");
        setFormNote("");
        setShowForm(false);
        fetchTransactions();
      } else {
        alert("Gagal: " + json.error);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      alert("Error: " + msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus transaksi ini?")) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) fetchTransactions();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      console.error(msg);
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const expenseByCategory: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    });

  const topExpenses = Object.entries(expenseByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <p className="text-cyan-400 text-sm font-bold tracking-widest mb-2">
                KEUANGAN
              </p>
              <h1 className="text-4xl font-bold text-white mb-2">
                Kelola Keuanganmu
              </h1>
              <p className="text-slate-400">
                Catat pemasukan dan pengeluaran, lihat saldo real-time.
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition"
            >
              {showForm ? "Tutup" : "+ Transaksi Baru"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 backdrop-blur rounded-2xl p-6 border border-cyan-500/30">
              <p className="text-slate-300 text-sm mb-2">Saldo</p>
              <p className="text-3xl md:text-4xl font-bold text-white">
                {formatCurrency(summary.balance)}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                {transactions.length} transaksi
              </p>
            </div>

            <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-green-500/20">
              <div className="flex justify-between items-start mb-2">
                <p className="text-slate-400 text-sm">Pemasukan</p>
                <span className="text-xl">💰</span>
              </div>
              <p className="text-3xl font-bold text-green-400">
                {formatCurrency(summary.income)}
              </p>
            </div>

            <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-red-500/20">
              <div className="flex justify-between items-start mb-2">
                <p className="text-slate-400 text-sm">Pengeluaran</p>
                <span className="text-xl">💸</span>
              </div>
              <p className="text-3xl font-bold text-red-400">
                {formatCurrency(summary.expense)}
              </p>
            </div>
          </div>

          {showForm && (
            <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-cyan-500/20 mb-8">
              <h3 className="text-xl font-bold mb-4">Tambah Transaksi</h3>

              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setFormType("income");
                    setFormCategory(CATEGORIES.income[0]);
                  }}
                  className={`flex-1 py-3 rounded-xl font-bold transition ${
                    formType === "income"
                      ? "bg-green-500 text-white"
                      : "bg-slate-900/50 text-slate-400 hover:bg-slate-900"
                  }`}
                >
                  💰 Pemasukan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormType("expense");
                    setFormCategory(CATEGORIES.expense[0]);
                  }}
                  className={`flex-1 py-3 rounded-xl font-bold transition ${
                    formType === "expense"
                      ? "bg-red-500 text-white"
                      : "bg-slate-900/50 text-slate-400 hover:bg-slate-900"
                  }`}
                >
                  💸 Pengeluaran
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-cyan-300 mb-2 font-semibold text-sm">
                      Jumlah (Rp)
                    </label>
                    <input
                      type="number"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      required
                      min="1"
                      placeholder="500000"
                      className="w-full bg-slate-900/80 text-white rounded-xl p-3 border border-slate-700 focus:border-cyan-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-cyan-300 mb-2 font-semibold text-sm">
                      Kategori
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-slate-900/80 text-white rounded-xl p-3 border border-slate-700 focus:border-cyan-500 outline-none"
                    >
                      {CATEGORIES[formType].map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-cyan-300 mb-2 font-semibold text-sm">
                    Catatan (opsional)
                  </label>
                  <input
                    type="text"
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    placeholder="Gaji bulan September..."
                    className="w-full bg-slate-900/80 text-white rounded-xl p-3 border border-slate-700 focus:border-cyan-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition"
                >
                  {submitting ? "Menyimpan..." : "Simpan Transaksi"}
                </button>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-cyan-500/20">
              <h3 className="text-xl font-bold mb-4">Riwayat Transaksi</h3>

              {loading ? (
                <p className="text-slate-400 text-center py-8">Loading...</p>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-slate-400 mb-4">Belum ada transaksi</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition"
                  >
                    Catat Transaksi Pertama
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-4 bg-slate-900/50 rounded-xl p-4 hover:bg-slate-900/70 transition group"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                          t.type === "income"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {t.type === "income" ? "💰" : "💸"}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white">{t.category}</p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              t.type === "income"
                                ? "bg-green-500/20 text-green-300"
                                : "bg-red-500/20 text-red-300"
                            }`}
                          >
                            {t.type === "income" ? "Masuk" : "Keluar"}
                          </span>
                        </div>
                        {t.note && (
                          <p className="text-sm text-slate-400 truncate">{t.note}</p>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDate(t.date)}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p
                          className={`font-bold ${
                            t.type === "income" ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {t.type === "income" ? "+" : "-"}
                          {formatCurrency(t.amount)}
                        </p>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="text-xs text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-cyan-500/20">
              <p className="text-cyan-400 text-xs font-bold tracking-widest mb-2">
                TOP EXPENSES
              </p>
              <h3 className="text-xl font-bold mb-4">Pengeluaran Terbesar</h3>

              {topExpenses.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">
                  Belum ada pengeluaran
                </p>
              ) : (
                <div className="space-y-4">
                  {topExpenses.map(([cat, amount], i) => {
                    const maxAmount = topExpenses[0][1];
                    const percent = (amount / maxAmount) * 100;
                    return (
                      <div key={i}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-slate-300">{cat}</span>
                          <span className="text-sm font-bold text-white">
                            {formatCurrency(amount)}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-900/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-500 to-pink-500 transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}