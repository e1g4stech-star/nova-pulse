'use client';

import Navbar from '@/components/Navbar';
import SettingsPanel from '@/components/SettingsPanel';

export default function SettingsPage() {
  return (
    <>
      <Navbar />
      <main
        className="min-h-screen"
        style={{
          background: 'var(--theme-bg-primary)',
          color: 'var(--theme-text-primary)',
        }}
      >
        <div className="max-w-4xl mx-auto px-6 py-10">
          <SettingsPanel />
        </div>
      </main>
    </>
  );
}