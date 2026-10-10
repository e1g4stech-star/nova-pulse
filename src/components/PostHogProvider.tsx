"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || posthog.__loaded) return;

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false,
    });
  }, []);

  useEffect(() => {
    if (pathname && posthog.__loaded) {
      let url = window.origin + pathname;
      if (searchParams?.toString()) url += `?${searchParams.toString()}`;
      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}
