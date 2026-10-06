'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { AffiliateLink } from '@/app/affiliate/page';

interface Props {
  links: AffiliateLink[];
  loading: boolean;
  onEdit: (link: AffiliateLink) => void;
  onDeleted: () => void;
}

export default function AffiliateTable({ links, loading, onEdit, onDeleted }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'created' | 'clicks' | 'earnings' | 'name'>('created');

  const handleDelete = async (link: AffiliateLink) => {
    if (!confirm('Hapus link "' + link.title + '"?')) return;
    setDeletingId(link.id);
    try {
      const res = await fetch('/api/affiliate/' + link.id, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      onDeleted();
    } catch (err) {
      alert('Gagal hapus: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setDeletingId(null);
    }
  };

  const getTrackingUrl = (slug: string) => {
    if (typeof window !== 'undefined') return window.location.origin + '/r/' + slug;
    return '/r/' + slug;
  };

  const handleCopy = async (link: AffiliateLink) => {
    const url = getTrackingUrl(link.slug);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      prompt('Copy manual:', url);
    }
  };

  const handleToggleActive = async (link: AffiliateLink) => {
    try {
      const res = await fetch('/api/affiliate/' + link.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !link.isActive }),
      });
      if (!res.ok) throw new Error('Failed');
      onDeleted();
    } catch (err) {
      alert('Gagal update: ' + (err instanceof Error ? err.message : 'Unknown'));
    }
  };

  const filteredLinks = useMemo(() => {
    const filtered = links.filter((l) => {
      if (filter === 'active') return l.isActive;
      if (filter === 'inactive') return !l.isActive;
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (sortBy === 'clicks') return (b.clicks || 0) - (a.clicks || 0);
      if (sortBy === 'earnings') return (b.earnings || 0) - (a.earnings || 0);
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [links, filter, sortBy]);

  if (loading) {
    return (
      <div className="rounded-xl border p-12 text-center"
        style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
        Memuat link...
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="rounded-xl border p-12 text-center"
        style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border)' }}>
        <div className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>Belum ada link affiliate</div>
        <div className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>Klik "+ Link Baru" untuk memulai</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium" style={{ color: 'var(--theme-text-muted)' }}>Filter:</span>
        {(['all', 'active', 'inactive'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="text-xs px-3 py-1 rounded-lg transition capitalize"
            style={{
              background: filter === f ? 'var(--accent-color)' : 'var(--theme-bg-tertiary)',
              color: filter === f ? 'var(--theme-bg-primary)' : 'var(--theme-text-secondary)',
            }}>
            {f === 'all' ? 'Semua' : f === 'active' ? 'Aktif' : 'Nonaktif'}
          </button>
        ))}

        <span className="text-xs font-medium ml-3" style={{ color: 'var(--theme-text-muted)' }}>Sort:</span>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
          className="text-xs px-2 py-1 rounded-lg border outline-none"
          style={{ background: 'var(--theme-bg-tertiary)', color: 'var(--theme-text-secondary)', borderColor: 'var(--theme-border)' }}>
          <option value="created">Terbaru</option>
          <option value="clicks">Clicks Terbanyak</option>
          <option value="earnings">Earnings Terbesar</option>
          <option value="name">Nama A-Z</option>
        </select>

        <span className="text-xs ml-auto" style={{ color: 'var(--theme-text-muted)' }}>{filteredLinks.length} link</span>
      </div>

      <div className="rounded-xl border overflow-hidden"
        style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--theme-border)' }}>
                {['Link', 'Tracking URL', 'Clicks', 'Conv', 'Rate', 'Earnings', 'Status', 'Aksi'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold uppercase tracking-wider px-3 py-3"
                    style={{ color: 'var(--theme-text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLinks.map((link) => {
                const convRate = link.clicks > 0 ? ((link.conversions || 0) / link.clicks) * 100 : 0;
                return (
                  <tr key={link.id} className="transition-colors" style={{ borderBottom: '1px solid var(--theme-border)' }}>
                    <td className="px-3 py-3">
                      <Link href={'/affiliate/' + link.id} className="font-medium text-sm hover:underline"
                        style={{ color: 'var(--accent-color)' }}>
                        {link.title}
                      </Link>
                      {link.category && (
                        <div className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{link.category}</div>
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs truncate max-w-[120px] font-mono"
                          style={{ color: 'var(--theme-text-secondary)' }}>
                          /r/{link.slug}
                        </span>
                        <button onClick={() => handleCopy(link)}
                          className="text-xs px-2 py-0.5 rounded transition shrink-0"
                          style={{
                            background: copiedId === link.id ? 'rgba(34,197,94,0.2)' : 'var(--theme-bg-tertiary)',
                            color: copiedId === link.id ? '#4ade80' : 'var(--theme-text-muted)',
                          }}>
                          {copiedId === link.id ? 'OK' : 'Copy'}
                        </button>
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <span className="text-sm font-semibold" style={{ color: 'var(--accent-color)' }}>
                        {link.clicks || 0}
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      <span className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
                        {link.conversions || 0}
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      <span className="text-sm" style={{ color: '#22c55e' }}>
                        {convRate.toFixed(1)}%
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      <span className="text-sm" style={{ color: '#eab308' }}>
                        Rp {(link.earnings || 0).toLocaleString('id-ID')}
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      <button onClick={() => handleToggleActive(link)}
                        className="text-xs px-2 py-1 rounded transition"
                        style={{
                          background: link.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(107,114,128,0.15)',
                          color: link.isActive ? '#4ade80' : '#9ca3af',
                        }}>
                        {link.isActive ? '● Aktif' : '○ Off'}
                      </button>
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => onEdit(link)}
                          className="text-xs px-2 py-1 rounded transition"
                          style={{ background: 'var(--accent-soft)', color: 'var(--accent-color)' }}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(link)} disabled={deletingId === link.id}
                          className="text-xs px-2 py-1 rounded transition disabled:opacity-50"
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>
                          {deletingId === link.id ? '...' : 'Hapus'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
