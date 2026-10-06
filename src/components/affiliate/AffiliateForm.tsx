'use client';

import { useState } from 'react';
import type { AffiliateLink } from '@/app/affiliate/page';

interface Props {
  editing: AffiliateLink | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { value: 'umum', label: 'Umum' },
  { value: 'skincare', label: 'Skincare' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'elektronik', label: 'Elektronik' },
  { value: 'kesehatan', label: 'Kesehatan' },
  { value: 'makanan', label: 'Makanan' },
  { value: 'digital', label: 'Digital Product' },
];

export default function AffiliateForm({ editing, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState(editing?.title || '');
  const [affiliateUrl, setAffiliateUrl] = useState(editing?.affiliateUrl || '');
  const [description, setDescription] = useState(editing?.description || '');
  const [category, setCategory] = useState(editing?.category || 'umum');
  const [commissionPct, setCommissionPct] = useState(
    editing?.commissionPct?.toString() || '5'
  );
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload: any = {
        title: title.trim(),
        affiliateUrl: affiliateUrl.trim(),
        description: description.trim() || null,
        category,
        commissionPct: parseFloat(commissionPct) || 0,
        isActive,
      };

      const url = editing ? '/api/affiliate/' + editing.id : '/api/affiliate';
      const method = editing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan');

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    background: 'var(--theme-bg-tertiary)',
    borderColor: 'var(--theme-border)',
    color: 'var(--theme-text-primary)',
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl shadow-2xl"
        style={{
          background: 'var(--theme-bg-secondary)',
          border: '1px solid var(--theme-border)',
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--theme-border)' }}
        >
          <h2 className="text-lg font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            {editing ? 'âœï¸ Edit Link' : ' Link Baru'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xl leading-none"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div
              className="text-sm px-3 py-2 rounded-lg"
              style={{
                background: 'rgba(239,68,68,0.1)',
                color: '#fca5a5',
                border: '1px solid rgba(239,68,68,0.3)',
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>
              Judul Link <span style={{ color: '#f87171' }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Shopee Skincare Launch"
              className="w-full text-sm rounded-lg border px-3 py-2 outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>
              Affiliate URL <span style={{ color: '#f87171' }}>*</span>
            </label>
            <input
              type="url"
              value={affiliateUrl}
              onChange={(e) => setAffiliateUrl(e.target.value)}
              required
              placeholder="https://shopee.co.id/product/12345?aff=..."
              className="w-full text-sm rounded-lg border px-3 py-2 outline-none"
              style={inputStyle}
            />
            <div className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>
              URL target affiliate kamu (Shopee, TikTok, dsb)
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>
              Deskripsi (opsional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Catatan tentang link ini..."
              className="w-full text-sm rounded-lg border px-3 py-2 outline-none resize-none"
              style={inputStyle}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm rounded-lg border px-3 py-2 outline-none"
                style={inputStyle}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>
                Komisi (%)
              </label>
              <input
                type="number"
                value={commissionPct}
                onChange={(e) => setCommissionPct(e.target.value)}
                min="0"
                max="100"
                step="0.5"
                className="w-full text-sm rounded-lg border px-3 py-2 outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4"
              style={{ accentColor: 'var(--accent-color)' }}
            />
            <span className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
              Aktif (menerima clicks)
            </span>
          </label>
        </div>

        <div
          className="flex items-center justify-end gap-2 px-5 py-4 border-t"
          style={{ borderColor: 'var(--theme-border)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm transition"
            style={{
              background: 'var(--theme-bg-tertiary)',
              color: 'var(--theme-text-secondary)',
            }}
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
            style={{
              background: 'var(--accent-color)',
              color: 'var(--theme-bg-primary)',
            }}
          >
            {saving ? 'Menyimpan...' : editing ? 'Update' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  );
}
