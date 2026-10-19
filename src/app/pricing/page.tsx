"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { PLANS, PLAN_LIST, formatPrice, type PlanId } from "@/lib/plans";
import { useSearchParams } from "next/navigation";

function PricingContent() {
  const searchParams = useSearchParams();
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    if (searchParams.get("upgrade") === "required") {
      setTimeout(() => {
        alert("Fitur tersebut khusus untuk pengguna Pro/Business. Silakan pilih paket di bawah ini untuk upgrade.");
      }, 500);
    }
  }, [searchParams]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen py-12 px-4" style={{ background: "var(--theme-bg-primary)", color: "var(--theme-text-primary)" }}>
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">
              Pilih Paket Sesuai Kebutuhanmu
            </h1>
            <p className="text-lg" style={{ color: "var(--theme-text-muted)" }}>
              Mulai gratis, upgrade kapan saja. Investasi kecil untuk pertumbuhan konten yang maksimal.
            </p>
          </div>

          {/* Toggle Bulanan / Tahunan */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex p-1 rounded-xl border" style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)" }}>
              <button
                onClick={() => setCycle("monthly")}
                className="px-6 py-2 rounded-lg text-sm font-semibold transition"
                style={{
                  background: cycle === "monthly" ? "var(--accent-color)" : "transparent",
                  color: cycle === "monthly" ? "white" : "var(--theme-text-muted)",
                }}
              >
                Bulanan
              </button>
              <button
                onClick={() => setCycle("yearly")}
                className="px-6 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                style={{
                  background: cycle === "yearly" ? "var(--accent-color)" : "transparent",
                  color: cycle === "yearly" ? "white" : "var(--theme-text-muted)",
                }}
              >
                Tahunan
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20">Hemat 20%</span>
              </button>
            </div>
          </div>

          {/* Grid Kartu Harga */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {PLAN_LIST.map((plan) => {
              const isFree = plan.id === "free";
              const isPro = plan.id === "pro";
              const price = cycle === "monthly" ? plan.price : plan.priceYearly;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border p-6 flex flex-col ${isPro ? "shadow-xl scale-105 z-10" : ""}`}
                  style={{
                    background: "var(--theme-bg-secondary)",
                    borderColor: isPro ? "var(--accent-color)" : "var(--theme-border)",
                  }}
                >
                  {isPro && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-full text-xs font-bold text-white shadow-md" style={{ background: "var(--accent-color)" }}>
                      Paling Populer
                    </div>
                  )}

                  <div className="mb-6">
                    <h2 className="text-xl font-bold mb-2">{plan.name}</h2>
                    <p className="text-sm h-10" style={{ color: "var(--theme-text-muted)" }}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold">
                        {formatPrice(price)}
                      </span>
                      {!isFree && (
                        <span className="text-sm font-medium" style={{ color: "var(--theme-text-muted)" }}>
                          /{cycle === "monthly" ? "bln" : "thn"}
                        </span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span style={{ color: "var(--accent-color)" }}>✓</span>
                        <span style={{ color: feat.includes("Tidak termasuk") ? "var(--theme-text-muted)" : "var(--theme-text-primary)" }}>
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {isFree ? (
                    <Link
                      href="/dashboard"
                      className="w-full py-3 rounded-xl border font-bold text-center transition hover:bg-black/5"
                      style={{ borderColor: "var(--theme-border)" }}
                    >
                      Mulai Gratis
                    </Link>
                  ) : (
                    <Link
                      href={`/billing?plan=${plan.id}&cycle=${cycle}`}
                      className="w-full py-3 rounded-xl font-bold text-center text-white transition hover:opacity-90"
                      style={{
                        background: isPro
                          ? "linear-gradient(to right, var(--accent-color), #a855f7)"
                          : "var(--theme-text-primary)",
                      }}
                    >
                      Pilih {plan.name}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          {/* FAQ atau Footer Note */}
          <div className="mt-16 text-center text-sm" style={{ color: "var(--theme-text-muted)" }}>
            <p>Semua paket termasuk pembaruan gratis dan dukungan komunitas.</p>
            <p className="mt-2">Punya pertanyaan? <Link href="/dashboard" className="underline font-semibold" style={{ color: "var(--accent-color)" }}>Hubungi kami</Link></p>
          </div>
        </div>
      </main>
    </>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Memuat...</div>}>
      <PricingContent />
    </Suspense>
  );
}