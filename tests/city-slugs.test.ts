import { describe, expect, it } from "vitest";
import { SCHOLARSHIPS } from "@/data/scholarships";
import { catalogCities, cityFromSlug, cityToSlug } from "@/lib/catalog-routes";
import { cityLanding, landingItemListJsonLd } from "@/lib/landing-pages";
import { decodeRouteParam } from "@/lib/route-params";
import { isSearchGroupId } from "@/lib/catalog-groups";
import { INSTITUTIONS } from "@/lib/institutions";
import { SECTORS } from "@/lib/types";

const TEL_AVIV_HE = "תל אביב-יפו";
const TEL_AVIV_SLUG = "תל-אביב-יפו";

describe("decodeRouteParam", () => {
  it("decodes percent-encoded Hebrew slugs", () => {
    expect(decodeRouteParam(encodeURIComponent(TEL_AVIV_SLUG))).toBe(TEL_AVIV_SLUG);
  });

  it("leaves already-decoded slugs and ASCII ids unchanged", () => {
    expect(decodeRouteParam(TEL_AVIV_SLUG)).toBe(TEL_AVIV_SLUG);
    expect(decodeRouteParam("tau")).toBe("tau");
    expect(decodeRouteParam(encodeURIComponent("without-volunteering"))).toBe("without-volunteering");
  });

  it("decodes double-encoded slugs", () => {
    const twice = encodeURIComponent(encodeURIComponent(TEL_AVIV_SLUG));
    expect(decodeRouteParam(twice)).toBe(TEL_AVIV_SLUG);
  });
});

describe("cityFromSlug", () => {
  it("resolves תל-אביב-יפו from the raw slug and from Next's percent-encoded params.slug", () => {
    const cities = catalogCities();
    expect(cities).toContain(TEL_AVIV_HE);
    expect(cityToSlug(TEL_AVIV_HE)).toBe(TEL_AVIV_SLUG);

    expect(cityFromSlug(TEL_AVIV_SLUG)).toBe(TEL_AVIV_HE);
    expect(cityFromSlug(encodeURIComponent(TEL_AVIV_SLUG))).toBe(TEL_AVIV_HE);
    expect(cityFromSlug(encodeURIComponent(encodeURIComponent(TEL_AVIV_SLUG)))).toBe(TEL_AVIV_HE);
  });

  it("resolves every catalog city when the slug is percent-encoded", () => {
    for (const city of catalogCities(SCHOLARSHIPS)) {
      const slug = cityToSlug(city);
      expect(cityFromSlug(slug)).toBe(city);
      expect(cityFromSlug(encodeURIComponent(slug))).toBe(city);
    }
  });
});

describe("Tel Aviv city landing is not a 404", () => {
  it("has scholarships and ItemList JSON-LD", () => {
    const city = cityFromSlug(encodeURIComponent(TEL_AVIV_SLUG));
    expect(city).toBe(TEL_AVIV_HE);
    const landing = cityLanding(city!);
    expect(landing.scholarships.length).toBeGreaterThan(0);
    const jsonLd = landingItemListJsonLd(landing);
    expect(jsonLd["@type"]).toBe("ItemList");
    expect(jsonLd.itemListElement.length).toBe(landing.scholarships.length);
    expect(jsonLd.name).toContain(TEL_AVIV_HE);
  });
});

describe("ASCII collection params still match after decode", () => {
  it("keeps institution, sector, and group ids stable", () => {
    expect(INSTITUTIONS.some((i) => i.id === decodeRouteParam(encodeURIComponent("tau")))).toBe(true);
    expect(SECTORS).toContain(decodeRouteParam(encodeURIComponent("haredi")));
    expect(isSearchGroupId(decodeRouteParam(encodeURIComponent("without-volunteering")))).toBe(true);
  });
});
