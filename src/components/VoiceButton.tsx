'use client';

import { useEffect, useState } from 'react';
import { useVoiceInput } from '@/hooks/useVoiceInput';

interface Props {
  onTranscript: (text: string, isFinal: boolean) => void;
  disabled?: boolean;
  lang?: string;
}

export default function VoiceButton({ onTranscript, disabled, lang = 'id-ID' }: Props) {
  const [tooltip, setTooltip] = useState(false);

  const { supported, listening, error, toggle } = useVoiceInput({
    lang,
    onResult: onTranscript,
  });

  useEffect(() => {
    if (error) {
      setTooltip(true);
      const t = setTimeout(() => setTooltip(false), 3000);
      return () => clearTimeout(t);
    }
  }, [error]);

  if (!supported) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        onMouseEnter={() => setTooltip(true)}
        onMouseLeave={() => !error && setTooltip(false)}
        className="relative p-3 rounded-xl transition-all disabled:opacity-50 shrink-0"
        style={{
          background: listening ? 'var(--accent-color)' : 'var(--accent-soft)',
          color: listening ? 'var(--theme-bg-primary)' : 'var(--accent-color)',
          border: '1px solid var(--theme-border)',
        }}
        aria-label={listening ? 'Stop recording' : 'Start recording'}
      >
        <span className="text-lg leading-none relative z-10">
          {listening ? '🎙️' : '🎤'}
        </span>
        {listening && (
          <span
            className="absolute inset-0 rounded-xl animate-ping"
            style={{ background: 'var(--accent-color)', opacity: 0.4 }}
          />
        )}
      </button>

      {tooltip && (
        <div
          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap z-50"
          style={{
            background: error ? 'rgba(239,68,68,0.9)' : 'var(--theme-bg-tertiary)',
            color: error ? 'white' : 'var(--theme-text-primary)',
            border: '1px solid var(--theme-border)',
          }}
        >
          {error ? '⚠️ ' + error : listening ? 'Mendengarkan... klik untuk stop' : 'Klik untuk bicara'}
        </div>
      )}
    </div>
  );
}