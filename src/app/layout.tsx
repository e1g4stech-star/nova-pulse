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
  description:
    "Platform lengkap untuk content creator — AI untuk generate konten, kalender untuk jadwal, affiliate untuk monetize. Semua dalam satu dashboard futuristik.",
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
  metadataBase: new URL(
    process.env.NEXTAUTH_URL || "https://nova-pulse-eta.vercel.app"
  ),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nova Pulse",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "Nova Pulse",
    title: "Nova Pulse — Content Command Center untuk Creator Indonesia",
    description:
      "Platform lengkap untuk content creator — AI, kalender, affiliate dalam satu dashboard.",
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
    apple: "/icons/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* PostHog Analytics Snippet — Versi 2026-05-30 (latest) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(t,e){var o,n,p,r;e.__SV||(window.posthog && window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}p||((p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",p.onerror=function(){p=null},(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r));var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],Object.defineProperty(u,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e}}),Object.defineProperty(u.people,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(){return u.toString(1)+".people (stub)"}}),o="gu mu yu bu ku init Qu Zu Wu Vu Yu el Gu ec zu lc uc cc hc dc vc capture getExtension Ju fu mc calculateEventProperties gc register register_once register_for_session unregister unregister_for_session wc Uu yc getFeatureFlag getFeatureFlagPayload getFeatureFlagResult getAllFeatureFlags isFeatureEnabled reloadFeatureFlags updateFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys onActiveMatchingSurveysChanged renderSurvey displaySurvey cancelPendingSurvey canRenderSurvey canRenderSurveyAsync kc identify setPersonProperties unsetPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset Sc shutdown setIdentity clearIdentity get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException addExceptionStep captureLog startExceptionAutocapture stopExceptionAutocapture loadToolbar get_property getSessionProperty bc rc createPersonProfile setInternalOrTestUser Cu xu opt_in_capturing opt_out_capturing $u has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing nc debug il Os getPageViewId captureTraceFeedback captureTraceMetric Nu".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
              posthog.init('phc_D4MB5MUBKrTU8YScdC6LxhSznEMZnPAr2zwLWfGybNc6', {
                api_host: 'https://us.i.posthog.com',
                defaults: '2026-05-30',
                person_profiles: 'identified_only',
                capture_pageview: true,
                capture_pageleave: true,
                autocapture: true
              });
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${orbitron.variable}`}
      >
        {/* Theme preload script */}
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