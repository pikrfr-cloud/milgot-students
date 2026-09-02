/** Canonical origin including GitHub Pages basePath (no trailing slash). */
export const SITE_ORIGIN = "https://pikrfr-cloud.github.io/milgot-students";

/** GitHub Pages basePath — keep in sync with next.config.ts. */
export const SITE_BASE_PATH = "/milgot-students";

export function absoluteUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${p}`;
}
