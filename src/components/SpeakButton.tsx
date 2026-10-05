'use client';

import { useVoiceOutput } from '@/hooks/useVoiceOutput';

interface Props {
  text: string;
  autoPlay?: boolean;
}

export default function SpeakButton({ text, autoPlay = false }: Props) {
  const { supported, speaking, speak, stop } = useVoiceOutput({ lang: 'id-ID' });

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => (speaking ? stop() : speak(text))}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition mt-2"
      style={{
        background: speaking ? 'var(--accent-color)' : 'var(--accent-soft)',
        color: speaking ? 'var(--theme-bg-primary)' : 'var(--accent-color)',
        border: '1px solid var(--theme-border)',
      }}
      title={speaking ? 'Stop' : 'Bacakan pesan ini'}
    >
      <span>{speaking ? '⏹️' : '🔊'}</span>
      <span>{speaking ? 'Stop' : 'Bacakan'}</span>
    </button>
  );
}