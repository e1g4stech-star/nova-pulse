"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function AffiliateDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch("/api/affiliate/" + id + "/stats")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Link href="/affiliate" className="text-sm" style={{ color: "var(--accent-color)" }}>
        ← Kembali ke Affiliate Manager
      </Link>

      {loading ? (
        <div style={{ color: "var(--theme-text-muted)" }}>Memuat...</div>
      ) : !data || data.error ? (
        <div style={{ color: "#fca5a5" }}>Link tidak ditemukan</div>
      ) : (
        <>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--theme-text-primary)" }}>
              {data.link.title}
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--theme-text-muted)" }}>
              /r/{data.link.slug}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Clicks", value: data.stats.totalClicks, color: "var(--accent-color)" },
              { label: "Conversions", value: data.stats.totalConversions, color: "#a78bfa" },
              { label: "Conversion Rate", value: data.stats.conversionRate.toFixed(1) + "%", color: "#22c55e" },
              { label: "Earnings", value: "Rp " + data.stats.totalEarnings.toLocaleString("id-ID"), color: "#eab308" },
            ].map((c, i) => (
              <div key={i} className="p-4 rounded-xl border" style={{ background: "var(--theme-card-bg)", borderColor: "var(--theme-border)" }}>
                <div className="text-xs" style={{ color: "var(--theme-text-muted)" }}>{c.label}</div>
                <div className="text-xl font-bold mt-1" style={{ color: c.color }}>{c.value}</div>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-xl border" style={{ background: "var(--theme-card-bg)", borderColor: "var(--theme-border)" }}>
            <h2 className="font-bold text-sm mb-3" style={{ color: "var(--theme-text-primary)" }}>
              Clicks Terbaru ({data.recentClicks.length})
            </h2>
            {data.recentClicks.length === 0 ? (
              <div className="text-sm text-center py-4" style={{ color: "var(--theme-text-muted)" }}>
                Belum ada clicks
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--theme-border)" }}>
                    {["Waktu", "Country", "City", "Referer", "Converted"].map((h) => (
                      <th key={h} className="text-left text-xs py-2 px-2" style={{ color: "var(--theme-text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.recentClicks.map((c: any) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid var(--theme-border)" }}>
                      <td className="py-2 px-2" style={{ color: "var(--theme-text-secondary)" }}>
                        {new Date(c.clickedAt).toLocaleString("id-ID")}
                      </td>
                      <td className="py-2 px-2" style={{ color: "var(--theme-text-secondary)" }}>{c.country || "-"}</td>
                      <td className="py-2 px-2" style={{ color: "var(--theme-text-secondary)" }}>{c.city || "-"}</td>
                      <td className="py-2 px-2 truncate max-w-[180px]" style={{ color: "var(--theme-text-muted)" }}>
                        {c.referer || "Direct"}
                      </td>
                      <td className="py-2 px-2">
                        {c.converted ? (
                          <span style={{ color: "#4ade80" }}>Yes</span>
                        ) : (
                          <span style={{ color: "var(--theme-text-muted)" }}>No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
