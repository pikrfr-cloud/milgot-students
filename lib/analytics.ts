export const ANALYTICS_EVENTS = ["chat_start", "chat_complete", "report_view", "apply_click"] as const;
export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export function analyticsScriptSrc(): string {
  return (process.env.NEXT_PUBLIC_ANALYTICS_URL ?? "").trim();
}

export function analyticsSiteId(): string {
  return (process.env.NEXT_PUBLIC_ANALYTICS_SITE_ID ?? "").trim();
}

/** Both URL and site id required. Empty either → no script and no events. */
export function analyticsEnabled(): boolean {
  return Boolean(analyticsScriptSrc() && analyticsSiteId());
}

/**
 * Provider event API only — event name, no profile fields, phone, or ids.
 * No-op when analytics is off or `window.plausible` is missing.
 */
export function trackEvent(name: AnalyticsEventName): void {
  if (!analyticsEnabled()) return;
  if (typeof window === "undefined") return;
  const plausible = (window as Window & { plausible?: (event: string) => void }).plausible;
  if (typeof plausible === "function") plausible(name);
}
