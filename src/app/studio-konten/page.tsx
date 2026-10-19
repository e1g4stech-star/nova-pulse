"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Navbar from "@/components/Navbar";
import PremiumGuard from "@/components/PremiumGuard";
import {
  PLATFORMS, STAGES, FORMATS, MONTHS, DAYN, DOW,
  ymd, toLocalInput, fmtWhen, fmtNum, num, stageName,
  type Platform, type Stage, type Format, type ScriptRow,
  type StudioProfile, type StudioCard,
} from "@/lib/studio-types";

type ViewKey = "home" | "create" | "board" | "calendar" | "auto";

const EMPTY_PROFILE: StudioProfile = {
  brand: "", niche: "", audience: "", voice: "Santai, ramah, langsung ke inti",
  pillars: "Tips, Review, Di balik layar", hashtags: "", cta: "",
  platforms: ["tiktok", "instagram"],
  times: { tiktok: "19:00", instagram: "12:00", facebook: "09:00", youtube: "17:00" },
};

export default function StudioKontenPage() {
  const [view, setView] = useState<ViewKey>("home");
  const [profile, setProfile] = useState<StudioProfile>(EMPTY_PROFILE);
  const [cards, setCards] = useState<StudioCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [modalId, setModalId] = useState<string | null>(null);
  const [cal, setCal] = useState(() => {
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth(), sel: ymd(now) };
  });
  const [rules, setRules] = useState({ script: true, checklist: true, slot: true, postcheck: true });
  const [aiBusy, setAiBusy] = useState(false);
  const [audioMap, setAudioMap] = useState<Record<string, string>>({});
  const [ttsBusy, setTtsBusy] = useState<string | null>(null);
  const [ttsLang, setTtsLang] = useState<string>("id-ID");

  useEffect(() => {
    async function load() {
      try {
        const [pRes, cRes] = await Promise.all([
          fetch("/api/studio/profile", { cache: "no-store" }),
          fetch("/api/studio/cards", { cache: "no-store" }),
        ]);
        if (pRes.ok) {
          const d = await pRes.json();
          if (d.profile) setProfile({ ...EMPTY_PROFILE, ...d.profile });
        }
        if (cRes.ok) {
          const d = await cRes.json();
          if (Array.isArray(d.cards)) setCards(d.cards);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const saveProfile = useCallback(async (updates: Partial<StudioProfile>) => {
    const next = { ...profile, ...updates };
    setProfile(next);
    try {
      await fetch("/api/studio/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (err) { console.error(err); }
  }, [profile]);

  const createCard = useCallback(async (data: Partial<StudioCard>): Promise<StudioCard | null> => {
    try {
      const res = await fetch("/api/studio/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      const d = await res.json();
      if (d.card) {
        setCards((prev) => [d.card, ...prev]);
        return d.card;
      }
    } catch (err) { console.error(err); }
    return null;
  }, []);

  const updateCard = useCallback(async (id: string, updates: Partial<StudioCard>) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    try {
      await fetch(`/api/studio/cards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (err) { console.error(err); }
  }, []);

  const deleteCard = useCallback(async (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    try {
      await fetch(`/api/studio/cards/${id}`, { method: "DELETE" });
    } catch (err) { console.error(err); }
  }, []);

  const callAI = useCallback(async (prompt: string): Promise<any | null> => {
    if (aiBusy) { showToast("Masih ada proses AI yang berjalan"); return null; }
    setAiBusy(true);
    try {
      const res = await fetch("/api/studio/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || "AI error");
        return null;
      }
      const d = await res.json();
      return d.result;
    } catch (err) {
      console.error(err);
      showToast("AI request gagal");
      return null;
    } finally {
      setAiBusy(false);
    }
  }, [aiBusy]);

  const generateTTS = useCallback(
    async (cardId: string, text: string, voice?: string, languageCode?: string): Promise<string | null> => {
      if (ttsBusy) {
        showToast("Masih ada proses TTS berjalan");
        return null;
      }
      if (!text || text.trim().length === 0) {
        showToast("Naskah kosong. Isi narasi dulu.");
        return null;
      }
      if (text.length > 5000) {
        showToast(`Naskah terlalu panjang (${text.length} kar). Maks 5000.`);
        return null;
      }

      setTtsBusy(cardId);
      showToast("Membuat audio...");

      try {
        const res = await fetch("/api/studio/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice, languageCode }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          showToast(d.error || "Gagal generate audio");
          return null;
        }
        const d = await res.json();
        if (!d.audio) {
          showToast("Audio kosong dari server");
          return null;
        }
        const dataUrl = `data:${d.mimeType};base64,${d.audio}`;
        setAudioMap((prev) => ({ ...prev, [cardId]: dataUrl }));
        showToast(`Audio siap (${d.provider === "gemini" ? "Gemini" : "Google"})`);
        return dataUrl;
      } catch (err) {
        console.error(err);
        showToast("TTS request gagal");
        return null;
      } finally {
        setTtsBusy(null);
      }
    },
    [ttsBusy]
  );

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3200);
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--theme-bg-primary)", color: "var(--theme-text-primary)" }}>
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: "var(--accent-color)", borderTopColor: "transparent" }}></div>
            <p style={{ color: "var(--theme-text-muted)" }}>Memuat studio konten...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-[1280px] mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-7" style={{ background: "var(--theme-bg-primary)", color: "var(--theme-text-primary)", minHeight: "calc(100vh - 64px)" }}>
        <aside className="hidden md:flex flex-col gap-4 sticky top-20 self-start">
          <div className="flex items-center gap-2.5 font-bold text-lg">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{ background: "var(--accent-color)" }}>S</span>
            Studio Konten
          </div>
          <nav className="flex flex-col gap-0.5">
            {(["home", "create", "board", "calendar", "auto"] as ViewKey[]).map((v) => (
              <button key={v} type="button" onClick={() => setView(v)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-left transition"
                style={{
                  background: view === v ? "var(--theme-bg-secondary)" : "transparent",
                  color: view === v ? "var(--theme-text-primary)" : "var(--theme-text-muted)",
                  boxShadow: view === v ? "inset 3px 0 0 var(--accent-color)" : "none",
                  fontWeight: view === v ? 600 : 400,
                }}>
                {({ home: "Beranda", create: "Buat", board: "Pipeline", calendar: "Kalender", auto: "Otomasi" } as any)[v]}
              </button>
            ))}
          </nav>
          <p className="text-xs mt-2 pt-3 border-t" style={{ color: "var(--theme-text-muted)", borderColor: "var(--theme-border)" }}>
            Data tersimpan di database. Ekspor cadangan dari menu Otomasi.
          </p>
        </aside>
        <main className="min-w-0">
          {view === "home" && <HomeView cards={cards} setView={setView} showToast={showToast} />}
          {view === "create" && <CreateView profile={profile} createCard={createCard} callAI={callAI} aiBusy={aiBusy} showToast={showToast} setView={setView} />}
          {view === "board" && <BoardView cards={cards} updateCard={updateCard} createCard={createCard} openModal={setModalId} showToast={showToast} rules={rules} profile={profile} callAI={callAI} />}
          {view === "calendar" && <CalendarView cards={cards} cal={cal} setCal={setCal} openModal={setModalId} createCard={createCard} showToast={showToast} profile={profile} />}
          {view === "auto" && <AutoView profile={profile} saveProfile={saveProfile} rules={rules} setRules={setRules} cards={cards} createCard={createCard} callAI={callAI} showToast={showToast} setView={setView} />}
        </main>
      </div>

      {modalId && (() => {
        const c = cards.find((x) => x.id === modalId);
        if (!c) return null;
        return <EditorModal
          card={c}
          updateCard={updateCard}
          deleteCard={deleteCard}
          closeModal={() => setModalId(null)}
          callAI={callAI}
          aiBusy={aiBusy}
          showToast={showToast}
          profile={profile}
          generateTTS={generateTTS}
          ttsBusy={ttsBusy}
          audioUrl={audioMap[c.id] || null}
          ttsLang={ttsLang}
          setTtsLang={setTtsLang}
        />;
      })()}

      {toastMsg && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-8 px-4 py-2.5 rounded-lg text-sm z-50 shadow-lg"
          style={{ background: "var(--theme-text-primary)", color: "var(--theme-bg-primary)" }}>
          {toastMsg}
        </div>
      )}

      {aiBusy && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full text-sm z-50 shadow-lg"
          style={{ background: "var(--theme-text-primary)", color: "var(--theme-bg-primary)" }}>
          <span className="w-3 h-3 rounded-full border-2 border-current border-r-transparent animate-spin inline-block" />
          AI sedang bekerja...
        </div>
      )}
    </>
  );
}

// ============ HOME VIEW ============
function HomeView({ cards, setView, showToast }: { cards: StudioCard[]; setView: (v: ViewKey) => void; showToast: (m: string) => void }) {
  const counts = useMemo(() => {
    const r: Record<string, number> = {};
    STAGES.forEach((s) => (r[s[0]] = 0));
    cards.forEach((c) => { if (r[c.stage] !== undefined) r[c.stage]++; });
    return r;
  }, [cards]);

  const now = new Date();
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const k = ymd(d);
    const its = cards.filter((c) => c.schedule && c.schedule.slice(0, 10) === k);
    return { d, k, its };
  });
  const empty = days.filter((x) => x.its.length === 0).length;

  const pub = cards
    .filter((c) => c.stage === "terbit" && num(c.perf.views) > 0)
    .sort((a, b) => num(b.perf.views) - num(a.perf.views))
    .slice(0, 5);
  const maxV = pub.length ? num(pub[0].perf.views) : 1;
  const totalV = cards.reduce((a, c) => a + (c.stage === "terbit" ? num(c.perf.views) : 0), 0);

  return (
    <>
      <div className="flex flex-wrap justify-between items-end gap-3 mb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Studio hari ini</h1>
          <p className="text-sm mt-1" style={{ color: "var(--theme-text-muted)" }}>
            {DAYN[(now.getDay() + 6) % 7]}, {now.getDate()} {MONTHS[now.getMonth()]} {now.getFullYear()}. Dari ide sampai tayang, satu meja kerja.
          </p>
        </div>
        <button type="button" onClick={() => setView("create")}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: "var(--accent-color)" }}>
          Buat naskah
        </button>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-0 border rounded-xl overflow-hidden mb-5" style={{ borderColor: "var(--theme-border)", background: "var(--theme-bg-secondary)" }}>
        {STAGES.map((s, i) => (
          <button key={s[0]} type="button" onClick={() => setView("board")}
            className="text-left px-3 py-3 border-r last:border-r-0 hover:opacity-80"
            style={{ borderColor: "var(--theme-border)" }}>
            <div className="text-2xl font-mono font-medium" style={{ color: i === 5 ? "var(--accent-color)" : "var(--theme-text-primary)" }}>{counts[s[0]]}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--theme-text-muted)" }}>{s[1]}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <section className="rounded-xl border p-5" style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">7 hari ke depan</h2>
            {empty > 0 ? <span className="text-xs px-2 py-0.5 rounded-full border" style={{ color: "#eab308", borderColor: "#eab308" }}>{empty} hari kosong</span> : <span className="text-xs px-2 py-0.5 rounded-full border" style={{ color: "#22c55e", borderColor: "#22c55e" }}>Terisi semua</span>}
          </div>
          <div className="divide-y" style={{ borderColor: "var(--theme-border)" }}>
            {days.map((x) => {
              const lab = (x.d.getDate() === now.getDate() ? "Hari ini" : DOW[(x.d.getDay() + 6) % 7]) + " " + x.d.getDate();
              return (
                <div key={x.k} className="flex items-center gap-2 py-2 text-sm">
                  <span className="font-mono text-xs shrink-0" style={{ minWidth: 74, color: "var(--theme-text-muted)" }}>{lab}</span>
                  <span className="flex-1" style={{ color: x.its.length ? "var(--theme-text-primary)" : "var(--theme-text-muted)" }}>
                    {x.its.length ? x.its.map((c) => c.title || "Tanpa judul").join(", ") : "Belum ada konten"}
                  </span>
                  {x.its.length > 0 && <span className="text-xs px-2 py-0.5 rounded-full border" style={{ color: "#22c55e", borderColor: "#22c55e" }}>{x.its.length}</span>}
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border p-5" style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Tayangan terbanyak</h2>
            <span className="text-xs font-mono" style={{ color: "var(--theme-text-muted)" }}>{fmtNum(totalV)} total</span>
          </div>
          {pub.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "var(--theme-text-muted)" }}>
              Buka kartu di tahap Terbit lalu isi angka tayangan.
            </p>
          ) : (
            <div className="space-y-2">
              {pub.map((c) => (
                <div key={c.id} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 truncate">{c.title}</span>
                  <div className="w-16 h-2 rounded-full overflow-hidden" style={{ background: "var(--theme-border)" }}>
                    <div className="h-full" style={{ width: `${Math.max(4, (num(c.perf.views) / maxV) * 100)}%`, background: "var(--accent-color)" }} />
                  </div>
                  <span className="font-mono text-xs text-right" style={{ minWidth: 60 }}>{fmtNum(num(c.perf.views))}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

// ============ CREATE VIEW ============
function CreateView({ profile, createCard, callAI, aiBusy, showToast, setView }: { profile: StudioProfile; createCard: (d: Partial<StudioCard>) => Promise<StudioCard | null>; callAI: (p: string) => Promise<any>; aiBusy: boolean; showToast: (m: string) => void; setView: (v: ViewKey) => void }) {
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("Edukasi");
  const [format, setFormat] = useState<Format>("short");
  const [duration, setDuration] = useState("30 detik");
  const [pillar, setPillar] = useState("");
  const [tone, setTone] = useState(profile.voice);
  const [platforms, setPlatforms] = useState<Platform[]>(profile.platforms.length ? profile.platforms : ["tiktok", "instagram"]);
  const [ideas, setIdeas] = useState<Array<{ judul: string; sudut: string; hook: string }>>([]);
  const [theme, setTheme] = useState("");
  const [generating, setGenerating] = useState(false);

  const pillars = profile.pillars.split(",").map((x) => x.trim()).filter(Boolean);

  function togglePlat(p: Platform) {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  async function handleGenerate() {
    if (!topic.trim()) { showToast("Tulis topik dulu"); return; }
    if (!platforms.length) { showToast("Pilih minimal 1 platform"); return; }
    setGenerating(true);
    try {
      const brief = `PROFIL MEREK
Merek: ${profile.brand || "(belum diisi)"}
Niche: ${profile.niche || "-"}
Audiens: ${profile.audience || "-"}
Gaya bahasa: ${profile.voice || "-"}
Pilar: ${profile.pillars || "-"}
CTA bawaan: ${profile.cta || "-"}

BRIEF
Topik: ${topic}
Tujuan: ${goal}
Nada: ${tone}
Format: ${format === "short" ? "video pendek vertikal 9:16" : format === "carousel" ? "carousel gambar" : "video panjang horizontal 16:9"}
Durasi: ${duration}
Platform: ${platforms.map((p) => PLATFORMS[p].name).join(", ")}

Balas HANYA JSON:
{"judul":"judul internal singkat","hook":"maks 12 kata","adegan":[{"waktu":"0:00-0:03","visual":"...","narasi":"...","teks_layar":"..."}],"cta":"satu ajakan","platform":{${platforms.map((p) => p === "youtube" ? '"youtube":{"judul":"maks 70 char","deskripsi":"2-4 kalimat","hashtag":["3-6 kata"]}' : `"${p}":{"caption":"...","hashtag":["3-6 kata"]}`).join(",")}}}`;

      const r = await callAI(brief);
      if (!r || typeof r !== "object") return;

      const captions: Record<string, string> = {};
      const tags: Record<string, string[]> = {};
      let ytTitle = "", ytDesc = "";
      if (r.platform) {
        platforms.forEach((p) => {
          const pr = r.platform[p];
          if (!pr) return;
          if (p === "youtube") {
            ytTitle = String(pr.judul || "");
            ytDesc = String(pr.deskripsi || "");
          } else {
            captions[p] = String(pr.caption || "");
          }
          tags[p] = Array.isArray(pr.hashtag) ? pr.hashtag.map((t: string) => String(t).replace(/^#/, "")) : [];
        });
      }

      const created = await createCard({
        title: String(r.judul || topic).slice(0, 100),
        stage: "naskah",
        platforms,
        format,
        pillar,
        hook: String(r.hook || ""),
        script: Array.isArray(r.adegan) ? r.adegan.map((a: any) => ({
          t: String(a.waktu || ""),
          visual: String(a.visual || ""),
          voice: String(a.narasi || ""),
          onscreen: String(a.teks_layar || ""),
        })) : [],
        captions,
        tags,
        ytTitle,
        ytDesc,
        cta: String(r.cta || ""),
      });

      if (created) {
        showToast("Paket konten dibuat. Membuka editor...");
        setTimeout(() => {
          setView("board");
        }, 500);
      }
    } catch (err) {
      console.error(err);
      showToast("Gagal generate konten");
    } finally {
      setGenerating(false);
    }
  }

  async function handleBrainstorm() {
    const prompt = `PROFIL MEREK
Merek: ${profile.brand || "-"}
Niche: ${profile.niche || "-"}
Audiens: ${profile.audience || "-"}
Pilar: ${profile.pillars || "-"}

Buat 6 ide konten beragam.${theme ? ` Tema: ${theme}.` : ""}
Balas HANYA JSON array: [{"judul":"...","sudut":"satu kalimat","hook":"maks 12 kata"}]`;
    const r = await callAI(prompt);
    if (Array.isArray(r)) {
      setIdeas(r.filter((x: any) => x && x.judul).map((x: any) => ({
        judul: String(x.judul),
        sudut: String(x.sudut || ""),
        hook: String(x.hook || ""),
      })));
      showToast("6 ide ditemukan");
    }
  }

  return (
    <>
      <div className="mb-5">
        <h1 className="text-3xl font-extrabold tracking-tight">Buat konten</h1>
        <p className="text-sm mt-1" style={{ color: "var(--theme-text-muted)" }}>
          Isi brief singkat. AI menyusun hook, naskah per adegan, caption dan hashtag.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-5 items-start">
        <form className="rounded-xl border p-4 space-y-3" style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)" }} onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--theme-text-muted)" }}>Topik atau ide</span>
            <textarea rows={3} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Contoh: kenapa kopi buatan sendiri terasa pahit"
              className="w-full mt-1 px-3 py-2 rounded-lg border text-sm"
              style={{ background: "var(--theme-bg-primary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }} />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase" style={{ color: "var(--theme-text-muted)" }}>Tujuan</span>
              <select value={goal} onChange={(e) => setGoal(e.target.value)}
                className="w-full mt-1 px-2 py-2 rounded-lg border text-sm"
                style={{ background: "var(--theme-bg-primary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }}>
                {["Edukasi", "Jualan atau promosi", "Hiburan", "Membangun kepercayaan", "Mengajak interaksi"].map((g) => <option key={g}>{g}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase" style={{ color: "var(--theme-text-muted)" }}>Format</span>
              <select value={format} onChange={(e) => setFormat(e.target.value as Format)}
                className="w-full mt-1 px-2 py-2 rounded-lg border text-sm"
                style={{ background: "var(--theme-bg-primary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }}>
                {Object.entries(FORMATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase" style={{ color: "var(--theme-text-muted)" }}>Durasi</span>
              <select value={duration} onChange={(e) => setDuration(e.target.value)}
                className="w-full mt-1 px-2 py-2 rounded-lg border text-sm"
                style={{ background: "var(--theme-bg-primary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }}>
                {["15 detik", "30 detik", "45 detik", "60 detik", "3 menit", "8 menit"].map((d) => <option key={d}>{d}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase" style={{ color: "var(--theme-text-muted)" }}>Pilar</span>
              <select value={pillar} onChange={(e) => setPillar(e.target.value)}
                className="w-full mt-1 px-2 py-2 rounded-lg border text-sm"
                style={{ background: "var(--theme-bg-primary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }}>
                <option value="">Bebas</option>
                {pillars.map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-semibold uppercase" style={{ color: "var(--theme-text-muted)" }}>Nada bicara</span>
            <input type="text" value={tone} onChange={(e) => setTone(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border text-sm"
              style={{ background: "var(--theme-bg-primary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }} />
          </label>

          <fieldset>
            <legend className="text-xs font-semibold uppercase" style={{ color: "var(--theme-text-muted)" }}>Platform</legend>
            <div className="flex flex-wrap gap-2 mt-2">
              {(Object.keys(PLATFORMS) as Platform[]).map((p) => (
                <label key={p} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border cursor-pointer text-sm"
                  style={{ background: platforms.includes(p) ? "var(--accent-color)" : "var(--theme-bg-primary)", borderColor: "var(--theme-border)", color: platforms.includes(p) ? "white" : "var(--theme-text-primary)" }}>
                  <input type="checkbox" checked={platforms.includes(p)} onChange={() => togglePlat(p)} className="hidden" />
                  {PLATFORMS[p].name}
                </label>
              ))}
            </div>
          </fieldset>

          <button type="submit" disabled={aiBusy || generating}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--accent-color)" }}>
            {generating || aiBusy ? "Menyusun..." : "Buat paket konten"}
          </button>
        </form>

        <div className="space-y-5">
          <section className="rounded-xl border p-5" style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold">Cari ide</h2>
              <span className="text-xs" style={{ color: "var(--theme-text-muted)" }}>6 ide sesuai profil</span>
            </div>
            <div className="flex gap-2">
              <input type="text" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Tema opsional"
                className="flex-1 px-3 py-2 rounded-lg border text-sm"
                style={{ background: "var(--theme-bg-primary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }} />
              <button type="button" onClick={handleBrainstorm} disabled={aiBusy}
                className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                style={{ background: "var(--accent-color)", color: "white" }}>
                Cari ide
              </button>
            </div>
            {ideas.length > 0 && (
              <div className="mt-3 divide-y" style={{ borderColor: "var(--theme-border)" }}>
                {ideas.map((x, i) => (
                  <div key={i} className="py-2.5 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{x.judul}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--theme-text-muted)" }}>{x.sudut}{x.hook ? ` - Hook: ${x.hook}` : ""}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button type="button" onClick={() => { setTopic(x.judul + (x.sudut ? ". " + x.sudut : "")); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        className="px-2.5 py-1 rounded border text-xs" style={{ borderColor: "var(--theme-border)" }}>
                        Pakai
                      </button>
                      <button type="button" onClick={() => { createCard({ title: x.judul, hook: x.hook, platforms: platforms.slice(0, 2) }); showToast("Ide disimpan"); }}
                        className="px-2.5 py-1 rounded border text-xs" style={{ borderColor: "var(--theme-border)" }}>
                        Simpan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

// ============ BOARD VIEW ============
function BoardView({ cards, updateCard, createCard, openModal, showToast, rules, profile, callAI }: any) {
  const [newTitle, setNewTitle] = useState("");

  async function addCard() {
    if (!newTitle.trim()) return;
    await createCard({ title: newTitle.trim(), platforms: profile.platforms.slice(0, 2) });
    setNewTitle("");
  }

  async function moveCard(c: StudioCard, dir: -1 | 1) {
    const idx = STAGES.findIndex((s) => s[0] === c.stage);
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= STAGES.length) return;
    const nextStage = STAGES[nextIdx][0];

    const updates: Partial<StudioCard> = { stage: nextStage };

    if (nextStage === "produksi" && rules.checklist) {
      const have = c.checklist.map((x) => x.t);
      const need = c.format === "carousel"
        ? ["Desain slide sesuai naskah", "Cek keterbacaan teks", "Ekspor gambar"]
        : ["Siapkan bahan dan lokasi", "Rekam sesuai adegan", "Edit + subtitle", "Buat cover"];
      updates.checklist = [...c.checklist, ...need.filter((t) => !have.includes(t)).map((t) => ({ t, done: false }))];
    }

    if (nextStage === "terjadwal" && rules.slot && !c.schedule) {
      const hm = (profile.times[c.platforms[0]] || "19:00").split(":").map(Number);
      const d = new Date();
      d.setHours(hm[0], hm[1], 0, 0);
      if (d <= new Date()) d.setDate(d.getDate() + 1);
      updates.schedule = toLocalInput(d);
    }

    if (nextStage === "terbit" && rules.postcheck) {
      const have = c.checklist.map((x) => x.t);
      const need = ["Balas komentar 60 menit pertama", "Catat performa 24 jam", "Catat performa 7 hari"];
      updates.checklist = [...(updates.checklist || c.checklist), ...need.filter((t) => !have.includes(t)).map((t) => ({ t, done: false }))];
    }

    await updateCard(c.id, updates);
    showToast(`Dipindah ke ${STAGES[nextIdx][1]}`);

    if (nextStage === "naskah" && rules.script && c.script.length === 0) {
      const prompt = `Topik: ${c.title}
Buat naskah video pendek 30 detik untuk ${c.platforms.map((p: Platform) => PLATFORMS[p].name).join(", ")}.
Balas HANYA JSON: {"judul":"...","hook":"maks 12 kata","adegan":[{"waktu":"0:00-0:03","visual":"...","narasi":"...","teks_layar":"..."}],"cta":"satu ajakan","platform":{${c.platforms.map((p: Platform) => p === "youtube" ? '"youtube":{"judul":"...","deskripsi":"...","hashtag":["3 kata"]}' : `"${p}":{"caption":"...","hashtag":["3 kata"]}`).join(",")}}}`;
      const r = await callAI(prompt);
      if (r && typeof r === "object") {
        const captions: Record<string, string> = {};
        const tags: Record<string, string[]> = {};
        let ytTitle = "", ytDesc = "";
        if (r.platform) {
          c.platforms.forEach((p: Platform) => {
            const pr = r.platform[p];
            if (!pr) return;
            if (p === "youtube") { ytTitle = String(pr.judul || ""); ytDesc = String(pr.deskripsi || ""); }
            else captions[p] = String(pr.caption || "");
            tags[p] = Array.isArray(pr.hashtag) ? pr.hashtag.map((t: string) => String(t).replace(/^#/, "")) : [];
          });
        }
        await updateCard(c.id, {
          hook: String(r.hook || ""),
          script: Array.isArray(r.adegan) ? r.adegan.map((a: any) => ({
            t: String(a.waktu || ""), visual: String(a.visual || ""),
            voice: String(a.narasi || ""), onscreen: String(a.teks_layar || ""),
          })) : [],
          captions, tags, ytTitle, ytDesc, cta: String(r.cta || ""),
        });
        showToast("Naskah dibuat otomatis");
      }
    }
  }

  return (
    <>
      <div className="flex flex-wrap justify-between items-end gap-3 mb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Pipeline</h1>
          <p className="text-sm mt-1" style={{ color: "var(--theme-text-muted)" }}>
            Pindahkan kartu dengan tombol panah. Aturan otomasi berjalan saat kartu masuk tahap baru.
          </p>
        </div>
        <div className="flex gap-2">
          <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCard()}
            placeholder="Tulis ide baru lalu Enter"
            className="px-3 py-2 rounded-lg border text-sm w-64"
            style={{ background: "var(--theme-bg-primary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }} />
          <button type="button" onClick={addCard} disabled={!newTitle.trim()}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--accent-color)" }}>
            Tambah
          </button>
        </div>
      </div>

      <div className="grid grid-flow-col auto-cols-[minmax(240px,1fr)] gap-3 overflow-x-auto pb-3">
        {STAGES.map((s, idx) => {
          const its = cards.filter((c: StudioCard) => c.stage === s[0]);
          return (
            <section key={s[0]} className="rounded-xl border p-2.5 min-h-[140px]"
              style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)" }}>
              <header className="flex items-center justify-between px-1 pb-2">
                <h3 className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--theme-text-muted)" }}>{s[1]}</h3>
                <span className="text-xs font-mono" style={{ color: "var(--theme-text-muted)" }}>{its.length}</span>
              </header>
              <div className="space-y-2">
                {its.length === 0 ? (
                  <p className="text-xs text-center py-4 rounded-lg border border-dashed" style={{ color: "var(--theme-text-muted)", borderColor: "var(--theme-border)" }}>Kosong</p>
                ) : its.map((c: StudioCard) => (
                  <article key={c.id} className="rounded-lg border"
                    style={{ background: "var(--theme-bg-primary)", borderColor: "var(--theme-border)" }}>
                    <button type="button" onClick={() => openModal(c.id)}
                      className="w-full text-left px-3 pt-2.5 pb-1.5 rounded-t-lg hover:opacity-80">
                      <div className="font-semibold text-sm line-clamp-2">{c.title || "Tanpa judul"}</div>
                      {c.hook && <div className="text-xs mt-1 line-clamp-2" style={{ color: "var(--theme-text-muted)" }}>{c.hook}</div>}
                      <div className="flex flex-wrap gap-1.5 mt-1.5 text-xs" style={{ color: "var(--theme-text-muted)" }}>
                        {c.platforms.map((p) => (
                          <span key={p} className="w-2 h-2 rounded-full" style={{ background: PLATFORMS[p] ? `var(--${p})` : "var(--theme-text-muted)" }} />
                        ))}
                        {c.schedule && <span className="font-mono ml-1">{fmtWhen(c.schedule)}</span>}
                      </div>
                    </button>
                    <div className="flex justify-between px-2 pb-2">
                      <button type="button" onClick={() => moveCard(c, -1)} disabled={idx === 0}
                        className="w-7 h-7 grid place-items-center rounded border disabled:opacity-30"
                        style={{ borderColor: "var(--theme-border)" }}>{'<'}</button>
                      <button type="button" onClick={() => moveCard(c, 1)} disabled={idx === STAGES.length - 1}
                        className="w-7 h-7 grid place-items-center rounded border disabled:opacity-30"
                        style={{ borderColor: "var(--theme-border)" }}>{'>'}</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

// ============ CALENDAR VIEW ============
function CalendarView({ cards, cal, setCal, openModal, createCard, showToast, profile }: any) {
  const { y, m, sel } = cal;
  const first = new Date(y, m, 1);
  const start = (first.getDay() + 6) % 7;
  const dn = new Date(y, m + 1, 0).getDate();
  const today = ymd(new Date());

  const map: Record<string, StudioCard[]> = {};
  cards.forEach((c: StudioCard) => {
    if (c.schedule) {
      const k = c.schedule.slice(0, 10);
      (map[k] = map[k] || []).push(c);
    }
  });

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < start; i++) cells.push(<span key={`b${i}`} className="invisible" />);
  for (let d = 1; d <= dn; d++) {
    const k = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const its = map[k] || [];
    cells.push(
      <button key={k} type="button" onClick={() => setCal({ ...cal, sel: k })}
        className="min-h-[60px] md:min-h-[74px] p-1 md:p-1.5 rounded-lg border text-left flex flex-col gap-1 hover:opacity-80"
        style={{
          background: "var(--theme-bg-secondary)",
          borderColor: k === sel ? "var(--accent-color)" : "var(--theme-border)",
          boxShadow: k === sel ? "0 0 0 2px var(--accent-color)" : "none",
        }}>
        <span className="text-xs font-mono" style={{ color: k === today ? "var(--accent-color)" : "var(--theme-text-muted)" }}>{d}</span>
        <span className="flex flex-wrap gap-0.5">
          {its.slice(0, 4).map((c: StudioCard) => (
            <span key={c.id} className="w-2 h-2 rounded-full" style={{ background: c.platforms[0] ? `var(--${c.platforms[0]})` : "var(--theme-text-muted)" }} />
          ))}
          {its.length > 4 && <span className="text-xs" style={{ color: "var(--theme-text-muted)" }}>+{its.length - 4}</span>}
        </span>
      </button>
    );
  }

  const its = (map[sel] || []).slice().sort((a, b) => (a.schedule || "").localeCompare(b.schedule || ""));
  const sd = new Date(sel + "T00:00");

  async function addHere() {
    const pl = profile.platforms.slice(0, 2);
    const hm = profile.times[pl[0] || "tiktok"] || "19:00";
    const nc = await createCard({
      title: "Ide baru", platforms: pl,
      schedule: `${sel}T${hm}`,
    });
    if (nc) openModal(nc.id);
  }

  return (
    <>
      <div className="mb-5">
        <h1 className="text-3xl font-extrabold tracking-tight">Kalender</h1>
        <p className="text-sm mt-1" style={{ color: "var(--theme-text-muted)" }}>Semua konten dengan jadwal tayang. Titik warna menandai platform.</p>
      </div>

      <div className="space-y-4">
        <section className="rounded-xl border p-4" style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)" }}>
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => { const nm = m - 1; setCal(nm < 0 ? { y: y - 1, m: 11, sel } : { ...cal, m: nm }); }}
              className="px-3 py-1.5 rounded border text-sm" style={{ borderColor: "var(--theme-border)" }}>{'<'}</button>
            <h2 className="font-bold">{MONTHS[m]} {y}</h2>
            <button type="button" onClick={() => { const nm = m + 1; setCal(nm > 11 ? { y: y + 1, m: 0, sel } : { ...cal, m: nm }); }}
              className="px-3 py-1.5 rounded border text-sm" style={{ borderColor: "var(--theme-border)" }}>{'>'}</button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {DOW.map((d) => <div key={d} className="text-center text-xs py-1 uppercase tracking-wider" style={{ color: "var(--theme-text-muted)" }}>{d}</div>)}
            {cells}
          </div>
        </section>

        <section className="rounded-xl border p-4" style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">{sd.getDate()} {MONTHS[sd.getMonth()]}</h2>
            <button type="button" onClick={addHere}
              className="px-3 py-1.5 rounded border text-sm" style={{ borderColor: "var(--theme-border)" }}>
              Tambah ide di tanggal ini
            </button>
          </div>
          {its.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: "var(--theme-text-muted)" }}>Belum ada konten di tanggal ini.</p>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--theme-border)" }}>
              {its.map((c) => (
                <div key={c.id} className="grid grid-cols-[auto_1fr_auto_auto] gap-2 items-center py-2">
                  <span className="text-xs font-mono">{c.schedule?.slice(11, 16)}</span>
                  <span className="text-sm truncate"><b>{c.title || "Tanpa judul"}</b></span>
                  <span className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: "var(--theme-border)", color: "var(--theme-text-muted)" }}>{stageName(c.stage)}</span>
                  <button type="button" onClick={() => openModal(c.id)}
                    className="px-2 py-1 rounded border text-xs" style={{ borderColor: "var(--theme-border)" }}>Buka</button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

// ============ AUTO VIEW ============
function AutoView({ profile, saveProfile, rules, setRules, cards, createCard, callAI, showToast, setView }: any) {
  async function fillWeek() {
    const pl = profile.platforms.length ? profile.platforms : ["tiktok"];
    const prompt = `PROFIL MEREK
Merek: ${profile.brand || "-"}
Niche: ${profile.niche || "-"}
Pilar: ${profile.pillars || "-"}
Platform: ${pl.map((p: Platform) => PLATFORMS[p].name).join(", ")}

Rencanakan 7 ide konten, satu per hari untuk 7 hari ke depan, putar pilar.
Balas HANYA JSON array: [{"judul":"...","hook":"maks 12 kata","pilar":"salah satu pilar","format":"short atau carousel atau long"}]`;
    const r = await callAI(prompt);
    if (!Array.isArray(r)) return;
    const hm = (profile.times[pl[0]] || "19:00").split(":").map(Number);
    let n = 0;
    for (let i = 0; i < Math.min(7, r.length); i++) {
      const x = r[i];
      if (!x || !x.judul) continue;
      const d = new Date();
      d.setDate(d.getDate() + 1 + i);
      d.setHours(hm[0], hm[1], 0, 0);
      await createCard({
        title: String(x.judul),
        hook: String(x.hook || ""),
        pillar: String(x.pilar || ""),
        format: FORMATS[x.format as Format] ? x.format : "short",
        platforms: pl.slice(),
        schedule: toLocalInput(d),
      });
      n++;
    }
    showToast(`${n} ide ditambahkan`);
    setView("board");
  }

  function exportCSV() {
    const rows: string[][] = [["tanggal", "jam", "platform", "judul", "caption", "hashtag", "status"]];
    cards.filter((c: StudioCard) => c.schedule).sort((a: StudioCard, b: StudioCard) => (a.schedule || "").localeCompare(b.schedule || "")).forEach((c: StudioCard) => {
      c.platforms.forEach((pid) => {
        const p = PLATFORMS[pid];
        rows.push([
          c.schedule!.slice(0, 10),
          c.schedule!.slice(11, 16),
          p ? p.name : pid,
          pid === "youtube" ? c.ytTitle : c.title,
          pid === "youtube" ? c.ytDesc : (c.captions[pid] || ""),
          (c.tags[pid] || []).map((t) => "#" + t).join(" "),
          stageName(c.stage),
        ]);
      });
    });
    if (rows.length === 1) { showToast("Belum ada konten dengan jadwal"); return; }
    const csv = rows.map((r) => r.map((v) => /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "jadwal-konten.csv"; a.click();
    URL.revokeObjectURL(url);
    showToast("CSV diekspor");
  }

  function exportJSON() {
    const data = { profile, cards };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "cadangan-studio-konten.json"; a.click();
    URL.revokeObjectURL(url);
    showToast("JSON diekspor");
  }

  const ruleItem = (k: keyof typeof rules, title: string, desc: string) => (
    <label className="flex items-start gap-3 py-2.5 cursor-pointer border-t" style={{ borderColor: "var(--theme-border)" }}>
      <input type="checkbox" checked={rules[k]} onChange={(e) => setRules({ ...rules, [k]: e.target.checked })}
        className="mt-0.5 w-5 h-5 accent-current shrink-0" style={{ accentColor: "var(--accent-color)" }} />
      <span className="flex-1">
        <b className="block text-sm">{title}</b>
        <span className="text-xs block mt-0.5" style={{ color: "var(--theme-text-muted)" }}>{desc}</span>
      </span>
    </label>
  );

  return (
    <>
      <div className="mb-5">
        <h1 className="text-3xl font-extrabold tracking-tight">Otomasi dan profil</h1>
        <p className="text-sm mt-1" style={{ color: "var(--theme-text-muted)" }}>Semua konten dengan jadwal tayang. Titik warna menandai platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <section className="rounded-xl border p-5 space-y-3" style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)" }}>
          <h2 className="font-bold mb-2">Profil merek</h2>
          {([
            ["brand", "Nama merek"],
            ["niche", "Niche"],
            ["voice", "Gaya bahasa"],
            ["hashtags", "Hashtag tetap"],
            ["cta", "CTA bawaan"],
          ] as [keyof StudioProfile, string][]).map(([k, l]) => (
            <label key={k} className="block">
              <span className="text-xs uppercase font-semibold" style={{ color: "var(--theme-text-muted)" }}>{l}</span>
              <input type="text" value={String(profile[k] || "")} onChange={(e) => saveProfile({ [k]: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg border text-sm"
                style={{ background: "var(--theme-bg-primary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }} />
            </label>
          ))}
          {([["audience", "Audiens"], ["pillars", "Pilar konten"]] as [keyof StudioProfile, string][]).map(([k, l]) => (
            <label key={k} className="block">
              <span className="text-xs uppercase font-semibold" style={{ color: "var(--theme-text-muted)" }}>{l}</span>
              <textarea rows={2} value={String(profile[k] || "")} onChange={(e) => saveProfile({ [k]: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg border text-sm"
                style={{ background: "var(--theme-bg-primary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }} />
            </label>
          ))}
        </section>

        <div className="space-y-5">
          <section className="rounded-xl border p-5" style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)" }}>
            <h2 className="font-bold mb-2">Aturan pipeline</h2>
            {ruleItem("script", "Naskah otomatis", "Saat kartu masuk Naskah dan kosong, AI menulis naskah.")}
            {ruleItem("checklist", "Daftar produksi otomatis", "Saat kartu masuk Produksi, tugas ditambahkan.")}
            {ruleItem("slot", "Jadwal otomatis", "Saat kartu masuk Terjadwal tanpa tanggal, slot kosong dipilih.")}
            {ruleItem("postcheck", "Tugas pasca tayang", "Saat kartu masuk Terbit, tambah tugas pasca-tayang.")}
          </section>

          <section className="rounded-xl border p-5" style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)" }}>
            <h2 className="font-bold mb-2">Rencana mingguan</h2>
            <p className="text-xs mb-3" style={{ color: "var(--theme-text-muted)" }}>AI membuat 7 ide untuk 7 hari ke depan.</p>
            <button type="button" onClick={fillWeek}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: "var(--accent-color)" }}>
              Isi 7 hari ke depan
            </button>
          </section>

          <section className="rounded-xl border p-5" style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)" }}>
            <h2 className="font-bold mb-2">Ekspor</h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={exportCSV}
                className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--theme-border)" }}>
                CSV
              </button>
              <button type="button" onClick={exportJSON}
                className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--theme-border)" }}>
                JSON
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

// ============ EDITOR MODAL ============
function EditorModal({
  card,
  updateCard,
  deleteCard,
  closeModal,
  callAI,
  aiBusy,
  showToast,
  profile,
  generateTTS,
  ttsBusy,
  audioUrl,
  ttsLang,
  setTtsLang,
}: any) {
  const [draft, setDraft] = useState<StudioCard>(card);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [ttsText, setTtsText] = useState<string>("");
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => { setDraft(card); }, [card.id]);

  useEffect(() => {
    const narration = draft.script.map((r) => r.voice).filter(Boolean).join(" ");
    if (narration && !ttsText) setTtsText(narration);
  }, [draft.script, ttsText]);

  useEffect(() => {
    return () => {
      if (audioEl) { audioEl.pause(); audioEl.src = ""; }
    };
  }, [audioEl]);

  async function save(updates: Partial<StudioCard>) {
    const next = { ...draft, ...updates };
    setDraft(next);
    await updateCard(card.id, updates);
  }

  async function genScript() {
    if (!draft.title && !draft.hook) { showToast("Isi judul atau hook dulu"); return; }
    setAiLoading("script");
    try {
      const prompt = `PROFIL MEREK
Merek: ${profile.brand || "-"}
Niche: ${profile.niche || "-"}
Gaya bahasa: ${profile.voice || "-"}

BRIEF
Topik: ${draft.title}
Hook: ${draft.hook || "(belum ada)"}
Format: ${FORMATS[draft.format]}
Platform: ${draft.platforms.map((p) => PLATFORMS[p].name).join(", ")}

Balas HANYA JSON: {"judul":"...","hook":"maks 12 kata","adegan":[{"waktu":"0:00-0:03","visual":"...","narasi":"...","teks_layar":"..."}],"cta":"...","platform":{${draft.platforms.map((p) => p === "youtube" ? '"youtube":{"judul":"...","deskripsi":"...","hashtag":["3 kata"]}' : `"${p}":{"caption":"...","hashtag":["3 kata"]}`).join(",")}}}`;
      const r = await callAI(prompt);
      if (r && typeof r === "object") {
        const captions: Record<string, string> = { ...draft.captions };
        const tags: Record<string, string[]> = { ...draft.tags };
        let ytTitle = draft.ytTitle, ytDesc = draft.ytDesc;
        if (r.platform) {
          draft.platforms.forEach((p) => {
            const pr = r.platform[p];
            if (!pr) return;
            if (p === "youtube") { ytTitle = String(pr.judul || ""); ytDesc = String(pr.deskripsi || ""); }
            else captions[p] = String(pr.caption || "");
            tags[p] = Array.isArray(pr.hashtag) ? pr.hashtag.map((t: string) => String(t).replace(/^#/, "")) : [];
          });
        }
        await save({
          title: draft.title || String(r.judul || ""),
          hook: String(r.hook || draft.hook),
          script: Array.isArray(r.adegan) ? r.adegan.map((a: any) => ({
            t: String(a.waktu || ""), visual: String(a.visual || ""),
            voice: String(a.narasi || ""), onscreen: String(a.teks_layar || ""),
          })) : draft.script,
          captions, tags, ytTitle, ytDesc, cta: String(r.cta || draft.cta),
        });
        showToast("Naskah dibuat");
      }
    } finally { setAiLoading(null); }
  }

  async function genHook() {
    setAiLoading("hook");
    try {
      const prompt = `Topik: ${draft.title}
Hook saat ini: ${draft.hook || "(belum ada)"}
Tulis 5 alternatif hook (pertanyaan, pernyataan berani, angka, cerita, kontras). Maks 12 kata.
Balas HANYA JSON array berisi 5 string.`;
      const r = await callAI(prompt);
      if (Array.isArray(r)) {
        const choice = window.prompt("Pilih hook (1-5):\n" + r.map((h, i) => `${i + 1}. ${h}`).join("\n"), r[0] || "");
        if (choice) {
          const idx = parseInt(choice);
          const pick = (!isNaN(idx) && r[idx - 1]) ? r[idx - 1] : choice;
          await save({ hook: String(pick) });
          showToast("Hook diupdate");
        }
      }
    } finally { setAiLoading(null); }
  }

  async function genPrompts() {
    setAiLoading("prompts");
    try {
      const scriptText = draft.script.map((r) => `[${r.t}] Visual: ${r.visual} | Narasi: ${r.voice}`).join("\n");
      const prompt = `Judul: ${draft.title}
Hook: ${draft.hook}
Naskah:
${scriptText || "(belum ada)"}

Buat prompt untuk AI generator video, image, dan voice (dalam bahasa Inggris).
Balas HANYA JSON: {"video":"prompt video untuk semua adegan","image":"prompt image untuk cover","voice":"arahan voice + narasi"}`;
      const r = await callAI(prompt);
      if (r && typeof r === "object") {
        await save({
          prompts: {
            video: String(r.video || ""),
            image: String(r.image || ""),
            voice: String(r.voice || ""),
          },
        });
        showToast("Prompts dibuat");
      }
    } finally { setAiLoading(null); }
  }

  function addScriptRow() {
    save({ script: [...draft.script, { t: "", visual: "", voice: "", onscreen: "" }] });
  }

  function updScriptRow(i: number, k: keyof ScriptRow, v: string) {
    const n = [...draft.script];
    n[i] = { ...n[i], [k]: v };
    save({ script: n });
  }

  function delScriptRow(i: number) {
    save({ script: draft.script.filter((_, idx) => idx !== i) });
  }

  function togglePlat(p: Platform) {
    const has = draft.platforms.includes(p);
    save({ platforms: has ? draft.platforms.filter((x) => x !== p) : [...draft.platforms, p] });
  }

  async function handleGenerateTTS() {
    const text =
      ttsText.trim() ||
      draft.script.map((r) => r.voice).filter(Boolean).join(" ");
    if (!text) {
      showToast("Isi teks narasi dulu atau tulis naskah");
      return;
    }
    const url = await generateTTS(card.id, text, draft.pOpt.ttsVoice || undefined, ttsLang);
    if (url) {
      const audio = new Audio(url);
      setAudioEl(audio);
      audio.onended = () => setIsPlaying(false);
      audio.onplay = () => setIsPlaying(true);
      audio.play().catch((e) => console.error("Autoplay blocked:", e));
    }
  }

  function handlePlayAudio() {
    if (!audioUrl) return;
    if (audioEl && !audioEl.paused) {
      audioEl.pause();
      setIsPlaying(false);
      return;
    }
    const audio = new Audio(audioUrl);
    setAudioEl(audio);
    audio.onended = () => setIsPlaying(false);
    audio.onplay = () => setIsPlaying(true);
    audio.play().catch((e) => console.error("Play error:", e));
  }

  function handleDownloadAudio() {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `${(draft.title || "narasi").slice(0, 30).replace(/[^\w]/g, "-")}.wav`;
    a.click();
    showToast("Audio diunduh");
  }

  function copyPack(pid: Platform) {
    const tags = (draft.tags[pid] || []).map((t) => "#" + t).join(" ");
    const text = pid === "youtube" ? draft.ytTitle + "\n\n" + draft.ytDesc + (tags ? "\n\n" + tags : "") : (draft.captions[pid] || "") + (tags ? "\n\n" + tags : "");
    navigator.clipboard.writeText(text).then(() => showToast("Disalin")).catch(() => showToast("Gagal copy"));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="w-full max-w-4xl rounded-2xl border my-4"
        style={{ background: "var(--theme-bg-primary)", borderColor: "var(--theme-border)" }}>
        <header className="flex justify-between items-center p-4 border-b" style={{ borderColor: "var(--theme-border)" }}>
          <h2 className="font-bold text-lg truncate">{draft.title || "Detail konten"}</h2>
          <button type="button" onClick={closeModal}
            className="px-3 py-1.5 rounded-lg border text-sm" style={{ borderColor: "var(--theme-border)" }}>
            Tutup
          </button>
        </header>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs uppercase font-semibold" style={{ color: "var(--theme-text-muted)" }}>Judul internal</span>
              <input type="text" value={draft.title} onChange={(e) => save({ title: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg border text-sm"
                style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }} />
            </label>
            <label className="block">
              <span className="text-xs uppercase font-semibold" style={{ color: "var(--theme-text-muted)" }}>Tahap</span>
              <select value={draft.stage} onChange={(e) => save({ stage: e.target.value as Stage })}
                className="w-full mt-1 px-3 py-2 rounded-lg border text-sm"
                style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }}>
                {STAGES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs uppercase font-semibold" style={{ color: "var(--theme-text-muted)" }}>Jadwal tayang</span>
              <input type="datetime-local" value={draft.schedule || ""} onChange={(e) => save({ schedule: e.target.value || null })}
                className="w-full mt-1 px-3 py-2 rounded-lg border text-sm"
                style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }} />
            </label>
            <label className="block">
              <span className="text-xs uppercase font-semibold" style={{ color: "var(--theme-text-muted)" }}>Format</span>
              <select value={draft.format} onChange={(e) => save({ format: e.target.value as Format })}
                className="w-full mt-1 px-3 py-2 rounded-lg border text-sm"
                style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }}>
                {Object.entries(FORMATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
          </div>

          <div>
            <span className="text-xs uppercase font-semibold" style={{ color: "var(--theme-text-muted)" }}>Platform</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {(Object.keys(PLATFORMS) as Platform[]).map((p) => (
                <label key={p} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border cursor-pointer text-sm"
                  style={{
                    background: draft.platforms.includes(p) ? "var(--accent-color)" : "var(--theme-bg-secondary)",
                    borderColor: "var(--theme-border)",
                    color: draft.platforms.includes(p) ? "white" : "var(--theme-text-primary)",
                  }}>
                  <input type="checkbox" checked={draft.platforms.includes(p)} onChange={() => togglePlat(p)} className="hidden" />
                  {PLATFORMS[p].name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs uppercase font-semibold" style={{ color: "var(--theme-text-muted)" }}>Hook</span>
            <div className="flex gap-2 mt-1">
              <input type="text" value={draft.hook} onChange={(e) => save({ hook: e.target.value })}
                className="flex-1 px-3 py-2 rounded-lg border text-sm"
                style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }} />
              <button type="button" onClick={genHook} disabled={aiBusy || aiLoading !== null}
                className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50" style={{ borderColor: "var(--theme-border)" }}>
                {aiLoading === "hook" ? "..." : "Variasi"}
              </button>
            </div>
          </div>

          <section>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-sm">Naskah per adegan</h3>
              <div className="flex gap-2">
                <button type="button" onClick={addScriptRow}
                  className="px-2.5 py-1 rounded border text-xs" style={{ borderColor: "var(--theme-border)" }}>+ Adegan</button>
                <button type="button" onClick={genScript} disabled={aiBusy || aiLoading !== null}
                  className="px-2.5 py-1 rounded border text-xs disabled:opacity-50" style={{ borderColor: "var(--theme-border)" }}>
                  {aiLoading === "script" ? "..." : "Tulis naskah (AI)"}
                </button>
              </div>
            </div>
            {draft.script.length === 0 ? (
              <p className="text-xs text-center py-4 rounded-lg border border-dashed" style={{ color: "var(--theme-text-muted)", borderColor: "var(--theme-border)" }}>
                Belum ada naskah.
              </p>
            ) : draft.script.map((row, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-[100px_1fr_1fr_1fr_32px] gap-2 mb-2 p-2 rounded-lg border"
                style={{ borderColor: "var(--theme-border)" }}>
                <input type="text" value={row.t} onChange={(e) => updScriptRow(i, "t", e.target.value)} placeholder="0:00-0:03"
                  className="px-2 py-1.5 rounded border text-xs font-mono"
                  style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }} />
                <textarea rows={2} value={row.visual} onChange={(e) => updScriptRow(i, "visual", e.target.value)} placeholder="Visual"
                  className="px-2 py-1.5 rounded border text-xs"
                  style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }} />
                <textarea rows={2} value={row.voice} onChange={(e) => updScriptRow(i, "voice", e.target.value)} placeholder="Narasi"
                  className="px-2 py-1.5 rounded border text-xs"
                  style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }} />
                <textarea rows={2} value={row.onscreen} onChange={(e) => updScriptRow(i, "onscreen", e.target.value)} placeholder="Teks layar"
                  className="px-2 py-1.5 rounded border text-xs"
                  style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }} />
                <button type="button" onClick={() => delScriptRow(i)}
                  className="w-7 h-7 grid place-items-center rounded border text-sm" style={{ borderColor: "var(--theme-border)" }}>x</button>
              </div>
            ))}
          </section>

          <section>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-sm">Prompt untuk AI generator</h3>
              <button type="button" onClick={genPrompts} disabled={aiBusy || aiLoading !== null}
                className="px-2.5 py-1 rounded border text-xs disabled:opacity-50" style={{ borderColor: "var(--theme-border)" }}>
                {aiLoading === "prompts" ? "..." : "Buat prompt"}
              </button>
            </div>
            {(["video", "image", "voice"] as const).map((k) => (
              <div key={k} className="mb-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium capitalize" style={{ color: "var(--theme-text-muted)" }}>{k}</span>
                  {draft.prompts[k] && (
                    <button type="button" onClick={() => { navigator.clipboard.writeText(draft.prompts[k] || ""); showToast("Disalin"); }}
                      className="text-xs px-2 py-0.5 rounded border" style={{ borderColor: "var(--theme-border)" }}>Salin</button>
                  )}
                </div>
                <textarea rows={draft.prompts[k] ? 4 : 2} value={draft.prompts[k] || ""} onChange={(e) => save({ prompts: { ...draft.prompts, [k]: e.target.value } })}
                  placeholder={`Prompt ${k} (klik Buat prompt)`}
                  className="w-full px-2 py-1.5 rounded border text-xs font-mono"
                  style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }} />
              </div>
            ))}
          </section>

          <section>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-sm">Text-to-Speech (AI Suara)</h3>
              <div className="flex gap-2">
                {audioUrl && (
                  <>
                    <button
                      type="button"
                      onClick={handlePlayAudio}
                      className="px-2.5 py-1 rounded border text-xs"
                      style={{ borderColor: "var(--theme-border)" }}
                    >
                      {isPlaying ? "Pause" : "Putar"}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadAudio}
                      className="px-2.5 py-1 rounded border text-xs"
                      style={{ borderColor: "var(--theme-border)" }}
                    >
                      Unduh
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleGenerateTTS}
                  disabled={ttsBusy === card.id}
                  className="px-2.5 py-1 rounded border text-xs disabled:opacity-50"
                  style={{ borderColor: "var(--theme-border)" }}
                >
                  {ttsBusy === card.id ? "Membuat audio..." : audioUrl ? "Buat ulang" : "Generate Suara"}
                </button>
              </div>
            </div>

            <label className="block mb-2">
              <span className="text-xs" style={{ color: "var(--theme-text-muted)" }}>Bahasa</span>
              <select
                value={ttsLang}
                onChange={(e) => setTtsLang(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 rounded border text-sm"
                style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }}
              >
                <option value="id-ID">Indonesia</option>
                <option value="su-ID">Sunda (Uji Coba)</option>
                <option value="jv-ID">Jawa (Uji Coba)</option>
                <option value="en-US">Inggris (English)</option>
              </select>
            </label>

            <label className="block mb-2">
              <span className="text-xs" style={{ color: "var(--theme-text-muted)" }}>Suara</span>
              <select
                value={draft.pOpt.ttsVoice || "Kore"}
                onChange={(e) => save({ pOpt: { ...draft.pOpt, ttsVoice: e.target.value } })}
                className="w-full mt-1 px-2 py-1.5 rounded border text-sm"
                style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }}
              >
                <option value="Kore">Kore (Perempuan hangat)</option>
                <option value="Aoede">Aoede (Perempuan ceria)</option>
                <option value="Leda">Leda (Perempuan muda)</option>
                <option value="Puck">Puck (Laki-laki energik)</option>
                <option value="Charon">Charon (Laki-laki dalam)</option>
                <option value="Fenrir">Fenrir (Laki-laki tegas)</option>
                <option value="Orus">Orus (Laki-laki hangat)</option>
                <option value="Zephyr">Zephyr (Perempuan lembut)</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs" style={{ color: "var(--theme-text-muted)" }}>
                Teks narasi ({ttsText.length} karakter, maks 5000)
              </span>
              <textarea
                rows={4}
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
                placeholder="Narasi dari naskah akan otomatis muncul di sini."
                className="w-full mt-1 px-2 py-1.5 rounded border text-sm"
                style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }}
              />
            </label>

            {audioUrl && (
              <audio
                controls
                src={audioUrl}
                className="w-full mt-2"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              />
            )}

            <p className="text-xs mt-2" style={{ color: "var(--theme-text-muted)" }}>
              Suara via Gemini TTS. Butuh GEMINI_API_KEY di .env.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-sm mb-2">Caption dan hashtag</h3>
            {draft.platforms.map((pid) => {
              const p = PLATFORMS[pid];
              const isYT = pid === "youtube";
              const val = isYT ? draft.ytDesc : (draft.captions[pid] || "");
              const len = isYT ? draft.ytDesc.length : val.length;
              return (
                <div key={pid} className="mb-3 rounded-lg border p-3" style={{ borderColor: "var(--theme-border)" }}>
                  <div className="flex justify-between items-center mb-2">
                    <b className="text-sm">{p.name}</b>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono" style={{ color: len > p.cap ? "#fca5a5" : "var(--theme-text-muted)" }}>
                        {fmtNum(len)} / {fmtNum(p.cap)}
                      </span>
                      <button type="button" onClick={() => copyPack(pid)}
                        className="px-2 py-0.5 rounded border text-xs" style={{ borderColor: "var(--theme-border)" }}>Salin</button>
                    </div>
                  </div>
                  {isYT && (
                    <input type="text" value={draft.ytTitle} onChange={(e) => save({ ytTitle: e.target.value })} placeholder="Judul YouTube"
                      className="w-full mb-2 px-2 py-1.5 rounded border text-sm"
                      style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }} />
                  )}
                  <textarea rows={3} value={val} onChange={(e) => save(isYT ? { ytDesc: e.target.value } : { captions: { ...draft.captions, [pid]: e.target.value } })}
                    placeholder={isYT ? "Deskripsi YouTube" : "Caption"}
                    className="w-full px-2 py-1.5 rounded border text-sm mb-2"
                    style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }} />
                  <input type="text" value={(draft.tags[pid] || []).join(" ")} onChange={(e) => save({ tags: { ...draft.tags, [pid]: e.target.value.split(/\s+/).map((x) => x.replace(/^#/, "")).filter(Boolean) } })}
                    placeholder="Hashtag (tanpa #, pisah spasi)"
                    className="w-full px-2 py-1.5 rounded border text-xs"
                    style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }} />
                </div>
              );
            })}
          </section>

          {draft.stage === "terbit" && (
            <section>
              <h3 className="font-semibold text-sm mb-2">Performa</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(["views", "likes", "comments", "shares"] as const).map((k) => (
                  <label key={k} className="block">
                    <span className="text-xs capitalize" style={{ color: "var(--theme-text-muted)" }}>{k}</span>
                    <input type="number" value={draft.perf[k]} onChange={(e) => save({ perf: { ...draft.perf, [k]: e.target.value } })}
                      className="w-full mt-1 px-2 py-1.5 rounded border text-sm"
                      style={{ background: "var(--theme-bg-secondary)", borderColor: "var(--theme-border)", color: "var(--theme-text-primary)" }} />
                  </label>
                ))}
              </div>
            </section>
          )}

          <div className="flex flex-wrap justify-between gap-2 pt-3 border-t" style={{ borderColor: "var(--theme-border)" }}>
            <button type="button" onClick={() => {
              if (window.confirm("Hapus kartu ini?")) { deleteCard(draft.id); closeModal(); showToast("Kartu dihapus"); }
            }}
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5" }}>
              Hapus kartu
            </button>
            <button type="button" onClick={closeModal}
              className="px-4 py-2 rounded-lg border text-sm font-semibold"
              style={{ borderColor: "var(--theme-border)" }}>
              Selesai
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}