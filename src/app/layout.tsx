import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SettingsProvider } from "@/lib/settings-context";
import CommandPalette from "@/components/CommandPalette";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nova Pulse - Social Command Center",
  description: "AI-powered workspace untuk content creator. Kelola postingan, AI caption, analytics, affiliate, kalender konten.",
  manifest: "/manifest.webmanifest",
  applicationName: "Nova Pulse",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nova Pulse",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e1a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Nova Pulse" />
      </head>
      <body className={inter.className}>
        <SettingsProvider>
          {children}
          <CommandPalette />
          <PWAInstallPrompt />
        </SettingsProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) {
                      console.log('[PWA] SW registered:', reg.scope);
                    })
                    .catch(function(err) {
                      console.warn('[PWA] SW failed:', err);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}