import { describe, expect, it } from "vitest";
import {
  CATALOG_STATS,
  GUIDE_SCHOLARSHIPS,
  LEGAL_UPDATED_HE,
  MATCHABLE_SCHOLARSHIPS,
  SCHOLARSHIPS,
} from "@/data/scholarships";
import {
  applyUrlDuplicateGroups,
  isGuideRecord,
  maxLastVerified,
} from "@/lib/catalog";
import { formatHebrewLongDate } from "@/lib/format";

describe("catalog matchable vs מדריך counts", () => {
  it("counts only matchable scholarships in CATALOG_STATS.total", () => {
    expect(MATCHABLE_SCHOLARSHIPS.every((s) => !isGuideRecord(s))).toBe(true);
    expect(GUIDE_SCHOLARSHIPS.every(isGuideRecord)).toBe(true);
    expect(CATALOG_STATS.total).toBe(MATCHABLE_SCHOLARSHIPS.length);
    expect(CATALOG_STATS.guide).toBe(GUIDE_SCHOLARSHIPS.length);
    expect(CATALOG_STATS.total + CATALOG_STATS.guide).toBe(SCHOLARSHIPS.length);
    expect(CATALOG_STATS.total).toBeLessThan(SCHOLARSHIPS.length);
    expect(CATALOG_STATS.guide).toBeGreaterThan(0);
  });

  it("derives lastVerifiedMonth from records instead of a manual string", () => {
    expect(CATALOG_STATS.lastVerifiedMonth).toBe(maxLastVerified(SCHOLARSHIPS));
    expect(CATALOG_STATS.lastVerifiedMonth).toBe(
      SCHOLARSHIPS.map((s) => s.lastVerified).sort().at(-1),
    );
  });

  it("shares one Hebrew legal date from the catalog max lastVerified", () => {
    expect(LEGAL_UPDATED_HE).toBe(formatHebrewLongDate(CATALOG_STATS.lastVerifiedMonth));
    expect(formatHebrewLongDate("2026-09-01")).toBe("1 בספטמבר 2026");
    expect(formatHebrewLongDate("2026-09")).toBe("1 בספטמבר 2026");
  });
});

describe("applyUrl כפילות groups stay visible", () => {
  it("keeps the five named near-duplicate groups instead of deleting them", () => {
    const groups = applyUrlDuplicateGroups(SCHOLARSHIPS);
    const idsIn = (url: string) => (groups.get(url) ?? []).map((s) => s.id).sort();

    expect(idsIn("https://deanstudents.tau.ac.il/financial-aid/special-scholarships")).toEqual(
      ["tau-financial-aid", "tau-first-year-no-external", "tau-special-funds"].sort(),
    );
    expect(idsIn("https://dekanat.haifa.ac.il/")).toEqual(
      ["haifa-excellence-social", "haifa-financial-aid"].sort(),
    );
    expect(
      idsIn("https://www.tel-aviv.gov.il/Residents/Education/Pages/HigherEducation.aspx"),
    ).toEqual(["telaviv-development-fund", "telaviv-south-neighborhoods"].sort());
    expect(idsIn("https://www.telhai.ac.il/")).toEqual(
      ["kiryat-shmona-telhai", "telhai-dean-aid"].sort(),
    );
    expect(idsIn("https://www.smkb.ac.il/students/students-dean/scholarship/assistive/")).toEqual(
      ["kibbutzim-dean", "moe-teaching-conditional-loan"].sort(),
    );
  });
});
