'use client';

import { useEffect, useState, useCallback } from 'react';

interface UseVoiceOutputOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export function useVoiceOutput(options: UseVoiceOutputOptions = {}) {
  const { lang = 'id-ID', rate = 1, pitch = 1, volume = 1 } = options;

  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSupported(false);
      return;
    }
    setSupported(true);
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text) return;
      window.speechSynthesis.cancel();

      const clean = text
        .replace(/```[\s\S]*?```/g, ' code block ')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/#{1,6}\s/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[👍🎉✨🚀💡⚠️📌🔗🤖💬⏳]/g, '')
        .replace(/\n+/g, '. ')
        .trim();

      if (!clean) return;

      const u = new SpeechSynthesisUtterance(clean);
      u.lang = lang;
      u.rate = rate;
      u.pitch = pitch;
      u.volume = volume;

      const voice = voices.find((v) => v.lang.startsWith(lang.split('-')[0]));
      if (voice) u.voice = voice;

      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);

      window.speechSynthesis.speak(u);
    },
    [supported, lang, rate, pitch, volume, voices]
  );

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  return { supported, speaking, speak, stop };
}