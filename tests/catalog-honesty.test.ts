import { describe, expect, it } from "vitest";
import {
  CATALOG_STATS,
  GUIDE_SCHOLARSHIPS,
  LEGAL_UPDATED_HE,
  MATCHABLE_SCHOLARSHIPS,
  SCHOLARSHIPS,
  VERIFIED_EXTRA,
  VERIFIED_EXTRA_2,
} from "@/data/scholarships";
import { allOf, amount, deadline, s } from "@/data/scholarships/helpers";
import {
  applyUrlDuplicateGroups,
  canonicalApplyUrl,
  hasSecondaryDeadlineSource,
  isGuideRecord,
  isMatchableScholarship,
  maxLastVerified,
  uniqueApplyUrlNoteHe,
  uniqueMatchableByApplyUrl,
  uniqueMatchableCount,
} from "@/lib/catalog";
import { formatHebrewLongDate } from "@/lib/format";
import { HE } from "@/lib/i18n/he";
import type { Scholarship } from "@/lib/types";

function matchableFixture(partial: Partial<Scholarship> & Pick<Scholarship, "id" | "applyUrl">): Scholarship {
  return s({
    nameHe: partial.nameHe ?? partial.id,
    funderHe: "בדיקה",
    types: ["need"],
    scope: "national",
    amounts: amount("1,000 ₪", { min: 1000, max: 1000 }),
    cadence: "annual",
    deadline: deadline("2026-10-01", { date: "2026-10-01" }),
    whoItsForHe: "בדיקה",
    documentsHe: ["מסמך"],
    howToApplyHe: "הגשה",
    lastVerified: "2026-09-02",
    sourceUrls: ["https://example.org/official-page"],
    eligibility: allOf({ type: "degreeLevelIn", values: ["ba"] }),
    ...partial,
  });
}

