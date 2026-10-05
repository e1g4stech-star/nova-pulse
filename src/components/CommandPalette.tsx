'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/lib/settings-context';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: string;
  category: 'Navigasi' | 'Aksi' | 'Tema';
  shortcut?: string;
  action: () => void;
  keywords?: string[];
}

export default function CommandPalette() {
  const router = useRouter();
  const { settings, updateSettings } = useSettings();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // ============================================================
  // COMMANDS
  // ============================================================
  const commands: Command[] = useMemo(() => [
    // Navigasi
    { id: 'nav-dash', label: 'Dashboard', icon: '📊', category: 'Navigasi', keywords: ['home', 'beranda'], action: () => router.push('/dashboard') },
    { id: 'nav-studio', label: 'AI Studio', icon: '✨', category: 'Navigasi', keywords: ['viral', 'content'], action: () => router.push('/ai-studio') },
    { id: 'nav-chat', label: 'AI Chat', icon: '💬', category: 'Navigasi', keywords: ['gemini', 'chat'], action: () => router.push('/ai-chat') },
    { id: 'nav-agent', label: 'AI Agent', icon: '🤖', category: 'Navigasi', action: () => router.push('/ai-agent') },
    { id: 'nav-media', label: 'Media Studio', icon: '🎬', category: 'Navigasi', keywords: ['video', 'gambar'], action: () => router.push('/media-studio') },
    { id: 'nav-kalender', label: 'Kalender', icon: '📅', category: 'Navigasi', keywords: ['calendar', 'jadwal'], action: () => router.push('/kalender') },
    { id: 'nav-posts', label: 'Posts', icon: '📝', category: 'Navigasi', keywords: ['konten', 'posting'], action: () => router.push('/posts') },
    { id: 'nav-finance', label: 'Keuangan', icon: '💰', category: 'Navigasi', keywords: ['finance', 'uang'], action: () => router.push('/finance') },
    { id: 'nav-settings', label: 'Pengaturan', icon: '⚙️', category: 'Navigasi', keywords: ['settings', 'preferensi'], action: () => router.push('/settings') },

    // Aksi
    { id: 'act-new-post', label: 'Buat Post Baru', description: 'Buka AI Studio', icon: '➕', category: 'Aksi', action: () => router.push('/ai-studio') },
    { id: 'act-logout', label: 'Logout', icon: '🚪', category: 'Aksi', keywords: ['keluar', 'signout'], action: async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    }},

    // Tema
    { id: 'theme-neon', label: 'Neon Pulse', icon: '⚡', category: 'Tema', action: () => updateSettings({ theme: 'neon' }) },
    { id: 'theme-dark', label: 'Pure Dark', icon: '🌙', category: 'Tema', action: () => updateSettings({ theme: 'dark' }) },
    { id: 'theme-light', label: 'Light Clean', icon: '☀️', category: 'Tema', action: () => updateSettings({ theme: 'light' }) },
    { id: 'theme-midnight', label: 'Midnight Blue', icon: '🌌', category: 'Tema', action: () => updateSettings({ theme: 'midnight' }) },
    { id: 'theme-sunset', label: 'Sunset', icon: '🌅', category: 'Tema', action: () => updateSettings({ theme: 'sunset' }) },
    { id: 'theme-system', label: 'System', icon: '💻', category: 'Tema', action: () => updateSettings({ theme: 'system' }) },
  ], [router, updateSettings]);

  // ============================================================
  // FILTER COMMANDS
  // ============================================================
  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter((cmd) => {
      const haystack = [
        cmd.label,
        cmd.description || '',
        ...(cmd.keywords || []),
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [commands, query]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filtered.forEach((cmd) => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filtered]);

  const flatFiltered = useMemo(() => {
    const flat: Command[] = [];
    Object.values(grouped).forEach((cmds) => flat.push(...cmds));
    return flat;
  }, [grouped]);

  // ============================================================
  // KEYBOARD SHORTCUT (Ctrl+K / Cmd+K)
  // ============================================================
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input saat open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Reset selectedIndex saat query berubah
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector('[data-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  // ============================================================
  // NAVIGATION KEYS (↑↓ Enter)
  // ============================================================
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatFiltered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = flatFiltered[selectedIndex];
      if (cmd) {
        cmd.action();
        setOpen(false);
      }
    }
  };

  if (!open) return null;

  // ============================================================
  // RENDER
  // ============================================================
  let runningIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
      style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: 'var(--theme-bg-secondary)',
          border: '1px solid var(--theme-border)',
          color: 'var(--theme-text-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: 'var(--theme-border)' }}
        >
          <span className="text-xl" style={{ color: 'var(--accent-color)' }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Cari halaman, aksi, atau tema..."
            className="flex-1 bg-transparent text-base outline-none placeholder:opacity-50"
            style={{ color: 'var(--theme-text-primary)' }}
          />
          <kbd
            className="text-xs px-2 py-1 rounded border"
            style={{
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-muted)',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto p-2"
        >
          {flatFiltered.length === 0 ? (
            <div className="py-12 text-center" style={{ color: 'var(--theme-text-muted)' }}>
              <div className="text-3xl mb-2">🤔</div>
              <div className="text-sm">Tidak ada hasil untuk "{query}"</div>
            </div>
          ) : (
            Object.entries(grouped).map(([category, cmds]) => (
              <div key={category} className="mb-2">
                <div
                  className="text-xs font-semibold uppercase tracking-wider px-3 py-2"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  {category}
                </div>
                {cmds.map((cmd) => {
                  runningIndex++;
                  const idx = runningIndex;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={cmd.id}
                      data-selected={isSelected}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => {
                        cmd.action();
                        setOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition"
                      style={{
                        background: isSelected ? 'var(--accent-soft)' : 'transparent',
                        color: isSelected ? 'var(--accent-color)' : 'var(--theme-text-primary)',
                      }}
                    >
                      <span className="text-lg shrink-0">{cmd.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{cmd.label}</div>
                        {cmd.description && (
                          <div className="text-xs truncate" style={{ color: 'var(--theme-text-muted)' }}>
                            {cmd.description}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <kbd
                          className="text-xs px-2 py-0.5 rounded border shrink-0"
                          style={{
                            borderColor: 'var(--theme-border)',
                            color: 'var(--theme-text-muted)',
                          }}
                        >
                          ↵
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-4 py-2 border-t text-xs"
          style={{
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-text-muted)',
          }}
        >
          <div className="flex items-center gap-3">
            <span>↑↓ Navigasi</span>
            <span>↵ Pilih</span>
            <span>ESC Tutup</span>
          </div>
          <div>{flatFiltered.length} hasil</div>
        </div>
      </div>
    </div>
  );
}