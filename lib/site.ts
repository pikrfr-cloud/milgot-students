/** Canonical origin including GitHub Pages basePath (no trailing slash). */
export const SITE_ORIGIN = "https://pikrfr-cloud.github.io/milgot-students";

export function absoluteUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${p}`;
}
