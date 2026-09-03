/**
 * Next.js static export can pass dynamic segment params percent-encoded
 * (Hebrew city slugs become `%D7...`). Decode before comparing to catalog keys.
 */
export function decodeRouteParam(value: string): string {
  let current = value.trim();
  for (let i = 0; i < 3; i++) {
    if (!/%[0-9A-Fa-f]{2}/.test(current)) return current;
    try {
      const next = decodeURIComponent(current);
      if (next === current) return current;
      current = next;
    } catch {
      return current;
    }
  }
  return current;
}
