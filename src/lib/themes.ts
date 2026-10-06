export const THEME_LIST = [
  { id: "neon",   label: "Neon Pulse",  icon: "⚡", color: "from-cyan-400 to-purple-500" },
  { id: "aurora", label: "Aurora",      icon: "🌌", color: "from-green-400 to-blue-500" },
  { id: "cyber",  label: "Cyber",       icon: "🤖", color: "from-yellow-400 to-red-500" },
  { id: "dark",   label: "Pure Dark",   icon: "🌙", color: "from-slate-700 to-slate-900" },
  { id: "light",  label: "Light Clean", icon: "☀️", color: "from-slate-100 to-slate-300" },
  { id: "ocean",  label: "Ocean",       icon: "🌊", color: "from-cyan-500 to-blue-600" },
  { id: "sunset", label: "Sunset",      icon: "🌅", color: "from-orange-400 to-pink-500" },
  { id: "forest", label: "Forest",      icon: "🌲", color: "from-green-600 to-emerald-800" },
] as const;

export type ThemeId = typeof THEME_LIST[number]["id"];

export const THEME_CYCLE: ThemeId[] = THEME_LIST.map((t) => t.id);

export const THEME_META: Record<ThemeId, { icon: string; label: string; color: string }> =
  Object.fromEntries(THEME_LIST.map((t) => [t.id, t])) as any;

export function getThemeMeta(id: string | undefined) {
  const safeId = (id && id in THEME_META ? id : "neon") as ThemeId;
  return THEME_META[safeId];
}
