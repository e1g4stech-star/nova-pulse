'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

interface PlanItem {
  day: number;
  title: string;
  description: string;
  contentType: string;
  hashtags: string[];
}

export default function AICalendarPage() {
  const [niche, setNiche] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [tone, setTone] = useState('edukatif');
  const [days, setDays] = useState(30);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleGenerate = async () => {
    if (!niche.trim()) {
      setError('Niche wajib diisi');
      return;
    }

    setGenerating(true);
    setError('');
    setMessage(null);
    setPlan([]);

    try {
      const res = await fetch('/api/ai-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: niche.trim(), platform, tone, days }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generate gagal');

      setPlan(data.plan || []);
      setMessage({ type: 'success', text: `Berhasil generate ${data.plan?.length || 0} ide konten!` });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (plan.length === 0) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/ai-calendar/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, startDate, platform }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save gagal');

      setMessage({
        type: 'success',
        text: `${data.created} event berhasil disimpan ke kalender!`,
      });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveItem = (idx: number) => {
    setPlan((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateTitle = (idx: number, title: string) => {
    setPlan((prev) => prev.map((item, i) => (i === idx ? { ...item, title } : item)));
  };

  const inputStyle = {
    background: 'var(--theme-bg-tertiary)',
    borderColor: 'var(--theme-border)',
    color: 'var(--theme-text-primary)',
  };

  return (
    <>
      <Navbar />
      <main
        className="min-h-screen"
        style={{ background: 'var(--theme-bg-primary)', color: 'var(--theme-text-primary)' }}
      >
        <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold">✨ AI Content Calendar</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
              Generate plan konten {days} hari otomatis dengan AI
            </p>
          </div>

          {/* Form */}
          <div
            className="rounded-xl border p-6 space-y-4"
            style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border)' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">Niche / Topik</label>
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="skincare, fitness, kopi, dll"
                  className="w-full text-sm rounded-lg border px-3 py-2 outline-none"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full text-sm rounded-lg border px-3 py-2 outline-none"
                  style={inputStyle}
                >
                  <option>Instagram</option>
                  <option>TikTok</option>
                  <option>YouTube</option>
                  <option>Twitter/X</option>
                  <option>LinkedIn</option>
                  <option>Facebook</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full text-sm rounded-lg border px-3 py-2 outline-none"
                  style={inputStyle}
                >
                  <option>edukatif</option>
                  <option>humoris</option>
                  <option>inspiratif</option>
                  <option>personal</option>
                  <option>profesional</option>
                  <option>casual</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">Jumlah Hari</label>
                <input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(Math.min(60, Math.max(7, Number(e.target.value))))}
                  min={7}
                  max={60}
                  className="w-full text-sm rounded-lg border px-3 py-2 outline-none"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">Mulai Tanggal</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-sm rounded-lg border px-3 py-2 outline-none"
                  style={inputStyle}
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || !niche.trim()}
              className="w-full px-6 py-3 rounded-lg font-semibold transition-all hover:scale-[1.01] disabled:opacity-50"
              style={{ background: 'var(--accent-color)', color: 'var(--theme-bg-primary)' }}
            >
              {generating ? '⏳ AI sedang generate...' : `✨ Generate ${days} Hari Plan`}
            </button>

            {error && (
              <div
                className="text-sm px-4 py-3 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}
              >
                {error}
              </div>
            )}
          </div>

          {/* Preview Plan */}
          {plan.length > 0 && (
            <div
              className="rounded-xl border overflow-hidden"
              style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border)' }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--theme-border)' }}>
                <div>
                  <h2 className="font-bold">Preview Plan</h2>
                  <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                    {plan.length} ide konten — edit langsung atau hapus
                  </p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving || plan.length === 0}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: 'var(--accent-color)', color: 'var(--theme-bg-primary)' }}
                >
                  {saving ? '⏳ Menyimpan...' : `💾 Save ${plan.length} ke Kalender`}
                </button>
              </div>

              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0" style={{ background: 'var(--theme-bg-secondary)' }}>
                    <tr style={{ borderBottom: '1px solid var(--theme-border)' }}>
                      <th className="text-left text-xs font-semibold uppercase px-4 py-3 w-12" style={{ color: 'var(--theme-text-muted)' }}>Day</th>
                      <th className="text-left text-xs font-semibold uppercase px-4 py-3" style={{ color: 'var(--theme-text-muted)' }}>Judul</th>
                      <th className="text-left text-xs font-semibold uppercase px-4 py-3 w-24" style={{ color: 'var(--theme-text-muted)' }}>Type</th>
                      <th className="text-left text-xs font-semibold uppercase px-4 py-3 w-20" style={{ color: 'var(--theme-text-muted)' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--theme-border)' }}>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono" style={{ color: 'var(--accent-color)' }}>
                            #{item.day}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {editingIdx === idx ? (
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => handleUpdateTitle(idx, e.target.value)}
                              onBlur={() => setEditingIdx(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingIdx(null)}
                              autoFocus
                              className="w-full text-sm rounded border px-2 py-1 outline-none"
                              style={inputStyle}
                            />
                          ) : (
                            <div>
                              <div
                                className="cursor-pointer hover:underline"
                                onClick={() => setEditingIdx(idx)}
                                title="Klik untuk edit"
                              >
                                {item.title}
                              </div>
                              {item.description && (
                                <div className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                                  {item.description.substring(0, 80)}...
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-xs px-2 py-1 rounded"
                            style={{ background: 'var(--accent-soft)', color: 'var(--accent-color)' }}
                          >
                            {item.contentType}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleRemoveItem(idx)}
                            className="text-xs px-2 py-1 rounded"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {message && (
            <div
              className="text-sm px-4 py-3 rounded-lg"
              style={{
                background: message.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                color: message.type === 'success' ? '#4ade80' : '#fca5a5',
              }}
            >
              {message.type === 'success' && <Link href="/kalender" className="underline ml-2">Buka Kalender →</Link>}
              {message.text}
            </div>
          )}
        </div>
      </main>
    </>
  );
}