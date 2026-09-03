import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  assertCityExport,
  collectCityHtml,
  findCityExportRoot,
  hasItemListJsonLd,
  isTelAvivCityHtml,
} from "@/lib/assert-city-export";

const cityOut = findCityExportRoot();
const mustAssert = process.env.FORCE_EXPORT_ASSERT === "1";

describe.skipIf(!cityOut && !mustAssert)("exported city HTML in out/", () => {
  it("generates the Tel Aviv–Yafo page with ItemList JSON-LD and no not-found copy", () => {
    expect(() => assertCityExport()).not.toThrow();
    const root = findCityExportRoot();
    expect(root && existsSync(root)).toBe(true);
    const files = collectCityHtml(root!);
    const telAviv = files.find(isTelAvivCityHtml);
    expect(telAviv).toBeTruthy();
    expect(hasItemListJsonLd(telAviv!.html)).toBe(true);
    expect(telAviv!.html).not.toContain("העמוד לא נמצא");
    expect(telAviv!.html).not.toContain("העמוד לא נכנס");
  });
});
