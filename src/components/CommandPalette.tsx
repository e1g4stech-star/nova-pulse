'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/lib/settings-context';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: string;
  category: string;
  action: () => void;
  keywords?: string[];
}

interface SearchResult {
  id: string;
  type: 'post' | 'note' | 'transaction' | 'event' | 'affiliate';
  title: string;
  subtitle: string;
  href: string;
  meta: string;
}

const TYPE_ICONS: Record<string, string> = {
  post: '📝',
  note: '📄',
  transaction: '💰',
  event: '📅',
  affiliate: '🔗',
};

export default function CommandPalette() {
  const router = useRouter();
  const { settings, updateSettings } = useSettings();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================
  // STATIC COMMANDS
  // ============================================================
  const commands: Command[] = useMemo(() => [
    { id: 'nav-dash', label: 'Dashboard', icon: '📊', category: 'Navigasi', keywords: ['home', 'beranda'], action: () => router.push('/dashboard') },
    { id: 'nav-studio', label: 'AI Studio', icon: '✨', category: 'Navigasi', keywords: ['viral', 'content'], action: () => router.push('/ai-studio') },
    { id: 'nav-chat', label: 'AI Chat', icon: '💬', category: 'Navigasi', keywords: ['gemini', 'chat'], action: () => router.push('/ai-chat') },
    { id: 'nav-agent', label: 'AI Agent', icon: '🤖', category: 'Navigasi', action: () => router.push('/ai-agent') },
    { id: 'nav-media', label: 'Media Studio', icon: '🎬', category: 'Navigasi', keywords: ['video', 'gambar'], action: () => router.push('/media-studio') },
    { id: 'nav-kalender', label: 'Kalender', icon: '📅', category: 'Navigasi', keywords: ['calendar', 'jadwal'], action: () => router.push('/kalender') },
    { id: 'nav-posts', label: 'Posts', icon: '📝', category: 'Navigasi', keywords: ['konten', 'posting'], action: () => router.push('/posts') },
    { id: 'nav-finance', label: 'Keuangan', icon: '💰', category: 'Navigasi', keywords: ['finance', 'uang'], action: () => router.push('/finance') },
    { id: 'nav-affiliate', label: 'Affiliate', icon: '🔗', category: 'Navigasi', keywords: ['link', 'komisi'], action: () => router.push('/affiliate') },
    { id: 'nav-settings', label: 'Pengaturan', icon: '⚙️', category: 'Navigasi', keywords: ['settings', 'preferensi'], action: () => router.push('/settings') },
    { id: 'act-new-post', label: 'Buat Post Baru', description: 'Buka AI Studio', icon: '➕', category: 'Aksi', action: () => router.push('/ai-studio') },
    { id: 'theme-neon', label: 'Neon Pulse', icon: '⚡', category: 'Tema', action: () => updateSettings({ theme: 'neon' }) },
    { id: 'theme-dark', label: 'Pure Dark', icon: '🌙', category: 'Tema', action: () => updateSettings({ theme: 'dark' }) },
    { id: 'theme-light', label: 'Light Clean', icon: '☀️', category: 'Tema', action: () => updateSettings({ theme: 'light' }) },
    { id: 'theme-midnight', label: 'Midnight Blue', icon: '🌌', category: 'Tema', action: () => updateSettings({ theme: 'midnight' }) },
    { id: 'theme-sunset', label: 'Sunset', icon: '🌅', category: 'Tema', action: () => updateSettings({ theme: 'sunset' }) },
  ], [router, updateSettings]);

  // ============================================================
  // FILTER STATIC
  // ============================================================
  const filteredCommands = useMemo(() => {
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

  // ============================================================
  // DEBOUNCED SEARCH
  // ============================================================
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (query.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/search?q=' + encodeURIComponent(query), { cache: 'no-store' });
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query]);

  // ============================================================
  // COMBINED LIST — untuk navigasi keyboard
  // ============================================================
  const combinedList = useMemo(() => {
    const list: Array<{ kind: 'cmd' | 'result'; data: Command | SearchResult }> = [];
    filteredCommands.forEach((c) => list.push({ kind: 'cmd', data: c }));
    searchResults.forEach((r) => list.push({ kind: 'result', data: r }));
    return list;
  }, [filteredCommands, searchResults]);

  // ============================================================
  // KEYBOARD SHORTCUT
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

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setSearchResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector('[data-selected="true"]');
    if (selected) selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, combinedList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = combinedList[selectedIndex];
      if (!item) return;
      if (item.kind === 'cmd') {
        (item.data as Command).action();
      } else {
        router.push((item.data as SearchResult).href);
      }
      setOpen(false);
    }
  };

  if (!open) return null;

  // ============================================================
  // GROUP & RENDER
  // ============================================================
  const groupedCommands: Record<string, Command[]> = {};
  filteredCommands.forEach((cmd) => {
    if (!groupedCommands[cmd.category]) groupedCommands[cmd.category] = [];
    groupedCommands[cmd.category].push(cmd);
  });

  const groupedResults: Record<string, SearchResult[]> = {};
  searchResults.forEach((r) => {
    const key = r.type;
    if (!groupedResults[key]) groupedResults[key] = [];
    groupedResults[key].push(r);
  });

  const RESULT_LABELS: Record<string, string> = {
    post: 'Posts',
    note: 'Catatan',
    transaction: 'Transaksi',
    event: 'Event Kalender',
    affiliate: 'Affiliate Links',
  };

  let runningIndex = -1;
  const empty = filteredCommands.length === 0 && searchResults.length === 0 && !searching;

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
          <span className="text-xl" style={{ color: 'var(--accent-color)' }}>
            {searching ? '⏳' : '🔍'}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Cari halaman, post, catatan, transaksi..."
            className="flex-1 bg-transparent text-base outline-none placeholder:opacity-50"
            style={{ color: 'var(--theme-text-primary)' }}
          />
          <kbd
            className="text-xs px-2 py-1 rounded border"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
          {empty ? (
            <div className="py-12 text-center" style={{ color: 'var(--theme-text-muted)' }}>
              <div className="text-3xl mb-2">🤔</div>
              <div className="text-sm">Tidak ada hasil untuk "{query}"</div>
            </div>
          ) : (
            <>
              {/* Static commands */}
              {Object.entries(groupedCommands).map(([category, cmds]) => (
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
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* Search results */}
              {Object.entries(groupedResults).map(([type, results]) => (
                <div key={type} className="mb-2">
                  <div
                    className="text-xs font-semibold uppercase tracking-wider px-3 py-2"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    {RESULT_LABELS[type] || type}
                  </div>
                  {results.map((r) => {
                    runningIndex++;
                    const idx = runningIndex;
                    const isSelected = idx === selectedIndex;
                    return (
                      <button
                        key={r.id}
                        data-selected={isSelected}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={() => {
                          router.push(r.href);
                          setOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition"
                        style={{
                          background: isSelected ? 'var(--accent-soft)' : 'transparent',
                          color: isSelected ? 'var(--accent-color)' : 'var(--theme-text-primary)',
                        }}
                      >
                        <span className="text-lg shrink-0">{TYPE_ICONS[r.type] || '📄'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{r.title}</div>
                          {r.subtitle && (
                            <div className="text-xs truncate" style={{ color: 'var(--theme-text-muted)' }}>
                              {r.subtitle}
                            </div>
                          )}
                        </div>
                        {r.meta && (
                          <span className="text-xs shrink-0" style={{ color: 'var(--theme-text-muted)' }}>
                            {r.meta}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-4 py-2 border-t text-xs"
          style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
        >
          <div className="flex items-center gap-3">
            <span>↑↓ Navigasi</span>
            <span>↵ Pilih</span>
            <span>ESC Tutup</span>
          </div>
          <div>
            {searching ? 'Mencari...' : combinedList.length + ' hasil'}
          </div>
        </div>
      </div>
    </div>
  );
}