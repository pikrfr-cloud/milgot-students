import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AnalyticsScript } from "@/components/AnalyticsScript";
import {
  analyticsEnabled,
  analyticsScriptSrc,
  analyticsSiteId,
  trackEvent,
} from "@/lib/analytics";
import {
  assertAnalyticsExport,
  findExportRoot,
  htmlHasAnalyticsScriptTag,
  sampleExportHtml,
  scriptOpenTags,
} from "@/lib/assert-analytics-export";

describe("analytics helpers when env is empty", () => {
  it("does not enable and does not render a script", () => {
    expect(analyticsScriptSrc()).toBe("");
    expect(analyticsSiteId()).toBe("");
    expect(analyticsEnabled()).toBe(false);
    const html = renderToStaticMarkup(<AnalyticsScript />);
    expect(html).toBe("");
    expect(htmlHasAnalyticsScriptTag(html)).toBe(false);
    expect(() => trackEvent("chat_start")).not.toThrow();
  });

  it("stays off unless both URL and site id are set", () => {
    const prevUrl = process.env.NEXT_PUBLIC_ANALYTICS_URL;
    const prevId = process.env.NEXT_PUBLIC_ANALYTICS_SITE_ID;
    try {
      process.env.NEXT_PUBLIC_ANALYTICS_URL = "https://plausible.io/js/script.js";
      process.env.NEXT_PUBLIC_ANALYTICS_SITE_ID = "";
      expect(analyticsEnabled()).toBe(false);
      expect(renderToStaticMarkup(<AnalyticsScript />)).toBe("");

      process.env.NEXT_PUBLIC_ANALYTICS_URL = "";
      process.env.NEXT_PUBLIC_ANALYTICS_SITE_ID = "example.com";
      expect(analyticsEnabled()).toBe(false);
      expect(renderToStaticMarkup(<AnalyticsScript />)).toBe("");
    } finally {
      if (prevUrl === undefined) delete process.env.NEXT_PUBLIC_ANALYTICS_URL;
      else process.env.NEXT_PUBLIC_ANALYTICS_URL = prevUrl;
      if (prevId === undefined) delete process.env.NEXT_PUBLIC_ANALYTICS_SITE_ID;
      else process.env.NEXT_PUBLIC_ANALYTICS_SITE_ID = prevId;
    }
  });

  it("detects analytics tags on script elements only, not RSC payload text", () => {
    const rscNoise = `<html><body><h1>בית</h1><script>self.__next_f.push(["plausible.io","data-domain","umami"])</script></body></html>`;
    expect(rscNoise).toContain("plausible.io");
    expect(htmlHasAnalyticsScriptTag(rscNoise)).toBe(false);

    const real = `<html><body><script defer src="https://plausible.io/js/script.js" data-domain="example.com"></script></body></html>`;
    expect(htmlHasAnalyticsScriptTag(real)).toBe(true);
    expect(scriptOpenTags(real)[0]?.src).toContain("plausible.io");
  });
});

const exportRoot = findExportRoot();
const mustAssert = process.env.FORCE_EXPORT_ASSERT === "1";

describe.skipIf(!exportRoot && !mustAssert)("exported HTML has no analytics script when env is empty", () => {
  it("asserts on built out/ pages, not RSC string search", () => {
    expect(() => assertAnalyticsExport()).not.toThrow();
    const files = sampleExportHtml();
    expect(files.length).toBeGreaterThan(0);
    expect(files.some((f) => f.path.endsWith("index.html"))).toBe(true);
    expect(files.some((f) => f.path.includes("privacy"))).toBe(true);
    for (const file of files) {
      expect(htmlHasAnalyticsScriptTag(file.html)).toBe(false);
      const srcs = scriptOpenTags(file.html).map((t) => t.src).filter(Boolean);
      expect(srcs.some((s) => /plausible|umami/i.test(s))).toBe(false);
    }
    if (exportRoot) expect(existsSync(exportRoot)).toBe(true);
  });
});
