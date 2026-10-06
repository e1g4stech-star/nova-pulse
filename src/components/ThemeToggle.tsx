'use client';

import { useSettings } from '@/lib/settings-context';
import { THEME_CYCLE, getThemeMeta, type ThemeId } from '@/lib/themes';

export default function ThemeToggle() {
  const { settings, updateSettings } = useSettings();

  if (!settings) return null;

  const current: ThemeId = (THEME_CYCLE as readonly string[]).includes(settings.theme)
    ? (settings.theme as ThemeId)
    : 'neon';
  const meta = getThemeMeta(current);

  const cycleTheme = () => {
    const idx = THEME_CYCLE.indexOf(current);
    const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
    void updateSettings({ theme: next });
  };

  return (
    <button
      type="button"
      onClick={cycleTheme}
      title={`Theme: ${meta.label} (klik untuk ganti)`}
      aria-label={`Current theme: ${meta.label}. Click to cycle.`}
      className="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-all hover:scale-105"
      style={{
        background: 'var(--accent-soft)',
        color: 'var(--accent-color)',
        border: '1px solid var(--theme-border)',
      }}
    >
      <span className="text-base leading-none">{meta.icon}</span>
      <span className="hidden lg:inline text-xs font-medium">{meta.label}</span>
    </button>
  );
}
