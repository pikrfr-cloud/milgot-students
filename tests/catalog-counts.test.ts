import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { COUNTS, studentCountsLine } from "@/data/counts";
import { CATALOG_STATS, SCHOLARSHIPS, TIPS } from "@/data/scholarships";
import { computeCatalogCounts } from "@/lib/catalog-counts";
import {
  isDeanRootApplyUrl,
  isUnpublishedDeadline,
  isVariableAmount,
  shouldAutoClassifyAsGuide,
} from "@/lib/catalog";
import { amount, CHECK_ANNUALLY } from "@/data/scholarships/helpers";

describe("counts.json is the student-facing source of truth", () => {
  it("matches computeCatalogCounts and CATALOG_STATS headlines", () => {
    const computed = computeCatalogCounts(SCHOLARSHIPS, TIPS);
    expect(COUNTS).toEqual(computed);
    expect(COUNTS.matchable).toBe(CATALOG_STATS.total);
    expect(COUNTS.guide).toBe(CATALOG_STATS.guide);
    expect(COUNTS.tips).toBe(CATALOG_STATS.tips);
    expect(COUNTS.lastVerifiedMonth).toBe(CATALOG_STATS.lastVerifiedMonth);
    expect(studentCountsLine(COUNTS)).toBe(`${COUNTS.matchable} מלגות`);
    expect(studentCountsLine(COUNTS)).not.toMatch(/רשומות בקטלוג/);
  });

  it("keeps the committed JSON identical to the computed object", () => {
    const raw = JSON.parse(readFileSync(join(process.cwd(), "data/counts.json"), "utf8"));
    expect(raw).toEqual(computeCatalogCounts(SCHOLARSHIPS, TIPS));
  });
});

describe("dean-root + unpublished date + variable amount → מדריך", () => {
  it("treats a dean homepage with no ₪ and no day as a guide shell", () => {
    expect(isDeanRootApplyUrl("https://dekanat.haifa.ac.il/")).toBe(true);
    expect(isDeanRootApplyUrl("https://studean.huji.ac.il/")).toBe(true);
    expect(isDeanRootApplyUrl("https://www.telhai.ac.il/")).toBe(true);
    expect(
      isDeanRootApplyUrl("https://deanstudents.tau.ac.il/financial-aid/special-scholarships"),
    ).toBe(false);
    expect(isUnpublishedDeadline(CHECK_ANNUALLY)).toBe(true);
    expect(isVariableAmount(amount("משתנה", { uncertain: true }))).toBe(true);
    expect(isVariableAmount(amount("15,000 ₪", { min: 15000, max: 15000 }))).toBe(false);
    expect(
      shouldAutoClassifyAsGuide({
        applyUrl: "https://dekanat.haifa.ac.il/",
        deadline: CHECK_ANNUALLY,
        amounts: amount("משתנה", { uncertain: true }),
      }),
    ).toBe(true);
    expect(
      shouldAutoClassifyAsGuide({
        applyUrl: "https://dekanat.haifa.ac.il/",
        deadline: CHECK_ANNUALLY,
        amounts: amount("משתנה", { uncertain: true }),
        treatment: "selective",
      }),
    ).toBe(false);
  });
});
