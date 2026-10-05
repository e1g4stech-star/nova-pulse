'use client';

import type { AffiliateLink } from '@/app/affiliate/page';

interface Props {
  links: AffiliateLink[];
  loading: boolean;
}

export default function AffiliateStats({ links, loading }: Props) {
  const totalLinks = links.length;
  const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);
  const totalConversions = links.reduce((sum, l) => sum + (l.conversions || 0), 0);
  const totalEarnings = links.reduce((sum, l) => sum + (l.earnings || 0), 0);
  const activeLinks = links.filter((l) => l.isActive).length;

  const topLink = [...links].sort((a, b) => (b.clicks || 0) - (a.clicks || 0))[0];

  const formatRupiah = (n: number) => {
    return 'Rp ' + n.toLocaleString('id-ID');
  };

  const cards = [
    {
      label: 'Total Links',
      value: totalLinks.toString(),
      sub: activeLinks + ' aktif',
      icon: '🔗',
      color: 'var(--accent-color)',
    },
    {
      label: 'Total Clicks',
      value: totalClicks.toString(),
      sub: 'sepanjang waktu',
      icon: '👆',
      color: '#22c55e',
    },
    {
      label: 'Conversions',
      value: totalConversions.toString(),
      sub: totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) + '% rate' : '0% rate',
      icon: '🎯',
      color: '#a78bfa',
    },
    {
      label: 'Total Earnings',
      value: formatRupiah(totalEarnings),
      sub: 'estimasi',
      icon: '💰',
      color: '#eab308',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl border"
            style={{
              background: 'var(--theme-card-bg)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{card.icon}</span>
            </div>
            <div
              className="font-bold text-2xl truncate"
              style={{ color: loading ? 'var(--theme-text-muted)' : card.color }}
            >
              {loading ? '...' : card.value}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>
              {card.label}
            </div>
            {card.sub && !loading && (
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--theme-text-muted)', opacity: 0.7 }}>
                {card.sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {topLink && !loading && topLink.clicks > 0 && (
        <div
          className="p-3 rounded-xl border flex items-center gap-3"
          style={{
            background: 'var(--accent-soft)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <span className="text-2xl">🏆</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
              Top Performing Link
            </div>
            <div className="text-sm font-medium truncate" style={{ color: 'var(--theme-text-primary)' }}>
              {topLink.title}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-lg font-bold" style={{ color: 'var(--accent-color)' }}>
              {topLink.clicks}
            </div>
            <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              clicks
            </div>
          </div>
        </div>
      )}
    </div>
  );
}