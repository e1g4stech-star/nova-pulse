"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

type Status = "loading" | "success" | "pending" | "error";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!orderId) {
      setStatus("error");
      return;
    }

    let attempts = 0;
    const maxAttempts = 5;

    const check = async () => {
      try {
        const res = await fetch("/api/billing/status", { cache: "no-store" });
        const data = await res.json();
        if (data.success && Array.isArray(data.subscriptions)) {
          const sub = data.subscriptions.find(
            (s: { midtransOrderId: string | null }) => s.midtransOrderId === orderId
          );
          if (sub) {
            if (sub.status === "active") {
              setStatus("success");
              return;
            }
            if (sub.status === "pending") {
              attempts++;
              if (attempts < maxAttempts) {
                setTimeout(check, 2000);
              } else {
                setStatus("pending");
              }
              return;
            }
            setStatus("error");
            return;
          }
        }
      } catch (err) {
        console.error(err);
      }
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(check, 2000);
      } else {
        setStatus("pending");
      }
    };

    check();
  }, [orderId]);

  return (
    <div
      className="max-w-md w-full rounded-2xl border p-8 text-center space-y-4"
      style={{ background: "var(--theme-card-bg)", borderColor: "var(--theme-border)" }}
    >
      {status === "loading" && (
        <>
          <div className="text-4xl">⏳</div>
          <h1 className="text-xl font-bold">Memproses Pembayaran...</h1>
          <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
            Mohon tunggu sebentar.
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="text-5xl">🎉</div>
          <h1 className="text-2xl font-bold" style={{ color: "#4ade80" }}>
            Pembayaran Sukses!
          </h1>
          <p className="text-sm" style={{ color: "var(--theme-text-secondary)" }}>
            Plan kamu sudah aktif. Selamat menikmati fitur Pro!
          </p>
          <Link
            href="/billing"
            className="inline-block mt-4 px-6 py-2.5 rounded-lg font-bold text-sm"
            style={{
              background: "linear-gradient(to right, var(--accent-color), #a855f7)",
              color: "white",
            }}
          >
            Ke Halaman Billing
          </Link>
        </>
      )}

      {status === "pending" && (
        <>
          <div className="text-5xl">⏰</div>
          <h1 className="text-xl font-bold" style={{ color: "#eab308" }}>
            Menunggu Konfirmasi
          </h1>
          <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
            Pembayaran sedang diproses. Cek email untuk konfirmasi.
          </p>
          <Link
            href="/billing"
            className="inline-block mt-4 px-6 py-2.5 rounded-lg font-bold text-sm"
            style={{ background: "var(--theme-bg-tertiary)", color: "var(--theme-text-primary)" }}
          >
            Kembali ke Billing
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div className="text-5xl">❌</div>
          <h1 className="text-xl font-bold" style={{ color: "#fca5a5" }}>
            Pembayaran Gagal
          </h1>
          <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
            Silakan coba lagi atau hubungi support.
          </p>
          <Link
            href="/billing"
            className="inline-block mt-4 px-6 py-2.5 rounded-lg font-bold text-sm"
            style={{ background: "var(--theme-bg-tertiary)", color: "var(--theme-text-primary)" }}
          >
            Coba Lagi
          </Link>
        </>
      )}

      {orderId && (
        <p className="text-xs pt-4" style={{ color: "var(--theme-text-muted)" }}>
          Order ID: <code className="font-mono">{orderId}</code>
        </p>
      )}
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <>
      <Navbar />
      <main
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: "var(--theme-bg-primary)", color: "var(--theme-text-primary)" }}
      >
        <Suspense
          fallback={
            <div className="text-center">
              <div className="text-4xl">⏳</div>
              <p className="mt-2" style={{ color: "var(--theme-text-muted)" }}>
                Loading...
              </p>
            </div>
          }
        >
          <SuccessContent />
        </Suspense>
      </main>
    </>
  );
}