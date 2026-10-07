"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { PLANS, type PlanId } from "@/lib/plans";

interface Subscription {
  id: string;
  plan: string;
  status: string;
  price: number;
  currency: string;
  startedAt: string;
  expiresAt: string;
  paidAt: string | null;
  paymentMethod: string | null;
  midtransOrderId: string | null;
  createdAt: string;
}

interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  planExpiresAt: string | null;
  planStartedAt: string | null;
  planPrice: number;
}

function BillingContent() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan") as PlanId | null;
  const cycleParam = (searchParams.get("cycle") as "monthly" | "yearly" | null) || "monthly";
  const statusParam = searchParams.get("status");

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [meRes, subsRes] = await Promise.all([
          fetch("/api/auth/me").then((r) => r.json()),
          fetch("/api/billing/status").then((r) => r.json()),
        ]);
        if (meRes.success) setUser(meRes.user || meRes.data);
        if (subsRes.success) setSubs(subsRes.subscriptions || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (statusParam === "error") setMessage({ type: "error", text: "Pembayaran gagal atau dibatalkan." });
    else if (statusParam === "pending") setMessage({ type: "info", text: "Pembayaran sedang diproses." });
  }, [statusParam]);

  async function handleCheckout(plan: PlanId, cycle: "monthly" | "yearly") {
    setProcessing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, cycle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal checkout");

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setMessage({ type: "success", text: "Checkout berhasil! Lanjut ke pembayaran." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setProcessing(false);
    }
  }

  const currentPlanId = (user?.plan || "free") as PlanId;
  const currentPlan = PLANS[currentPlanId] || PLANS.free;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-sm mt-1" style={{ color: "var(--theme-text-muted)" }}>
            Kelola langganan dan riwayat pembayaran
          </p>
        </div>
        <Link
          href="/pricing"
          className="px-4 py-2 rounded-lg text-sm font-semibold transition"
          style={{ background: "var(--accent-soft)", color: "var(--accent-color)" }}
        >
          Lihat Semua Plan
        </Link>
      </div>

      {message && (
        <div
          className="px-4 py-3 rounded-xl text-sm"
          style={{
            background:
              message.type === "success"
                ? "rgba(34,197,94,0.1)"
                : message.type === "error"
                ? "rgba(239,68,68,0.1)"
                : "var(--accent-soft)",
            border: `1px solid ${
              message.type === "success"
                ? "rgba(34,197,94,0.3)"
                : message.type === "error"
                ? "rgba(239,68,68,0.3)"
                : "var(--accent-color)"
            }`,
            color:
              message.type === "success"
                ? "#4ade80"
                : message.type === "error"
                ? "#fca5a5"
                : "var(--accent-color)",
          }}
        >
          {message.text}
        </div>
      )}

      {!loading && user && (
        <div
          className="rounded-2xl border p-6"
          style={{ background: "var(--theme-card-bg)", borderColor: "var(--theme-border)" }}
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: "var(--theme-text-muted)" }}>
                Plan Aktif
              </div>
              <div className="text-2xl font-bold">{currentPlan.name}</div>
              <div className="text-sm mt-1" style={{ color: "var(--theme-text-secondary)" }}>
                {user.planPrice > 0 ? `Rp ${user.planPrice.toLocaleString("id-ID")}` : "Gratis"}
                {user.planExpiresAt && (
                  <> · Berlaku sampai {new Date(user.planExpiresAt).toLocaleDateString("id-ID")}</>
                )}
              </div>
            </div>
            {currentPlan.id !== "business" && (
              <button
                onClick={() => handleCheckout(currentPlan.id === "free" ? "pro" : "business", "monthly")}
                disabled={processing}
                className="px-5 py-2.5 rounded-lg font-bold text-sm transition hover:scale-105 disabled:opacity-50"
                style={{
                  background: "linear-gradient(to right, var(--accent-color), #a855f7)",
                  color: "white",
                }}
              >
                {processing ? "Memproses..." : currentPlan.id === "free" ? "Upgrade ke Pro" : "Upgrade ke Business"}
              </button>
            )}
          </div>

          <ul className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
            {currentPlan.features.slice(0, 6).map((f, i) => (
              <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: "var(--theme-text-muted)" }}>
                <span style={{ color: "var(--accent-color)" }}>✓</span> {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && user && currentPlan.id !== "business" && (
        <div>
          <h2 className="text-lg font-bold mb-3">Upgrade Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(["pro", "business"] as PlanId[])
              .filter((p) => p !== currentPlan.id)
              .map((planId) => {
                const plan = PLANS[planId];
                return (
                  <div
                    key={planId}
                    className="rounded-2xl border p-5"
                    style={{ background: "var(--theme-card-bg)", borderColor: "var(--theme-border)" }}
                  >
                    <div className="font-bold text-lg">{plan.name}</div>
                    <div className="text-xs mb-3" style={{ color: "var(--theme-text-muted)" }}>{plan.description}</div>

                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-2xl font-bold" style={{ color: "var(--accent-color)" }}>
                        Rp {plan.price.toLocaleString("id-ID")}
                      </span>
                      <span className="text-xs" style={{ color: "var(--theme-text-muted)" }}>/bulan</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCheckout(planId, "monthly")}
                        disabled={processing}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                        style={{ background: "var(--accent-color)", color: "var(--theme-bg-primary)" }}
                      >
                        Bulanan
                      </button>
                      <button
                        onClick={() => handleCheckout(planId, "yearly")}
                        disabled={processing}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                        style={{ background: "var(--theme-bg-tertiary)", color: "var(--theme-text-primary)" }}
                      >
                        Tahunan (hemat 17%)
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold mb-3">Riwayat Pembayaran</h2>
        {loading ? (
          <div className="text-sm" style={{ color: "var(--theme-text-muted)" }}>Memuat...</div>
        ) : subs.length === 0 ? (
          <div
            className="rounded-xl border p-8 text-center"
            style={{ background: "var(--theme-card-bg)", borderColor: "var(--theme-border)" }}
          >
            <div className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
              Belum ada transaksi. Upgrade untuk mulai berlangganan.
            </div>
          </div>
        ) : (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ background: "var(--theme-card-bg)", borderColor: "var(--theme-border)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--theme-border)" }}>
                  {["Tanggal", "Plan", "Amount", "Status", "Metode", "Order ID"].map((h) => (
                    <th key={h} className="text-left text-xs py-2 px-3 font-semibold uppercase" style={{ color: "var(--theme-text-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid var(--theme-border)" }}>
                    <td className="py-2 px-3" style={{ color: "var(--theme-text-secondary)" }}>
                      {new Date(s.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="py-2 px-3 capitalize" style={{ color: "var(--theme-text-primary)" }}>{s.plan}</td>
                    <td className="py-2 px-3" style={{ color: "var(--theme-text-primary)" }}>
                      Rp {s.price.toLocaleString("id-ID")}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          background:
                            s.status === "active"
                              ? "rgba(34,197,94,0.15)"
                              : s.status === "pending"
                              ? "rgba(234,179,8,0.15)"
                              : "rgba(239,68,68,0.15)",
                          color:
                            s.status === "active"
                              ? "#4ade80"
                              : s.status === "pending"
                              ? "#eab308"
                              : "#fca5a5",
                        }}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-xs" style={{ color: "var(--theme-text-muted)" }}>
                      {s.paymentMethod || "-"}
                    </td>
                    <td className="py-2 px-3 text-xs font-mono" style={{ color: "var(--theme-text-muted)" }}>
                      {s.midtransOrderId || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <>
      <Navbar />
      <main
        className="min-h-screen"
        style={{ background: "var(--theme-bg-primary)", color: "var(--theme-text-primary)" }}
      >
        <Suspense fallback={<div className="p-10 text-center" style={{ color: "var(--theme-text-muted)" }}>Loading...</div>}>
          <BillingContent />
        </Suspense>
      </main>
    </>
  );
}