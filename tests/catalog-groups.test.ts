import { describe, expect, it } from "vitest";
import { COUNTS } from "@/data/counts";
import { MATCHABLE_SCHOLARSHIPS } from "@/data/scholarships";
import { uniqueMatchableCount } from "@/lib/catalog";
import {
  groupCollectionPath,
  isMiluimScholarship,
  isPeripheryScholarship,
  SEARCH_GROUP_IDS,
  searchGroupsWithCounts,
  scholarshipsForGroup,
} from "@/lib/catalog-groups";
import { sitemapEntries } from "@/lib/catalog-routes";
import { studentLandingChips } from "@/lib/student-landings";

describe("student search groups", () => {
  it("ships the three search landings students actually look for, with real counts", () => {
    const groups = searchGroupsWithCounts();
    const ids = groups.map((g) => g.id);
    expect(ids).toEqual(expect.arrayContaining([...SEARCH_GROUP_IDS]));
    expect(groups).toHaveLength(SEARCH_GROUP_IDS.length);

    for (const g of groups) {
      expect(g.count).toBeGreaterThan(0);
      expect(g.count).toBeLessThan(1000);
      expect(g.count).toBe(uniqueMatchableCount(scholarshipsForGroup(g.id)));
      expect(g.count).toBeLessThanOrEqual(COUNTS.matchable);
      expect(g.href).toBe(groupCollectionPath(g.id));
      expect(g.labelHe).not.toMatch(/1000|1,000|אלף/);
    }
  });

  it("does not put volunteering funds in בלי התנדבות", () => {
    const none = scholarshipsForGroup("without-volunteering");
    expect(none.some((s) => s.types.includes("volunteering"))).toBe(false);
    expect(none.length).toBeGreaterThan(0);
  });

  it("keeps miluim to reserved-duty rules or names, not every service row", () => {
    const miluim = scholarshipsForGroup("miluim");
    expect(miluim.length).toBeGreaterThan(0);
    expect(miluim.every(isMiluimScholarship)).toBe(true);
    expect(miluim.some((s) => s.id === "mil-go")).toBe(false);
    expect(miluim.some((s) => s.id === "yeud-44")).toBe(false);
  });

  it("keeps periphery to type or eligibility, not the HUJI campus list", () => {
    const periphery = scholarshipsForGroup("periphery");
    expect(periphery.length).toBeGreaterThan(0);
    expect(periphery.every(isPeripheryScholarship)).toBe(true);
  });

  it("lists only non-empty group and sector chips, never claiming 1000", () => {
    const chips = studentLandingChips();
    expect(chips.some((c) => c.id === "without-volunteering")).toBe(true);
    expect(chips.some((c) => c.id === "miluim")).toBe(true);
    expect(chips.some((c) => c.id === "periphery")).toBe(true);
    expect(chips.some((c) => c.id.startsWith("sector-"))).toBe(true);
    for (const chip of chips) {
      expect(chip.count).toBeGreaterThan(0);
      expect(chip.count).toBeLessThan(1000);
    }
    expect(COUNTS.matchable).toBeLessThan(1000);
  });

  it("puts populated group URLs on the sitemap", () => {
    const urls = sitemapEntries().map((e) => e.url);
    for (const g of searchGroupsWithCounts()) {
      expect(urls).toContain(`https://pikrfr-cloud.github.io/milgot-students${g.href}`);
    }
  });

  it("counts unique matchable rows, not catalog kitchen rows", () => {
    expect(scholarshipsForGroup("without-volunteering").every((s) => MATCHABLE_SCHOLARSHIPS.includes(s))).toBe(
      true,
    );
  });
});
