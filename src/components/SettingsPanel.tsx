'use client';

import { useState } from 'react';
import { useSettings, SettingsUpdate, UserSettings } from '@/lib/settings-context';
import { THEMES, ACCENT_PRESETS } from '@/lib/theme-engine';

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="border rounded-xl p-5"
      style={{
        borderColor: 'var(--theme-border)',
        background: 'var(--theme-card-bg)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <header className="mb-4">
        <h3 className="text-base font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
          {title}
        </h3>
        {description && (
          <p className="text-sm mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            {description}
          </p>
        )}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <div className="text-sm font-medium" style={{ color: 'var(--theme-text-primary)' }}>
          {label}
        </div>
        {hint && (
          <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            {hint}
          </div>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50"
      style={{ background: checked ? 'var(--accent-color)' : 'var(--theme-bg-tertiary)' }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
        style={{ transform: checked ? 'translateX(24px)' : 'translateX(4px)' }}
      />
    </button>
  );
}

function NumberSlider({
  value,
  onChange,
  min,
  max,
  step,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-40"
        style={{ accentColor: 'var(--accent-color)' }}
      />
      <span className="text-sm font-mono w-10" style={{ color: 'var(--theme-text-secondary)' }}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm rounded-lg border px-3 py-1.5 disabled:opacity-50"
      style={{
        background: 'var(--theme-bg-tertiary)',
        borderColor: 'var(--theme-border)',
        color: 'var(--theme-text-primary)',
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function ThemePicker({
  current,
  onChange,
  disabled,
}: {
  current: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
      {THEMES.map((t) => {
        const active = current === t.id;
        return (
          <button
            key={t.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(t.id)}
            className="group relative p-3 rounded-xl border-2 transition-all text-left overflow-hidden"
            style={{
              borderColor: active ? 'var(--accent-color)' : 'var(--theme-border)',
              background: t.gradient,
              boxShadow: active ? '0 0 20px var(--accent-glow)' : 'none',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0"
                style={{ background: t.cardBg, border: '1px solid ' + t.border }}
              >
                {t.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate" style={{ color: t.textPrimary }}>
                  {t.name}
                </div>
              </div>
              {active && (
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white shrink-0"
                  style={{ background: 'var(--accent-color)' }}
                >
                  ✓
                </div>
              )}
            </div>

            <div className="text-[10px] truncate" style={{ color: t.textMuted }}>
              {t.description}
            </div>

            <div className="flex gap-1 mt-2">
              <div className="w-3 h-3 rounded-full" style={{ background: t.bgPrimary }} />
              <div className="w-3 h-3 rounded-full" style={{ background: t.bgSecondary }} />
              <div className="w-3 h-3 rounded-full" style={{ background: t.bgTertiary }} />
              <div className="w-3 h-3 rounded-full" style={{ background: t.textPrimary }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function AccentPicker({
  current,
  onChange,
  disabled,
}: {
  current: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {ACCENT_PRESETS.map((p) => {
          const active = current.toLowerCase() === p.color.toLowerCase();
          return (
            <button
              key={p.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(p.color)}
              title={p.name}
              className="w-9 h-9 rounded-full transition-all hover:scale-110 flex items-center justify-center"
              style={{
                background: p.color,
                boxShadow: active ? '0 0 0 3px var(--theme-bg-primary), 0 0 0 5px ' + p.color : 'none',
              }}
            >
              {active && <span className="text-white text-xs font-bold">✓</span>}
            </button>
          );
        })}
      </div>

      <Row label="Custom Color" hint="Pilih warna aksen kustom">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono" style={{ color: 'var(--theme-text-muted)' }}>
            {current}
          </span>
          <input
            type="color"
            value={current}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-8 rounded cursor-pointer disabled:opacity-50"
          />
        </div>
      </Row>
    </div>
  );
}

export default function SettingsPanel() {
  const { settings, loading, saving, error, updateSettings, resetSettings } = useSettings();
  const [resetting, setResetting] = useState(false);

  const handle = <K extends keyof SettingsUpdate>(key: K, value: SettingsUpdate[K]) => {
    void updateSettings({ [key]: value } as SettingsUpdate);
  };

  const handleReset = async () => {
    if (!confirm('Reset semua pengaturan ke default?')) return;
    setResetting(true);
    try {
      await resetSettings();
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: 'var(--theme-text-muted)' }}>
        <div className="animate-pulse">Memuat pengaturan...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: 'var(--theme-text-muted)' }}>
        <div className="text-3xl">!</div>
        <div className="font-semibold">Gagal memuat pengaturan</div>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 px-4 py-2 rounded-lg transition"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent-color)' }}
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const s: UserSettings = settings;
  const busy = saving || resetting;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            Pengaturan
          </h2>
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            Kelola preferensi Nova-Pulse kamu
          </p>
        </div>
        <button
          onClick={handleReset}
          disabled={busy}
          className="text-sm px-3 py-1.5 rounded-lg border transition disabled:opacity-50"
          style={{ borderColor: '#ef4444', color: '#ef4444' }}
        >
          Reset
        </button>
      </div>

      {saving && (
        <div className="text-xs animate-pulse" style={{ color: 'var(--accent-color)' }}>
          Menyimpan...
        </div>
      )}

      {error && (
        <div
          className="text-sm px-3 py-2 rounded-lg"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}
        >
          {error}
        </div>
      )}

      <Section title="Tampilan" description="Pilih tema dan warna aksen favoritmu">
        <div className="mb-4">
          <div className="text-sm font-medium mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
            Tema
          </div>
          <ThemePicker current={s.theme} disabled={busy} onChange={(id) => handle('theme', id)} />
        </div>

        <div className="border-t pt-4" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="text-sm font-medium mb-3" style={{ color: 'var(--theme-text-secondary)' }}>
            Warna Aksen
          </div>
          <AccentPicker current={s.accentColor} disabled={busy} onChange={(c) => handle('accentColor', c)} />
        </div>

        <div className="border-t pt-4 space-y-2" style={{ borderColor: 'var(--theme-border)' }}>
          <Row label="Ukuran Font" hint="Small / Normal / Large">
            <div className="flex gap-1 rounded-lg p-1" style={{ background: 'var(--theme-bg-tertiary)' }}>
              {(['small', 'normal', 'large'] as const).map((size) => (
                <button
                  key={size}
                  disabled={busy}
                  onClick={() => handle('fontSize', size)}
                  className="px-3 py-1 rounded text-xs font-medium capitalize transition"
                  style={{
                    background: s.fontSize === size ? 'var(--accent-color)' : 'transparent',
                    color: s.fontSize === size ? 'var(--theme-bg-primary)' : 'var(--theme-text-secondary)',
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </Row>

          <Row label="Mode Kompak" hint="Rapatkan spasi elemen">
            <Toggle checked={s.compactMode} disabled={busy} onChange={(v) => handle('compactMode', v)} />
          </Row>

          <Row label="Partikel Background" hint="Animasi partikel di layar">
            <Toggle checked={s.particlesOn} disabled={busy} onChange={(v) => handle('particlesOn', v)} />
          </Row>
        </div>
      </Section>

      <Section title="AI" description="Konfigurasi model dan perilaku AI">
        <Row label="Model AI">
          <Select
            value={s.aiModel}
            disabled={busy}
            onChange={(v) => handle('aiModel', v)}
            options={[
              { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
              { value: 'gemini-3.5-pro', label: 'Gemini 3.5 Pro' },
              { value: 'gpt-4o', label: 'GPT-4o' },
              { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
            ]}
          />
        </Row>

        <Row label="Temperature" hint="0 = fokus, 2 = kreatif">
          <NumberSlider
            value={s.aiTemperature}
            min={0}
            max={2}
            step={0.1}
            disabled={busy}
            onChange={(v) => handle('aiTemperature', v)}
          />
        </Row>

        <Row label="Auto-save Chat" hint="Simpan chat otomatis">
          <Toggle checked={s.autoSaveChat} disabled={busy} onChange={(v) => handle('autoSaveChat', v)} />
        </Row>

        <div className="pt-2">
          <label className="text-sm font-medium block mb-1" style={{ color: 'var(--theme-text-primary)' }}>
            System Prompt
          </label>
          <textarea
            value={s.aiSystemPrompt ?? ''}
            disabled={busy}
            rows={3}
            placeholder="Kamu adalah asisten yang membantu..."
            onChange={(e) => handle('aiSystemPrompt', e.target.value || null)}
            className="w-full text-sm rounded-lg border px-3 py-2 disabled:opacity-50"
            style={{
              background: 'var(--theme-bg-tertiary)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-primary)',
            }}
          />
        </div>
      </Section>

      <Section title="Notifikasi" description="Atur pemberitahuan">
        <Row label="Reminder Email">
          <Toggle checked={s.emailReminder} disabled={busy} onChange={(v) => handle('emailReminder', v)} />
        </Row>
        <Row label="Notifikasi Browser">
          <Toggle checked={s.browserNotify} disabled={busy} onChange={(v) => handle('browserNotify', v)} />
        </Row>
        <Row label="Ringkasan Harian">
          <Toggle checked={s.dailySummary} disabled={busy} onChange={(v) => handle('dailySummary', v)} />
        </Row>
        <Row label="Jam Ringkasan" hint="Format HH:mm">
          <input
            type="time"
            value={s.summaryTime}
            disabled={busy}
            onChange={(e) => handle('summaryTime', e.target.value)}
            className="text-sm rounded-lg border px-3 py-1.5 disabled:opacity-50"
            style={{
              background: 'var(--theme-bg-tertiary)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-primary)',
            }}
          />
        </Row>
      </Section>

      <Section title="Regional" description="Bahasa, zona waktu, mata uang">
        <Row label="Bahasa">
          <Select
            value={s.language}
            disabled={busy}
            onChange={(v) => handle('language', v)}
            options={[
              { value: 'id', label: 'Indonesia' },
              { value: 'en', label: 'English' },
            ]}
          />
        </Row>
        <Row label="Zona Waktu">
          <Select
            value={s.timezone}
            disabled={busy}
            onChange={(v) => handle('timezone', v)}
            options={[
              { value: 'Asia/Jakarta', label: 'WIB (Jakarta)' },
              { value: 'Asia/Makassar', label: 'WITA (Makassar)' },
              { value: 'Asia/Jayapura', label: 'WIT (Jayapura)' },
              { value: 'UTC', label: 'UTC' },
            ]}
          />
        </Row>
        <Row label="Mata Uang">
          <Select
            value={s.currency}
            disabled={busy}
            onChange={(v) => handle('currency', v)}
            options={[
              { value: 'IDR', label: 'IDR (Rp)' },
              { value: 'USD', label: 'USD ($)' },
              { value: 'EUR', label: 'EUR' },
              { value: 'SGD', label: 'SGD (S$)' },
            ]}
          />
        </Row>
      </Section>

      <p className="text-xs text-center pt-2" style={{ color: 'var(--theme-text-muted)' }}>
        Terakhir diperbarui: {new Date(s.updatedAt).toLocaleString('id-ID')}
      </p>
    </div>
  );
}