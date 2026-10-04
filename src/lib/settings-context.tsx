'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { applyTheme } from '@/lib/theme-engine';

export interface UserSettings {
  id: string;
  userId: string;
  theme: string;
  fontSize: string;
  compactMode: boolean;
  particlesOn: boolean;
  accentColor: string;
  language: string;
  timezone: string;
  currency: string;
  aiModel: string;
  aiTemperature: number;
  aiSystemPrompt: string | null;
  autoSaveChat: boolean;
  emailReminder: boolean;
  browserNotify: boolean;
  dailySummary: boolean;
  summaryTime: string;
  createdAt: string;
  updatedAt: string;
}

export type SettingsUpdate = Partial<Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

interface SettingsContextValue {
  settings: UserSettings | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  updateSettings: (patch: SettingsUpdate) => Promise<void>;
  resetSettings: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const DEFAULT_SETTINGS: Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  theme: 'neon',
  fontSize: 'normal',
  compactMode: false,
  particlesOn: true,
  accentColor: '#5ee7ff',
  language: 'id',
  timezone: 'Asia/Jakarta',
  currency: 'IDR',
  aiModel: 'gemini-3.5-flash',
  aiTemperature: 0.9,
  aiSystemPrompt: null,
  autoSaveChat: true,
  emailReminder: false,
  browserNotify: false,
  dailySummary: false,
  summaryTime: '20:00',
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load settings (' + res.status + ')');
      const data = await res.json();
      setSettings(data.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(
    async (patch: SettingsUpdate) => {
      if (!settings) return;
      const previous = settings;
      setSettings({ ...settings, ...patch } as UserSettings);
      setSaving(true);
      setError(null);
      try {
        const res = await fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error('Failed to save (' + res.status + ')');
        const data = await res.json();
        setSettings(data.settings);
      } catch (err) {
        setSettings(previous);
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [settings]
  );

  const resetSettings = useCallback(async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(DEFAULT_SETTINGS),
      });
      if (!res.ok) throw new Error('Failed to reset (' + res.status + ')');
      const data = await res.json();
      setSettings(data.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [settings]);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  // Apply theme via theme-engine
  useEffect(() => {
    if (!settings) return;
    applyTheme(
      settings.theme,
      settings.accentColor,
      settings.fontSize,
      settings.compactMode
    );
  }, [settings]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        saving,
        error,
        updateSettings,
        resetSettings,
        refreshSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within <SettingsProvider>');
  return ctx;
}