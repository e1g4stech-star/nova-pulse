'use client';

import { useState, useRef } from 'react';

export default function BackupSection() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/export');
      if (!res.ok) throw new Error('Export gagal');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nova-pulse-backup-' + new Date().toISOString().split('T')[0] + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Data berhasil di-download!' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Export gagal' });
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('Import data dari "' + file.name + '"?')) {
      e.target.value = '';
      return;
    }
    setImporting(true);
    setMessage(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import gagal');
      const stats = data.stats || {};
      const summary = Object.entries(stats)
        .filter(function(pair) { return (pair[1] as number) > 0; })
        .map(function(pair) { return pair[1] + ' ' + pair[0]; })
        .join(', ');
      setMessage({
        type: 'success',
        text: 'Import berhasil! ' + (summary || 'Tidak ada data baru.'),
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Import gagal',
      });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div
        className="text-xs p-3 rounded-lg"
        style={{
          background: 'var(--accent-soft)',
          color: 'var(--theme-text-secondary)',
        }}
      >
        Backup berisi semua data kamu: posts, notes, transactions, calendar, media, chat, affiliate. Format: JSON.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-3 p-4 rounded-xl border-2 transition-all hover:scale-[1.02] disabled:opacity-50 text-left"
          style={{
            borderColor: 'var(--theme-border)',
            background: 'var(--theme-card-bg)',
          }}
        >
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0"
            style={{ background: 'var(--accent-soft)' }}
          >
            {exporting ? '...' : 'D'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
              {exporting ? 'Menyiapkan...' : 'Export Semua Data'}
            </div>
            <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              Download JSON backup
            </div>
          </div>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-3 p-4 rounded-xl border-2 transition-all hover:scale-[1.02] disabled:opacity-50 text-left"
          style={{
            borderColor: 'var(--theme-border)',
            background: 'var(--theme-card-bg)',
          }}
        >
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0"
            style={{ background: 'var(--accent-soft)' }}
          >
            {importing ? '...' : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
              {importing ? 'Mengimport...' : 'Import Backup'}
            </div>
            <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              Restore dari file JSON
            </div>
          </div>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {message && (
        <div
          className="text-sm p-3 rounded-lg"
          style={{
            background: message.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            color: message.type === 'success' ? '#4ade80' : '#fca5a5',
            border: '1px solid ' + (message.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'),
          }}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}