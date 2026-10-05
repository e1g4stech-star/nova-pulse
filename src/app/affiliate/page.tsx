'use client';

import { useEffect, useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import AffiliateStats from '@/components/affiliate/AffiliateStats';
import AffiliateTable from '@/components/affiliate/AffiliateTable';
import AffiliateForm from '@/components/affiliate/AffiliateForm';

export interface AffiliateLink {
  id: string;
  userId: string;
  slug: string;
  title: string;
  description: string | null;
  affiliateUrl: string;
  commission: number;
  commissionPct: number;
  category: string;
  isActive: boolean;
  clicks: number;
  conversions: number;
  earnings: number;
  createdAt: string;
  updatedAt: string;
}

export default function AffiliatePage() {
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AffiliateLink | null>(null);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/affiliate', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setLinks(data.links || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  return (
    <>
      <Navbar />
      <main
        className="min-h-screen"
        style={{ background: 'var(--theme-bg-primary)', color: 'var(--theme-text-primary)' }}
      >
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">Affiliate Manager</h1>
              <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                Kelola link affiliate dan track clicks
              </p>
            </div>
            <button
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
              style={{ background: 'var(--accent-color)', color: 'var(--theme-bg-primary)' }}
            >
              + Link Baru
            </button>
          </div>

          {error && (
            <div
              className="text-sm px-4 py-3 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}
            >
              {error}
            </div>
          )}

          <AffiliateStats links={links} loading={loading} />

          <AffiliateTable
            links={links}
            loading={loading}
            onEdit={(l) => { setEditing(l); setShowForm(true); }}
            onDeleted={fetchLinks}
          />
        </div>

        {showForm && (
          <AffiliateForm
            editing={editing}
            onClose={() => { setShowForm(false); setEditing(null); }}
            onSuccess={() => { setShowForm(false); setEditing(null); fetchLinks(); }}
          />
        )}
      </main>
    </>
  );
}