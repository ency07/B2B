"use client";

import React from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    if (POSTHOG_KEY && typeof window !== "undefined") {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        person_profiles: "always",
        capture_pageview: false,
        loaded: (ph) => {
          if (process.env.NODE_ENV === "development") ph.opt_out_capturing();
        },
      });
    }
  }, []);

  if (!POSTHOG_KEY) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
