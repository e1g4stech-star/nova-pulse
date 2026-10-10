import posthog from "posthog-js";

export function initPostHog() {
  if (typeof window === "undefined") return;
  if (posthog.__loaded) return;

  posthog.init("phc_YOUR_PROJECT_API_KEY", {
    api_host: "https://us.i.posthog.com",
    loaded: (ph) => {
      if (process.env.NODE_ENV === "development") ph.debug();
    },
  });
}

export { posthog };