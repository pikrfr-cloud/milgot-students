import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  assertCityExport,
  cityHtmlLooksLikeLanding,
  cityHtmlLooksLikeNotFound,
  collectCityHtml,
  documentTitle,
  findCityExportRoot,
  firstH1,
  hasItemListJsonLd,
  isTelAvivCityHtml,
} from "@/lib/assert-city-export";

describe("city HTML 404 detection", () => {
  it("uses only title and h1, ignoring not-found copy inside Next RSC scripts", () => {
    const html = `<html><head><title>מלגות לסטודנטים בתל אביב-יפו תשפ״ז</title></head><body><h1>מלגות לסטודנטים בתל אביב-יפו תשפ״ז</h1><script type="application/ld+json">{"@type":"ItemList","name":"x"}</script><script>self.__next_f.push(["notFound","העמוד לא נמצא","העמוד לא נכנס"])</script></body></html>`;
    expect(html).toContain("העמוד לא נמצא");
    expect(cityHtmlLooksLikeNotFound(html)).toBe(false);
    expect(cityHtmlLooksLikeLanding(html)).toBe(true);
    expect(hasItemListJsonLd(html)).toBe(true);
    expect(documentTitle(html)).toContain("מלגות לסטודנטים ב");
    expect(firstH1(html)).toContain("תשפ״ז");
  });

  it("flags a real not-found document by title and h1", () => {
    const html = `<html><head><title>העמוד לא נמצא</title></head><body><h1>העמוד לא נמצא</h1><p>העמוד לא נכנס</p></body></html>`;
    expect(cityHtmlLooksLikeNotFound(html)).toBe(true);
    expect(cityHtmlLooksLikeLanding(html)).toBe(false);
  });
});

const cityOut = findCityExportRoot();
const mustAssert = process.env.FORCE_EXPORT_ASSERT === "1";

describe.skipIf(!cityOut && !mustAssert)("exported city HTML in out/", () => {
  it("generates the Tel Aviv–Yafo page with ItemList JSON-LD and a landing title/h1", () => {
    expect(() => assertCityExport()).not.toThrow();
    const root = findCityExportRoot();
    expect(root && existsSync(root)).toBe(true);
    const files = collectCityHtml(root!);
    const telAviv = files.find(isTelAvivCityHtml);
    expect(telAviv).toBeTruthy();
    expect(hasItemListJsonLd(telAviv!.html)).toBe(true);
    expect(cityHtmlLooksLikeNotFound(telAviv!.html)).toBe(false);
    expect(cityHtmlLooksLikeLanding(telAviv!.html)).toBe(true);
    expect(documentTitle(telAviv!.html)).toMatch(/מלגות לסטודנטים ב.+תשפ[״"]ז/);
    expect(firstH1(telAviv!.html)).toMatch(/מלגות לסטודנטים ב.+תשפ[״"]ז/);
    expect(documentTitle(telAviv!.html)).not.toContain("העמוד לא נמצא");
    expect(firstH1(telAviv!.html)).not.toContain("העמוד לא נמצא");
  });
});
