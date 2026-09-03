import { describe, expect, it } from "vitest";
import { amount, deadline } from "@/data/scholarships/helpers";
import { matchScholarship } from "@/lib/matcher";
import {
  dropMutexDuplicates,
  matchingNowHeadlineHe,
  potentialHeadlineHe,
  potentialOpenAmount,
  unifiedDocuments,
  upcomingCloseDates,
} from "@/lib/report-conversion";
import type { Scholarship, ScholarshipMatch } from "@/lib/types";

const asOf = new Date("2026-09-01T12:00:00+03:00");

function fake(partial: Partial<Scholarship> & Pick<Scholarship, "id" | "amounts" | "deadline">): Scholarship {
  return {
    nameHe: partial.id,
    funderHe: "קרן",
    types: ["need"],
    scope: "national",
    cadence: "annual",
    whoItsForHe: "x",
    documentsHe: partial.documentsHe ?? ["צילום תעודת זהות"],
    howToApplyHe: "x",
    lastVerified: "2026-09-01",
    sourceUrls: ["https://example.ac.il/page/x"],
    eligibility: { type: "degreeLevelIn", values: ["ba"] },
    ...partial,
  };
}

function matchOf(s: Scholarship, bucket: ScholarshipMatch["bucket"] = "eligible"): ScholarshipMatch {
  const m = matchScholarship(s, { degreeLevel: "ba" }, { asOf });
  return { ...m, bucket };
}

describe("₪ header — potentialOpenAmount", () => {
  it("sums maxIls of open eligible+needInfo only, excludes missing amounts, and does not invent 0", () => {
    const numbered = fake({
      id: "a",
      amounts: amount("10,000 ₪", { max: 10000 }),
      deadline: deadline("open", { date: "2026-10-15" }),
    });
    const missing = fake({
      id: "b",
      amounts: amount("משתנה", { uncertain: true }),
      deadline: deadline("open", { date: "2026-10-20" }),
    });
    const closed = fake({
      id: "c",
      amounts: amount("8,000 ₪", { max: 8000 }),
      deadline: deadline("closed", { date: "2026-08-01" }),
    });
    const near = fake({
      id: "d",
      amounts: amount("9,000 ₪", { max: 9000 }),
      deadline: deadline("open", { date: "2026-10-10" }),
    });

    const matches = [
      matchOf(numbered, "eligible"),
      matchOf(missing, "needInfo"),
      matchOf(closed, "eligible"),
      matchOf(near, "nearMiss"),
    ];
    const result = potentialOpenAmount(matches, asOf);
    expect(result.openCount).toBe(2);
    expect(result.missingAmountCount).toBe(1);
    expect(result.sumIls).toBe(10000);
    expect(result.counted).toBe(1);
    expect(potentialHeadlineHe(result)).toContain("10,000");
    expect(potentialHeadlineHe(result)).toContain("₪");
    expect(potentialHeadlineHe(result)).not.toMatch(/עד 0 ₪/);
    expect(potentialHeadlineHe(result)).not.toContain("פוטנציאל");
    expect(matchingNowHeadlineHe(5)).toBe("5 מלגות שמתאימות עכשיו");
    expect(matchingNowHeadlineHe(1)).toBe("מלגה אחת שמתאימה עכשיו");
  });

  it("does not double-count mutex overlapping programs", () => {
    const a = fake({
      id: "yeud-a",
      amounts: amount("12,000 ₪", { max: 12000 }),
      deadline: deadline("open", { date: "2026-10-31" }),
      excludes: ["yeud-b"],
    });
    const b = fake({
      id: "yeud-b",
      amounts: amount("6,000 ₪", { max: 6000 }),
      deadline: deadline("open", { date: "2026-10-31" }),
      excludes: ["yeud-a"],
    });
    const matches = [matchOf(a, "eligible"), matchOf(b, "eligible")];
    const selected = dropMutexDuplicates(matches.filter((m) => m.bucket === "eligible"));
    expect(selected).toHaveLength(1);
    expect(selected[0]?.scholarship.id).toBe("yeud-a");
    const result = potentialOpenAmount(matches, asOf);
    expect(result.sumIls).toBe(12000);
    expect(result.mutexDroppedCount).toBe(1);
    expect(result.sumIls).not.toBe(18000);
  });

  it("returns null sum when every open match lacks a numeric max", () => {
    const s = fake({
      id: "no-num",
      amounts: amount("משתנה", { uncertain: true }),
      deadline: deadline("open", { date: "2026-11-01" }),
    });
    const result = potentialOpenAmount([matchOf(s, "eligible")], asOf);
    expect(result.sumIls).toBeNull();
    expect(result.openCount).toBe(1);
    expect(potentialHeadlineHe(result)).not.toContain("0 ₪");
    expect(potentialHeadlineHe(result)).toContain("לא הומצא");
  });
});

describe("timeline and documents", () => {
  it("lists close dates in the next 60 days sorted", () => {
    const soon = fake({
      id: "soon",
      amounts: amount("x", { max: 1 }),
      deadline: deadline("soon", { date: "2026-09-20" }),
    });
    const later = fake({
      id: "later",
      amounts: amount("x", { max: 1 }),
      deadline: deadline("later", { date: "2026-10-10" }),
    });
    const far = fake({
      id: "far",
      amounts: amount("x", { max: 1 }),
      deadline: deadline("far", { date: "2026-12-01" }),
    });
    const list = upcomingCloseDates(
      [matchOf(later), matchOf(far), matchOf(soon)],
      asOf,
      60,
    );
    expect(list.map((m) => m.scholarship.id)).toEqual(["soon", "later"]);
  });

  it("aggregates existing required documents only", () => {
    const a = fake({
      id: "a",
      amounts: amount("x", { max: 1 }),
      deadline: deadline("open", { date: "2026-10-01" }),
      documentsHe: ["צילום תעודת זהות", "אישור לימודים"],
    });
    const b = fake({
      id: "b",
      amounts: amount("x", { max: 1 }),
      deadline: deadline("open", { date: "2026-10-01" }),
      documentsHe: ["צילום תעודת זהות"],
    });
    const docs = unifiedDocuments([matchOf(a), matchOf(b)]);
    expect(docs[0]?.documentHe).toBe("צילום תעודת זהות");
    expect(docs[0]?.count).toBe(2);
    expect(docs.find((d) => d.documentHe === "אישור לימודים")?.count).toBe(1);
  });
});
