const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

export function capture(event: string, properties?: Record<string, unknown>) {
  if (!POSTHOG_KEY) return;
  try {
    const posthog = (window as unknown as { posthog?: { capture: (e: string, p?: Record<string, unknown>) => void } }).posthog;
    posthog?.capture(event, properties);
  } catch {
    // Silently fail if posthog is not available
  }
}

export function identify(distinctId: string, properties?: Record<string, unknown>) {
  if (!POSTHOG_KEY) return;
  try {
    const posthog = (window as unknown as { posthog?: { identify: (id: string, p?: Record<string, unknown>) => void } }).posthog;
    posthog?.identify(distinctId, properties);
  } catch {
    // Silently fail
  }
}
