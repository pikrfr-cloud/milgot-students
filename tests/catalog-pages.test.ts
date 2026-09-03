import { describe, expect, it } from "vitest";
import { SCHOLARSHIPS } from "@/data/scholarships";
import {
  catalogCities,
  catalogInstitutionIds,
  catalogSectors,
  scholarshipStaticParams,
  sitemapEntries,
} from "@/lib/catalog-routes";

describe("per-scholarship SEO pages", () => {
  it("builds a static param for every catalog id", () => {
    const params = scholarshipStaticParams();
    expect(params.map((p) => p.id).sort()).toEqual(SCHOLARSHIPS.map((s) => s.id).sort());
    expect(SCHOLARSHIPS.every((s) => /^[a-z0-9-]+$/.test(s.id))).toBe(true);
  });

  it("keeps sitemap in sync with catalog pages and trailingSlash paths", () => {
    const urls = sitemapEntries().map((e) => e.url);
    expect(urls.every((u) => u.startsWith("https://pikrfr-cloud.github.io/milgot-students"))).toBe(true);
    expect(urls.every((u) => u.endsWith("/"))).toBe(true);
    for (const s of SCHOLARSHIPS) {
      expect(urls).toContain(`https://pikrfr-cloud.github.io/milgot-students/scholarships/${s.id}/`);
    }
    expect(urls).toContain("https://pikrfr-cloud.github.io/milgot-students/catalog/updates/");
    expect(urls).toContain("https://pikrfr-cloud.github.io/milgot-students/closing/");
    expect(catalogInstitutionIds().length).toBeGreaterThan(0);
    expect(catalogCities().length).toBeGreaterThan(0);
    expect(catalogSectors().length).toBeGreaterThan(0);
  });
});
