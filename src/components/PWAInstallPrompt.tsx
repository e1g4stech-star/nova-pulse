'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      console.log('[PWA] User installed app');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!showPrompt || dismissed || !deferredPrompt) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 z-[200] w-[calc(100%-2rem)] max-w-md"
      style={{
        transform: 'translateX(-50%)',
        background: 'var(--theme-bg-secondary)',
        border: '1px solid var(--theme-border)',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        padding: '16px',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl font-bold"
          style={{
            background: 'linear-gradient(135deg, #5ee7ff, #a855f7)',
            color: '#0a0e1a',
          }}
        >
          N
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm mb-1" style={{ color: 'var(--theme-text-primary)' }}>
            Install Nova-Pulse
          </div>
          <div className="text-xs mb-3" style={{ color: 'var(--theme-text-muted)' }}>
            Tambahkan ke home screen untuk akses lebih cepat dan fitur offline.
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition"
              style={{
                background: 'var(--accent-color)',
                color: 'var(--theme-bg-primary)',
              }}
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="text-xs px-3 py-1.5 rounded-lg transition"
              style={{
                background: 'var(--theme-bg-tertiary)',
                color: 'var(--theme-text-secondary)',
              }}
            >
              Nanti
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-lg leading-none shrink-0"
          style={{ color: 'var(--theme-text-muted)' }}
          aria-label="Close"
        >
          x
        </button>
      </div>
    </div>
  );
}