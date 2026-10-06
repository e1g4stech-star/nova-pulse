"use client";

import type { AffiliateLink } from "@/app/affiliate/page";

interface Props {
  links: AffiliateLink[];
  loading: boolean;
}

export default function EarningsChart({ links, loading }: Props) {
  // Group earnings + clicks per bulan (6 bulan terakhir)
  const months: { label: string; earnings: number; clicks: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
    months.push({ label, earnings: 0, clicks: 0 });
  }

  // Karena tiap link hanya punya total clicks/earnings (bukan per bulan),
  // kita aproksimasi: bagi rata berdasarkan createdAt link
  links.forEach((link) => {
    const created = new Date(link.createdAt);
    const monthIdx = months.findIndex((m) => {
      const [mon] = m.label.split(" ");
      return m.label ===
        new Date(created.getFullYear(), created.getMonth(), 1).toLocaleDateString("id-ID", {
          month: "short",
          year: "2-digit",
        });
    });
    if (monthIdx >= 0) {
      months[monthIdx].earnings += link.earnings || 0;
      months[monthIdx].clicks += link.clicks || 0;
    } else {
      // fallback: assign ke bulan terakhir
      months[months.length - 1].earnings += link.earnings || 0;
      months[months.length - 1].clicks += link.clicks || 0;
    }
  });

  const maxEarnings = Math.max(...months.map((m) => m.earnings), 1);
  const maxClicks = Math.max(...months.map((m) => m.clicks), 1);
  const maxVal = Math.max(maxEarnings, maxClicks);

  return (
    <div
      className="p-5 rounded-xl border"
      style={{
        background: "var(--theme-card-bg)",
        borderColor: "var(--theme-border)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-sm" style={{ color: "var(--theme-text-primary)" }}>
            📈 Trend 6 Bulan Terakhir
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--theme-text-muted)" }}>
            Clicks & earnings per bulan
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: "var(--accent-color)" }}
            />
            <span style={{ color: "var(--theme-text-muted)" }}>Earnings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: "#22c55e" }}
            />
            <span style={{ color: "var(--theme-text-muted)" }}>Clicks</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center" style={{ color: "var(--theme-text-muted)" }}>
          Memuat chart...
        </div>
      ) : (
        <div className="flex items-end justify-between gap-3 h-40 relative">
          {/* Y-axis grid */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="border-t"
                style={{ borderColor: "var(--theme-border)", opacity: 0.4 }}
              />
            ))}
          </div>

          {months.map((m, idx) => {
            const earnH = maxVal > 0 ? (m.earnings / maxVal) * 100 : 0;
            const clickH = maxVal > 0 ? (m.clicks / maxVal) * 100 : 0;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 relative z-10">
                <div className="w-full flex items-end justify-center gap-0.5 h-32">
                  <div
                    className="w-1/2 rounded-t transition-all"
                    style={{
                      height: `${Math.max(earnH, 2)}%`,
                      background: "var(--accent-color)",
                      minHeight: m.earnings > 0 ? "4px" : "2px",
                    }}
                    title={`Earnings: Rp ${m.earnings.toLocaleString("id-ID")}`}
                  />
                  <div
                    className="w-1/2 rounded-t transition-all"
                    style={{
                      height: `${Math.max(clickH, 2)}%`,
                      background: "#22c55e",
                      minHeight: m.clicks > 0 ? "4px" : "2px",
                    }}
                    title={`Clicks: ${m.clicks}`}
                  />
                </div>
                <div className="text-[10px]" style={{ color: "var(--theme-text-muted)" }}>
                  {m.label}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
