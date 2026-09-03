import { analyticsScriptSrc, analyticsSiteId } from "@/lib/analytics";

/**
 * Plausible (or compatible) loader. Renders nothing unless both public env
 * vars are set, so the default GitHub Pages export sends no analytics request.
 */
export function AnalyticsScript() {
  const src = analyticsScriptSrc();
  const domain = analyticsSiteId();
  if (!src || !domain) return null;
  return <script defer src={src} data-domain={domain} />;
}
