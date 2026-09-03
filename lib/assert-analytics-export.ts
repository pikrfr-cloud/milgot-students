/**
 * Default CI/Pages export must not embed an analytics script.
 * Only real `<script>` tags count — Next puts strings inside RSC payloads.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function findExportRoot(cwd = process.cwd()): string | null {
  const candidates = [join(cwd, "out"), join(cwd, "out", "milgot-students")];
  return candidates.find((p) => existsSync(join(p, "index.html"))) ?? null;
}

const SAMPLE_PAGES = ["index.html", "privacy/index.html", "chat/index.html", "results/index.html", "about/index.html"];

export function sampleExportHtml(cwd = process.cwd()): { path: string; html: string }[] {
  const root = findExportRoot(cwd);
  if (!root) return [];
  return SAMPLE_PAGES.filter((rel) => existsSync(join(root, rel))).map((rel) => ({
    path: join(root, rel),
    html: readFileSync(join(root, rel), "utf8"),
  }));
}

export type ScriptTag = { src: string; attrs: string };

export function scriptOpenTags(html: string): ScriptTag[] {
  return [...html.matchAll(/<script\b([^>]*)>/gi)].map((m) => {
    const attrs = m[1] ?? "";
    const src = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1] ?? "";
    return { src, attrs };
  });
}

export function htmlHasAnalyticsScriptTag(html: string): boolean {
  return scriptOpenTags(html).some((tag) => {
    if (/plausible|umami/i.test(tag.src)) return true;
    if (/\bdata-domain\s*=/i.test(tag.attrs)) return true;
    if (/\bdata-website-id\s*=/i.test(tag.attrs)) return true;
    return false;
  });
}

export function assertAnalyticsExport(cwd = process.cwd()): void {
  const files = sampleExportHtml(cwd);
  if (files.length === 0) {
    throw new Error("No exported HTML under out/ (or out/milgot-students/) to assert analytics-off.");
  }
  const hits = files.filter((f) => htmlHasAnalyticsScriptTag(f.html));
  if (hits.length > 0) {
    const list = hits.map((f) => f.path).join("\n  ");
    throw new Error(`Analytics <script> found in default export (env should be empty):\n  ${list}`);
  }
}
