"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { PLANS, PLAN_LIST, formatPrice, type PlanId } from "@/lib/plans";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <>
      <Navbar />
      <main
        className="min-h-screen"
        style={{ background: "var(--theme-bg-primary)", color: "var(--theme-text-primary)" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-16 space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <div
              className="inline-block text-xs font-bold tracking-widest px-3 py-1 rounded-full"
              style={{ background: "var(--accent-soft)", color: "var(--accent-color)" }}
            >
              PRICING
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">
              Pilih Plan Sesuai{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                Kebutuhanmu
              </span>
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--theme-text-secondary)" }}>
              Mulai gratis, upgrade kapan saja. Tidak ada kontrak, bisa cancel kapan pun.
            </p>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setBillingCycle("monthly")}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition"
              style={{
                background: billingCycle === "monthly" ? "var(--accent-color)" : "var(--theme-bg-tertiary)",
                color: billingCycle === "monthly" ? "var(--theme-bg-primary)" : "var(--theme-text-secondary)",
              }}
            >
              Bulanan
            </button>
            <div className="relative">
              <button
                onClick={() => setBillingCycle("yearly")}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition"
                style={{
                  background: billingCycle === "yearly" ? "var(--accent-color)" : "var(--theme-bg-tertiary)",
                  color: billingCycle === "yearly" ? "var(--theme-bg-primary)" : "var(--theme-text-secondary)",
                }}
              >
                Tahunan
              </button>
              <span
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                style={{ background: "#22c55e", color: "white" }}
              >
                HEMAT 2 BULAN
              </span>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {PLAN_LIST.map((plan) => {
              const isHighlight = plan.highlight;
              const price = billingCycle === "monthly" ? plan.price : Math.round(plan.priceYearly / 12);
              const totalPrice = billingCycle === "monthly" ? plan.price : plan.priceYearly;

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-6 relative transition-all hover:scale-[1.02] ${
                    isHighlight ? "md:-mt-4 md:mb-4" : ""
                  }`}
                  style={{
                    background: isHighlight ? "var(--accent-soft)" : "var(--theme-card-bg)",
                    borderColor: isHighlight ? "var(--accent-color)" : "var(--theme-border)",
                    borderWidth: isHighlight ? "2px" : "1px",
                  }}
                >
                  {plan.badge && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-widest px-3 py-1 rounded-full"
                      style={{ background: "linear-gradient(to right, var(--accent-color), #a855f7)", color: "white" }}
                    >
                      {plan.badge}
                    </div>
                  )}

                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-xs mb-6" style={{ color: "var(--theme-text-muted)" }}>
                    {plan.description}
                  </p>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span
                        className="text-3xl font-bold"
                        style={{ color: isHighlight ? "var(--accent-color)" : "var(--theme-text-primary)" }}
                      >
                        {formatPrice(price)}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
                          /bulan
                        </span>
                      )}
                    </div>
                    {billingCycle === "yearly" && plan.price > 0 && (
                      <div className="text-xs mt-1" style={{ color: "var(--theme-text-muted)" }}>
                        Dibayar {formatPrice(totalPrice)} / tahun
                      </div>
                    )}
                  </div>

                  {plan.id === "free" ? (
                    <Link
                      href="/dashboard"
                      className="block w-full text-center py-3 rounded-xl font-semibold text-sm transition mb-6"
                      style={{ background: "var(--theme-bg-tertiary)", color: "var(--theme-text-primary)" }}
                    >
                      Mulai Gratis
                    </Link>
                  ) : (
                    <Link
                      href={`/billing?plan=${plan.id}&cycle=${billingCycle}`}
                      className="block w-full text-center py-3 rounded-xl font-bold text-sm transition mb-6 hover:scale-[1.02]"
                      style={{
                        background: isHighlight
                          ? "linear-gradient(to right, var(--accent-color), #a855f7)"
                          : "var(--theme-bg-tertiary)",
                        color: isHighlight ? "white" : "var(--theme-text-primary)",
                      }}
                    >
                      Upgrade ke {plan.name}
                    </Link>
                  )}

                  <ul className="space-y-2.5">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span
                          className="shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                          style={{ background: "var(--accent-soft)", color: "var(--accent-color)" }}
                        >
                          ✓
                        </span>
                        <span style={{ color: "var(--theme-text-secondary)" }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* FAQ */}
          <div className="pt-12 space-y-6">
            <h2 className="text-2xl font-bold text-center">Pertanyaan Umum</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {[
                { q: "Bisa cancel kapan saja?", a: "Ya, kamu bisa cancel kapan saja. Akses tetap aktif sampai akhir periode." },
                { q: "Metode pembayaran apa?", a: "QRIS, transfer bank, GoPay, OVO, Dana, ShopeePay via Midtrans." },
                { q: "Ada free trial Pro?", a: "Free tier sudah cukup untuk coba semua fitur dasar. Upgrade kapan saja." },
                { q: "Diskon tahunan berapa?", a: "Bayar tahunan hemat 2 bulan (setara 17% diskon)." },
              ].map((faq, i) => (
                <div
                  key={i}
                  className="rounded-xl border p-4"
                  style={{ background: "var(--theme-card-bg)", borderColor: "var(--theme-border)" }}
                >
                  <div className="font-semibold mb-1">{faq.q}</div>
                  <div className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
                    {faq.a}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center pt-8">
            <p className="text-sm mb-4" style={{ color: "var(--theme-text-muted)" }}>
              Masih ragu? Coba Free dulu — upgrade kapan saja.
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-8 py-3 rounded-xl font-bold text-sm transition hover:scale-105"
              style={{ background: "linear-gradient(to right, var(--accent-color), #a855f7)", color: "white" }}
            >
              Mulai Gratis Sekarang
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}