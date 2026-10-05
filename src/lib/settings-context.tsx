"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Settings {
  theme: string;
  fontSize: string;
  compactMode: boolean;
  particlesOn: boolean;
  accentColor: string;
  aiModel: string;
  aiTemperature: number;
  aiSystemPrompt: string | null;
  autoSaveChat: boolean;
  emailReminder: boolean;
  browserNotify: boolean;
  dailySummary: boolean;
  summaryTime: string;
  language: string;
  timezone: string;
  currency: string;
}

const DEFAULT_SETTINGS: Settings = {
  theme: "neon",
  fontSize: "normal",
  compactMode: false,
  particlesOn: true,
  accentColor: "#5ee7ff",
  aiModel: "gemini-3.5-flash",
  aiTemperature: 0.9,
  aiSystemPrompt: null,
  autoSaveChat: true,
  emailReminder: false,
  browserNotify: false,
  dailySummary: false,
  summaryTime: "20:00",
  language: "id",
  timezone: "Asia/Jakarta",
  currency: "IDR",
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => Promise<void>;
  loading: boolean;
  resetSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const cached = localStorage.getItem("nova_settings");
        if (cached) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(cached) });
        }

        const res = await fetch("/api/settings");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const merged = { ...DEFAULT_SETTINGS, ...json.data };
            setSettings(merged);
            localStorage.setItem("nova_settings", JSON.stringify(merged));
          }
        }
      } catch (err) {
        console.error("Load settings error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    if (settings.theme === "neon") {
      document.body.removeAttribute("data-theme");
    } else {
      document.body.setAttribute("data-theme", settings.theme);
    }

    const sizeMap: Record<string, string> = {
      small: "14px",
      normal: "16px",
      large: "18px",
    };
    document.documentElement.style.fontSize = sizeMap[settings.fontSize] || "16px";

    document.body.classList.toggle("compact-mode", settings.compactMode);
    document.body.classList.toggle("no-particles", !settings.particlesOn);

    document.documentElement.style.setProperty("--cyan", settings.accentColor);
    document.documentElement.style.setProperty("--shadow", settings.accentColor);
  }, [settings]);

  async function updateSettings(partial: Partial<Settings>) {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    localStorage.setItem("nova_settings", JSON.stringify(updated));

    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
    } catch (err) {
      console.error("Sync settings error:", err);
    }
  }

  async function resetSettings() {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem("nova_settings");
    try {
      await fetch("/api/settings", { method: "DELETE" });
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be inside SettingsProvider");
  return ctx;
}