import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";
import { SettingsProvider } from "@/lib/settings-context";
import CommandPalette from "@/components/CommandPalette";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" });

export const metadata: Metadata = {
  title: {
    default: "Nova Pulse — Content Command Center untuk Creator Indonesia",
    template: "%s | Nova Pulse",
  },
  description: "Platform lengkap untuk content creator — AI untuk generate konten, kalender untuk jadwal, affiliate untuk monetize. Semua dalam satu dashboard futuristik.",
  keywords: [
    "content creator",
    "AI content generator",
    "social media manager",
    "content calendar",
    "affiliate manager",
    "Indonesia",
    "TikTok",
    "Instagram",
    "caption generator",
  ],
  authors: [{ name: "Nova Pulse" }],
  creator: "Nova Pulse",
  publisher: "Nova Pulse",
  verification: {
    google: "I5wTtAyGVtoJReX5PDMnozd5qUO6eRO58k-JSlyFpVg",
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://nova-pulse-eta.vercel.app"),
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "Nova Pulse",
    title: "Nova Pulse — Content Command Center untuk Creator Indonesia",
    description: "Platform lengkap untuk content creator — AI, kalender, affiliate dalam satu dashboard.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nova Pulse",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nova Pulse — Content Command Center",
    description: "Platform lengkap untuk content creator Indonesia.",
    images: ["/og-image.png"],
    creator: "@novapulse",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} ${orbitron.variable}`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var cached = localStorage.getItem("nova_settings");
                  if (cached) {
                    var s = JSON.parse(cached);
                    if (s.theme) {
                      document.documentElement.setAttribute("data-theme", s.theme);
                      document.documentElement.setAttribute("data-theme", s.theme);
                      document.body.setAttribute("data-theme", s.theme);
                    }
                    if (s.fontSize) {
                      var map = { small: "14px", normal: "16px", large: "18px" };
                      document.documentElement.style.fontSize = map[s.fontSize] || "16px";
                    }
                    if (s.compactMode) document.body.classList.add("compact-mode");
                    if (s.particlesOn === false) document.body.classList.add("no-particles");
                    if (s.accentColor) {
                      document.documentElement.style.setProperty("--accent-color", s.accentColor);
                      document.documentElement.style.setProperty("--cyan", s.accentColor);
                    }
                  }
                } catch(e) { console.warn("Theme preload failed:", e); }
              })();
            `,
          }}
        />
        <SettingsProvider>
          {children}
          <CommandPalette />
        </SettingsProvider>
      </body>
    </html>
  );
}




