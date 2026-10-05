'use client';

import { useState } from 'react';
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
    if (typeof window !== 'undefined') {
      return window.location.origin + '/r/' + slug;
    }
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

  const filteredLinks = links.filter((l) => {
    if (filter === 'active') return l.isActive;
    if (filter === 'inactive') return !l.isActive;
    return true;
  });

  if (loading) {
    return (
      <div
        className="rounded-xl border p-12 text-center"
        style={{
          background: 'var(--theme-card-bg)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text-muted)',
        }}
      >
        Memuat link...
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div
        className="rounded-xl border p-12 text-center"
        style={{
          background: 'var(--theme-card-bg)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="text-4xl mb-3">🔗</div>
        <div className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
          Belum ada link affiliate
        </div>
        <div className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
          Klik "+ Link Baru" untuk memulai
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium" style={{ color: 'var(--theme-text-muted)' }}>
          Filter:
        </span>
        {(['all', 'active', 'inactive'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="text-xs px-3 py-1 rounded-lg transition capitalize"
            style={{
              background: filter === f ? 'var(--accent-color)' : 'var(--theme-bg-tertiary)',
              color: filter === f ? 'var(--theme-bg-primary)' : 'var(--theme-text-secondary)',
            }}
          >
            {f === 'all' ? 'Semua' : f === 'active' ? 'Aktif' : 'Nonaktif'}
          </button>
        ))}
        <span className="text-xs ml-auto" style={{ color: 'var(--theme-text-muted)' }}>
          {filteredLinks.length} link
        </span>
      </div>

      {/* Table */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          background: 'var(--theme-card-bg)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--theme-border)' }}>
                {['Link', 'Tracking URL', 'Clicks', 'Rate', 'Status', 'Aksi'].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLinks.map((link) => (
                <tr
                  key={link.id}
                  className="transition-colors"
                  style={{ borderBottom: '1px solid var(--theme-border)' }}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                      {link.title}
                    </div>
                    {link.category && (
                      <div className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                        {link.category}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs truncate max-w-[140px] font-mono"
                        style={{ color: 'var(--theme-text-secondary)' }}
                        title={getTrackingUrl(link.slug)}
                      >
                        /r/{link.slug}
                      </span>
                      <button
                        onClick={() => handleCopy(link)}
                        className="text-xs px-2 py-1 rounded transition shrink-0"
                        style={{
                          background: copiedId === link.id ? 'rgba(34,197,94,0.2)' : 'var(--theme-bg-tertiary)',
                          color: copiedId === link.id ? '#4ade80' : 'var(--theme-text-muted)',
                        }}
                        title="Copy tracking URL"
                      >
                        {copiedId === link.id ? '✓' : '📋'}
                      </button>
                    </div>
                    <div
                      className="text-[10px] mt-0.5 truncate max-w-[180px]"
                      style={{ color: 'var(--theme-text-muted)' }}
                      title={link.affiliateUrl}
                    >
                      → {link.affiliateUrl}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold" style={{ color: 'var(--accent-color)' }}>
                      {link.clicks || 0}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
                      {link.commissionPct ? link.commissionPct + '%' : '-'}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(link)}
                      className="text-xs px-2 py-1 rounded transition"
                      style={{
                        background: link.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(107,114,128,0.15)',
                        color: link.isActive ? '#4ade80' : '#9ca3af',
                      }}
                      title={link.isActive ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                    >
                      {link.isActive ? '● Aktif' : '○ Off'}
                    </button>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(link)}
                        className="text-xs px-2 py-1 rounded transition"
                        style={{
                          background: 'var(--accent-soft)',
                          color: 'var(--accent-color)',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(link)}
                        disabled={deletingId === link.id}
                        className="text-xs px-2 py-1 rounded transition disabled:opacity-50"
                        style={{
                          background: 'rgba(239,68,68,0.1)',
                          color: '#fca5a5',
                        }}
                      >
                        {deletingId === link.id ? '...' : 'Hapus'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}