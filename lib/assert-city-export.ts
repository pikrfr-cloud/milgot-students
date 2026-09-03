/**
 * Fail the static export if any city landing HTML is the not-found page,
 * or if a known city page (Tel Aviv–Yafo) is missing ItemList JSON-LD.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const CITY_NOT_FOUND_MARKERS = ["העמוד לא נמצא", "העמוד לא נכנס"] as const;
export const TEL_AVIV_SLUG = "תל-אביב-יפו";
export const TEL_AVIV_TITLE = "מלגות לסטודנטים בתל אביב-יפו";

export function findCityExportRoot(cwd = process.cwd()): string | null {
  const candidates = [join(cwd, "out", "catalog", "city"), join(cwd, "out", "milgot-students", "catalog", "city")];
  return candidates.find((p) => existsSync(p)) ?? null;
}

export type CityHtmlFile = { path: string; html: string };

export function collectCityHtml(root: string): CityHtmlFile[] {
  const rels = readdirSync(root, { recursive: true, encoding: "utf8" });
  return rels
    .filter((rel) => rel.endsWith(".html"))
    .map((rel) => {
      const path = join(root, rel);
      return { path, html: readFileSync(path, "utf8") };
    });
}

function pathLooksLikeTelAviv(filePath: string): boolean {
  let decoded = filePath;
  try {
    decoded = decodeURIComponent(filePath);
  } catch {
    /* keep */
  }
  return decoded.includes(TEL_AVIV_SLUG) || filePath.includes(encodeURIComponent(TEL_AVIV_SLUG));
}

export function isTelAvivCityHtml(file: CityHtmlFile): boolean {
  return pathLooksLikeTelAviv(file.path) || file.html.includes(TEL_AVIV_TITLE);
}

export function hasItemListJsonLd(html: string): boolean {
  if (!html.includes("application/ld+json")) return false;
  return html.includes('"@type":"ItemList"') || html.includes('"@type": "ItemList"');
}

export function assertCityExport(cwd = process.cwd()): void {
  const root = findCityExportRoot(cwd);
  if (!root) {
    throw new Error("No exported city pages under out/catalog/city (or out/milgot-students/catalog/city).");
  }
  const files = collectCityHtml(root);
  if (files.length === 0) {
    throw new Error(`No HTML files under ${root}`);
  }

  const notFound = files.filter((f) => CITY_NOT_FOUND_MARKERS.some((m) => f.html.includes(m)));
  if (notFound.length > 0) {
    const list = notFound.map((f) => f.path).join("\n  ");
    throw new Error(`City 404 slipped through (${notFound.length} page(s)):\n  ${list}`);
  }

  const telAviv = files.find(isTelAvivCityHtml);
  if (!telAviv) {
    throw new Error(`Known city page ${TEL_AVIV_SLUG} was not generated under ${root}`);
  }
  if (!hasItemListJsonLd(telAviv.html)) {
    throw new Error(`Known city page ${TEL_AVIV_SLUG} is missing ItemList JSON-LD: ${telAviv.path}`);
  }
}
