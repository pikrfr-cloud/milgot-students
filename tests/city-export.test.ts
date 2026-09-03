import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  assertCityExport,
  cityHtmlLooksLikeNotFound,
  collectCityHtml,
  documentTitle,
  findCityExportRoot,
  hasItemListJsonLd,
  isTelAvivCityHtml,
} from "@/lib/assert-city-export";

describe("city HTML 404 detection", () => {
  it("ignores not-found copy that only appears inside Next RSC scripts", () => {
    const html = `<html><head><title>מלגות לסטודנטים בתל אביב-יפו תשפ״ז</title></head><body><h1>מלגות לסטודנטים בתל אביב-יפו תשפ״ז</h1><script type="application/ld+json">{"@type":"ItemList","name":"x"}</script><script>self.__next_f.push(["notFound","העמוד לא נמצא"])</script></body></html>`;
    expect(cityHtmlLooksLikeNotFound(html)).toBe(false);
    expect(hasItemListJsonLd(html)).toBe(true);
  });

  it("flags a real not-found document", () => {
    const html = `<html><head><title>העמוד לא נמצא</title></head><body><h1>העמוד לא נמצא</h1><p>העמוד לא נכנס</p></body></html>`;
    expect(cityHtmlLooksLikeNotFound(html)).toBe(true);
  });
});

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
    expect(cityHtmlLooksLikeNotFound(telAviv!.html)).toBe(false);
    expect(documentTitle(telAviv!.html)).toContain("תל אביב-יפו");
    expect(documentTitle(telAviv!.html)).not.toContain("העמוד לא נמצא");
  });
});
