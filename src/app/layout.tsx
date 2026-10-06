import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";
import { SettingsProvider } from "@/lib/settings-context";
import CommandPalette from "@/components/CommandPalette";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" });

export const metadata: Metadata = {
  title: "Nova Pulse — Social Command Center",
  description: "Pusat semua postingan media sosial dalam satu dashboard futuristik.",
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




