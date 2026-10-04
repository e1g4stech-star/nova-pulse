export interface ThemePreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  gradient: string;
  cardBg: string;
}

export interface AccentPreset {
  id: string;
  name: string;
  color: string;
}

export const THEMES: ThemePreset[] = [
  { id: 'neon', name: 'Neon Pulse', icon: '⚡', description: 'Dark futuristik cyan', bgPrimary: '#0a0e1a', bgSecondary: '#0f1423', bgTertiary: '#1a1f35', textPrimary: '#e2e8f0', textSecondary: '#94a3b8', textMuted: '#64748b', border: 'rgba(6,182,212,0.2)', gradient: 'linear-gradient(135deg, #0a0e1a 0%, #1a0d2e 50%, #0a0e1a 100%)', cardBg: 'rgba(15,20,35,0.7)' },
  { id: 'dark', name: 'Pure Dark', icon: '🌙', description: 'Hitam murni minimalis', bgPrimary: '#000000', bgSecondary: '#0a0a0a', bgTertiary: '#141414', textPrimary: '#fafafa', textSecondary: '#a3a3a3', textMuted: '#737373', border: 'rgba(255,255,255,0.1)', gradient: 'linear-gradient(135deg, #000000 0%, #0a0a0a 100%)', cardBg: 'rgba(20,20,20,0.8)' },
  { id: 'light', name: 'Light Clean', icon: '☀️', description: 'Terang profesional', bgPrimary: '#ffffff', bgSecondary: '#f8fafc', bgTertiary: '#f1f5f9', textPrimary: '#0f172a', textSecondary: '#475569', textMuted: '#94a3b8', border: 'rgba(15,23,42,0.1)', gradient: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)', cardBg: 'rgba(255,255,255,0.95)' },
  { id: 'midnight', name: 'Midnight Blue', icon: '🌌', description: 'Biru gelap elegan', bgPrimary: '#0a1128', bgSecondary: '#0f1a3d', bgTertiary: '#1a2654', textPrimary: '#dbeafe', textSecondary: '#93c5fd', textMuted: '#60a5fa', border: 'rgba(59,130,246,0.25)', gradient: 'linear-gradient(135deg, #0a1128 0%, #1e3a8a 50%, #0a1128 100%)', cardBg: 'rgba(15,26,61,0.7)' },
  { id: 'sunset', name: 'Sunset', icon: '🌅', description: 'Gradasi orange-pink', bgPrimary: '#1a0a1e', bgSecondary: '#2d1428', bgTertiary: '#3d1f35', textPrimary: '#fce7f3', textSecondary: '#f9a8d4', textMuted: '#ec4899', border: 'rgba(236,72,153,0.25)', gradient: 'linear-gradient(135deg, #1a0a1e 0%, #4c1d95 50%, #831843 100%)', cardBg: 'rgba(45,20,40,0.7)' },
  { id: 'system', name: 'System', icon: '💻', description: 'Ikut preferensi OS', bgPrimary: '#0a0e1a', bgSecondary: '#0f1423', bgTertiary: '#1a1f35', textPrimary: '#e2e8f0', textSecondary: '#94a3b8', textMuted: '#64748b', border: 'rgba(6,182,212,0.2)', gradient: 'linear-gradient(135deg, #0a0e1a 0%, #1a0d2e 50%, #0a0e1a 100%)', cardBg: 'rgba(15,20,35,0.7)' },
];

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: 'cyan', name: 'Neon Cyan', color: '#5ee7ff' },
  { id: 'purple', name: 'Violet', color: '#a78bfa' },
  { id: 'pink', name: 'Hot Pink', color: '#ec4899' },
  { id: 'green', name: 'Matrix Green', color: '#22c55e' },
  { id: 'orange', name: 'Sunset Orange', color: '#f97316' },
  { id: 'red', name: 'Crimson', color: '#ef4444' },
  { id: 'blue', name: 'Ocean Blue', color: '#3b82f6' },
  { id: 'yellow', name: 'Gold', color: '#eab308' },
];

export const FONT_SIZES = {
  small: { base: '13px', sm: '11px', lg: '15px', xl: '18px' },
  normal: { base: '15px', sm: '13px', lg: '18px', xl: '22px' },
  large: { base: '17px', sm: '15px', lg: '21px', xl: '26px' },
} as const;

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  return parseInt(h.substring(0,2),16) + ', ' + parseInt(h.substring(2,4),16) + ', ' + parseInt(h.substring(4,6),16);
}

function hexToRgba(hex: string, alpha: number): string {
  return 'rgba(' + hexToRgb(hex) + ', ' + alpha + ')';
}

export function applyTheme(themeId: string, accentColor: string, fontSize: string, compactMode: boolean) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  let theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];

  if (themeId === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme = prefersDark ? THEMES[0] : THEMES[2];
  }

  root.style.setProperty('--theme-bg-primary', theme.bgPrimary);
  root.style.setProperty('--theme-bg-secondary', theme.bgSecondary);
  root.style.setProperty('--theme-bg-tertiary', theme.bgTertiary);
  root.style.setProperty('--theme-text-primary', theme.textPrimary);
  root.style.setProperty('--theme-text-secondary', theme.textSecondary);
  root.style.setProperty('--theme-text-muted', theme.textMuted);
  root.style.setProperty('--theme-border', theme.border);
  root.style.setProperty('--theme-card-bg', theme.cardBg);

  root.style.setProperty('--accent-color', accentColor);
  root.style.setProperty('--accent-color-rgb', hexToRgb(accentColor));
  root.style.setProperty('--accent-glow', hexToRgba(accentColor, 0.3));
  root.style.setProperty('--accent-soft', hexToRgba(accentColor, 0.15));

  const sizes = FONT_SIZES[fontSize as keyof typeof FONT_SIZES] ?? FONT_SIZES.normal;
  root.style.setProperty('--font-base', sizes.base);
  root.style.setProperty('--font-sm', sizes.sm);
  root.style.setProperty('--font-lg', sizes.lg);
  root.style.setProperty('--font-xl', sizes.xl);
  root.style.setProperty('--spacing-scale', compactMode ? '0.75' : '1');

  root.dataset.theme = theme.id;
  root.dataset.fontSize = fontSize;
  root.dataset.compact = compactMode ? 'true' : 'false';

  const isDark = ['neon', 'dark', 'midnight', 'sunset'].includes(theme.id);
  root.classList.toggle('dark', isDark);
  root.classList.toggle('light', !isDark);
}