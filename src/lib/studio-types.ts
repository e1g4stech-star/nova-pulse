export type Platform = "tiktok" | "instagram" | "facebook" | "youtube";
export type Stage = "ide" | "naskah" | "produksi" | "review" | "terjadwal" | "terbit";
export type Format = "short" | "carousel" | "long";

export interface ScriptRow {
  t: string;
  visual: string;
  voice: string;
  onscreen: string;
}

export interface ChecklistItem {
  t: string;
  done: boolean;
}

export interface Perf {
  views: string;
  likes: string;
  comments: string;
  shares: string;
}

export interface POpt {
  lang: "en" | "id";
  style: string;
  voice: string;
  ttsVoice?: string;
}

export interface StudioProfile {
  id?: string;
  userId?: string;
  brand: string;
  niche: string;
  audience: string;
  voice: string;
  pillars: string;
  hashtags: string;
  cta: string;
  platforms: Platform[];
  times: Record<string, string>;
}

export interface StudioCard {
  id: string;
  userId?: string;
  title: string;
  stage: Stage;
  platforms: Platform[];
  format: Format;
  pillar: string;
  hook: string;
  script: ScriptRow[];
  captions: Partial<Record<Platform, string>>;
  tags: Partial<Record<Platform, string[]>>;
  ytTitle: string;
  ytDesc: string;
  cta: string;
  schedule: string | null;
  checklist: ChecklistItem[];
  perf: Perf;
  prompts: Partial<Record<"video" | "image" | "voice", string>>;
  pOpt: POpt;
  example: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const PLATFORMS: Record<Platform, { name: string; ratio: string; cap: number; capNote: string; titleCap?: number }> = {
  tiktok: { name: "TikTok", ratio: "9:16", cap: 2200, capNote: "batas aman" },
  instagram: { name: "Instagram", ratio: "9:16 atau 4:5", cap: 2200, capNote: "batas" },
  facebook: { name: "Facebook", ratio: "9:16 atau 1:1", cap: 63206, capNote: "batas" },
  youtube: { name: "YouTube", ratio: "9:16 (Shorts) atau 16:9", cap: 5000, capNote: "batas deskripsi", titleCap: 100 },
};

export const STAGES: [Stage, string][] = [
  ["ide", "Ide"],
  ["naskah", "Naskah"],
  ["produksi", "Produksi"],
  ["review", "Review"],
  ["terjadwal", "Terjadwal"],
  ["terbit", "Terbit"],
];

export const FORMATS: Record<Format, string> = {
  short: "Video pendek",
  carousel: "Carousel",
  long: "Video panjang",
};

export const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export const DAYN = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
export const DOW = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export function ymd(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${ymd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fmtWhen(v: string | null): string {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} Â· ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fmtNum(n: number | string): string {
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(v)) return "0";
  return Number(v).toLocaleString("id-ID");
}

export function num(v: unknown): number {
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
}

export function stageName(id: Stage | string): string {
  const s = STAGES.find((x) => x[0] === id);
  return s ? s[1] : id;
}