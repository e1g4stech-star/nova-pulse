'use client';

import { useState } from 'react';

export default function TestEmailButton() {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleTest = async () => {
    setSending(true);
    setResult(null);

    try {
      const res = await fetch('/api/cron/email-reminder', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Gagal');

      if (data.sent > 0) {
        setResult({ type: 'success', text: 'Email terkirim! Cek inbox kamu.' });
      } else {
        setResult({
          type: 'error',
          text: 'Tidak terkirim. Pastikan toggle ON dan jam ringkasan = jam sekarang.',
        });
      }
    } catch (err) {
      setResult({ type: 'error', text: err instanceof Error ? err.message : 'Gagal' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleTest}
        disabled={sending}
        className="text-xs px-3 py-1.5 rounded-lg transition-all hover:scale-105 disabled:opacity-50"
        style={{ background: 'var(--accent-soft)', color: 'var(--accent-color)' }}
      >
        {sending ? 'Mengirim...' : 'Kirim Test Email'}
      </button>
      {result && (
        <span
          className="text-xs"
          style={{ color: result.type === 'success' ? '#4ade80' : '#fca5a5' }}
        >
          {result.text}
        </span>
      )}
    </div>
  );
}