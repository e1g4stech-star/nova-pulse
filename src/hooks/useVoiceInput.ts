'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseVoiceInputOptions {
  lang?: string;
  onResult?: (transcript: string, isFinal: boolean) => void;
  continuous?: boolean;
}

interface UseVoiceInputReturn {
  supported: boolean;
  listening: boolean;
  interimText: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  toggle: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const { lang = 'id-ID', onResult, continuous = false } = options;

  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }

    setSupported(true);
    const recognition = new SR();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => { setListening(true); setError(null); };
    recognition.onend = () => { setListening(false); setInterimText(''); };
    recognition.onerror = (event: any) => {
      const err = event.error;
      if (err === 'not-allowed') setError('Izin mikrofon ditolak');
      else if (err === 'no-speech') setError('Tidak ada suara');
      else if (err === 'audio-capture') setError('Mikrofon tidak ada');
      else if (err === 'aborted') { /* ignore */ }
      else setError('Error: ' + err);
      setListening(false);
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      setInterimText(interim);
      if (final && onResultRef.current) onResultRef.current(final.trim(), true);
      else if (interim && onResultRef.current) onResultRef.current(interim.trim(), false);
    };

    recognitionRef.current = recognition;
    return () => { try { recognition.stop(); } catch {} };
  }, [lang, continuous]);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    try { setError(null); recognitionRef.current.start(); } catch {}
  }, []);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    try { recognitionRef.current.stop(); } catch {}
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop(); else start();
  }, [listening, start, stop]);

  return { supported, listening, interimText, error, start, stop, toggle };
}