describe("catalog matchable vs מדריך counts", () => {
  it("counts unique matchable applyUrl in CATALOG_STATS.total, not list rows", () => {
    expect(MATCHABLE_SCHOLARSHIPS.every((s) => !isGuideRecord(s))).toBe(true);
    expect(GUIDE_SCHOLARSHIPS.every(isGuideRecord)).toBe(true);
    expect(CATALOG_STATS.matchableRows).toBe(MATCHABLE_SCHOLARSHIPS.length);
    expect(CATALOG_STATS.total).toBe(uniqueMatchableCount(MATCHABLE_SCHOLARSHIPS));
    expect(CATALOG_STATS.total).toBe(uniqueMatchableCount(SCHOLARSHIPS));
    expect(CATALOG_STATS.guide).toBe(GUIDE_SCHOLARSHIPS.length);
    expect(CATALOG_STATS.matchableRows + CATALOG_STATS.guide).toBe(SCHOLARSHIPS.length);
    expect(CATALOG_STATS.total).toBeLessThanOrEqual(CATALOG_STATS.matchableRows);
    expect(CATALOG_STATS.total).toBeLessThan(SCHOLARSHIPS.length);
    expect(CATALOG_STATS.guide).toBeGreaterThan(0);
    expect(CATALOG_STATS.tips).toBeGreaterThan(0);
    expect(CATALOG_STATS.uniqueApplyUrlNote).toBe(
      uniqueApplyUrlNoteHe(CATALOG_STATS.matchableRows, CATALOG_STATS.total),
    );
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
    const idsIn = (url: string) => (groups.get(canonicalApplyUrl(url)) ?? []).map((s) => s.id).sort();

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

describe("verified-extra תשפ״ז additions", () => {
  it("adds only matchable records with a numeric ₪ amount and a dated deadline", () => {
    expect(VERIFIED_EXTRA.length).toBeGreaterThanOrEqual(8);
    const catalogIds = new Set(SCHOLARSHIPS.map((s) => s.id));
    const existingApply = new Set(
      SCHOLARSHIPS.filter((s) => !VERIFIED_EXTRA.some((e) => e.id === s.id)).map((s) => s.applyUrl),
    );
    /** Same official pages already on main as *-community / #15 tau-liber-phd. */
    const knownApplyUrlPeers = new Set([
      "ramat-hasharon-students",
      "hof-hasharon-pais",
      "hevel-modiin-pais",
      "tau-liber-phd",
    ]);
    for (const rec of VERIFIED_EXTRA) {
      expect(catalogIds.has(rec.id), rec.id).toBe(true);
      expect(isGuideRecord(rec), rec.id).toBe(false);
      expect(rec.lastVerified, rec.id).toBe("2026-09-02");
      expect(rec.amounts.minIls != null || rec.amounts.maxIls != null, rec.id).toBe(true);
      expect(rec.deadline.date, rec.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(rec.applyUrl, rec.id).toBeTruthy();
      if (!knownApplyUrlPeers.has(rec.id)) {
        expect(existingApply.has(rec.applyUrl), `${rec.id} duplicates applyUrl`).toBe(false);
      }
      expect(rec.sourceUrls.some((u) => u.startsWith("http")), rec.id).toBe(true);
    }
  });
});

describe("verified-extra-2 תשפ״ז additions", () => {
  it("adds only matchable records with a numeric ₪ amount and a dated deadline", () => {
    expect(VERIFIED_EXTRA_2.length).toBe(9);
    const catalogIds = new Set(SCHOLARSHIPS.map((s) => s.id));
    const existingApply = new Set(
      SCHOLARSHIPS.filter((s) => !VERIFIED_EXTRA_2.some((e) => e.id === s.id)).map((s) => s.applyUrl),
    );
    const reservedIds = new Set([
      "ramat-hasharon-students",
      "hof-hasharon-pais",
      "rosh-haayin-students",
      "hevel-modiin-pais",
      "heseg-leadership",
      "tau-liber-phd",
      "huji-kolodny-ba",
      "biu-jewish-phd-dean",
    ]);
    for (const rec of VERIFIED_EXTRA_2) {
      expect(catalogIds.has(rec.id), rec.id).toBe(true);
      expect(reservedIds.has(rec.id), rec.id).toBe(false);
      expect(isGuideRecord(rec), rec.id).toBe(false);
      expect(rec.lastVerified, rec.id).toBe("2026-09-02");
      expect(rec.amounts.minIls != null || rec.amounts.maxIls != null, rec.id).toBe(true);
      expect(rec.deadline.date, rec.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(rec.applyUrl, rec.id).toBeTruthy();
      expect(existingApply.has(rec.applyUrl), `${rec.id} duplicates applyUrl`).toBe(false);
      expect(rec.sourceUrls.some((u) => u.startsWith("http")), rec.id).toBe(true);
    }
  });
});

describe("unique-by-applyUrl headline", () => {
  it("counts two matchable rows sharing applyUrl as 1 in the headline and 2 in the list", () => {
    const a = matchableFixture({
      id: "dup-a",
      nameHe: "רשומה א",
      applyUrl: "https://example.org/same-apply",
    });
    const b = matchableFixture({
      id: "dup-b",
      nameHe: "רשומה ב",
      applyUrl: "https://example.org/same-apply",
    });
    const list = [a, b];
    expect(list.filter(isMatchableScholarship)).toHaveLength(2);
    expect(uniqueMatchableByApplyUrl(list).map((s) => s.id)).toEqual(["dup-a"]);
    expect(uniqueMatchableCount(list)).toBe(1);
    expect(uniqueApplyUrlNoteHe(2, 1)).toBe("2 רשומות בקטלוג, 1 ייחודיות לפי קישור הגשה");
  });

  it("treats www vs bare host as the same applyUrl for the headline", () => {
    const a = matchableFixture({
      id: "www-a",
      applyUrl: "https://www.example.org/apply/",
    });
    const b = matchableFixture({
      id: "www-b",
      applyUrl: "https://example.org/apply",
    });
    expect(uniqueMatchableCount([a, b])).toBe(1);
    expect([a, b].filter(isMatchableScholarship)).toHaveLength(2);
  });

  it("keeps declared municipal applyUrl duplicates in the list and collapses them in CATALOG_STATS.total", () => {
    const pairs = [
      ["ramat-hasharon-community", "ramat-hasharon-students"],
      ["hof-hasharon-community", "hof-hasharon-pais"],
      ["rosh-haayin-community", "rosh-haayin-students"],
      ["hevel-modiin-community", "hevel-modiin-pais"],
    ] as const;
    const uniqueIds = new Set(uniqueMatchableByApplyUrl(MATCHABLE_SCHOLARSHIPS).map((s) => s.id));
    for (const [first, second] of pairs) {
      const a = MATCHABLE_SCHOLARSHIPS.find((s) => s.id === first);
      const b = MATCHABLE_SCHOLARSHIPS.find((s) => s.id === second);
      expect(a, first).toBeTruthy();
      expect(b, second).toBeTruthy();
      expect(canonicalApplyUrl(a!.applyUrl!)).toBe(canonicalApplyUrl(b!.applyUrl!));
      expect(uniqueIds.has(first) || uniqueIds.has(second)).toBe(true);
      expect(uniqueIds.has(first) && uniqueIds.has(second)).toBe(false);
    }
    expect(CATALOG_STATS.total).toBeLessThan(CATALOG_STATS.matchableRows);
  });
});

describe("guide shells vs matchable programs", () => {
  it("moves homepage dean shells with no ₪, no calendar day, and no real extra eligibility into מדריך", () => {
    const moved = [
      "ariel-financial-aid",
      "ruppin-aid",
      "mta-aid",
      "hadassah-aid",
      "afeka-aid",
      "telhai-dean-aid",
      "haifa-financial-aid",
      "huji-financial-aid",
    ];
    for (const id of moved) {
      const rec = SCHOLARSHIPS.find((s) => s.id === id);
      expect(rec, id).toBeTruthy();
      expect(isGuideRecord(rec!), id).toBe(true);
      expect(MATCHABLE_SCHOLARSHIPS.some((s) => s.id === id), id).toBe(false);
      expect(GUIDE_SCHOLARSHIPS.some((s) => s.id === id), id).toBe(true);
    }
  });

  it("keeps records that already have real matcher rules, ₪, or a calendar day as matchable", () => {
    const keep = [
      "sapir-dean-aid",
      "shenkar-aid",
      "kinneret-college-payis",
      "tau-financial-aid",
      "technion-financial-aid",
      "openu-financial-aid",
    ];
    for (const id of keep) {
      const rec = SCHOLARSHIPS.find((s) => s.id === id);
      expect(rec, id).toBeTruthy();
      expect(isMatchableScholarship(rec!), id).toBe(true);
    }
  });
});

describe("secondary-source deadline tag", () => {
  it("tags mil-go and irtikaa whose day dates came from an aggregator, not the issuer page", () => {
    const milGo = SCHOLARSHIPS.find((s) => s.id === "mil-go")!;
    const irtikaa = SCHOLARSHIPS.find((s) => s.id === "irtikaa")!;
    expect(hasSecondaryDeadlineSource(milGo)).toBe(true);
    expect(hasSecondaryDeadlineSource(irtikaa)).toBe(true);
    expect(milGo.deadlineSource).toBe("secondary");
    expect(irtikaa.deadlineSource).toBe("secondary");
    expect(HE.catalog.secondaryDeadline).toBe("מקור משני למועד");
  });

  it("does not tag records whose deadline is from the issuer's own page", () => {
    const perach = SCHOLARSHIPS.find((s) => s.id === "perach")!;
    const moshal = SCHOLARSHIPS.find((s) => s.id === "moshal")!;
    const shenkar = SCHOLARSHIPS.find((s) => s.id === "shenkar-aid")!;
    expect(hasSecondaryDeadlineSource(perach)).toBe(false);
    expect(hasSecondaryDeadlineSource(moshal)).toBe(false);
    expect(hasSecondaryDeadlineSource(shenkar)).toBe(false);
  });
});
