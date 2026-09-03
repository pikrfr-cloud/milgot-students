import { describe, expect, it } from "vitest";
import { amount, deadline } from "@/data/scholarships/helpers";
import { MATCHABLE_SCHOLARSHIPS } from "@/data/scholarships";
import { uniqueMatchableByApplyUrl } from "@/lib/catalog";
import { CLOSING_WINDOW_DAYS, scholarshipsClosingSoon } from "@/lib/closing";
import { sitemapEntries } from "@/lib/catalog-routes";
import type { Scholarship } from "@/lib/types";

const asOf = new Date("2026-09-03T12:00:00+03:00");

function row(id: string, date?: string): Scholarship {
  return {
    id,
    nameHe: id,
    funderHe: "קרן",
    types: ["need"],
    scope: "national",
    cadence: "annual",
    amounts: amount("1,000 ₪", { min: 1000, max: 1000 }),
    deadline: date
      ? deadline(date, { date })
      : deadline("מועד טרם פורסם", { kind: "varies", uncertain: true }),
    whoItsForHe: "בדיקה",
    documentsHe: ["מסמך"],
    howToApplyHe: "הגשה",
    lastVerified: "2026-09-02",
    sourceUrls: ["https://example.org/page"],
    eligibility: { type: "degreeLevelIn", values: ["ba"] },
  };
}

describe("scholarshipsClosingSoon", () => {
  it("keeps known close dates in the next 30 days, sorted by date, and drops undated rows", () => {
    const list = [
      row("later", "2026-09-20"),
      row("soon", "2026-09-10"),
      row("no-date"),
      row("past", "2026-08-01"),
      row("on-day-30", "2026-10-03"),
      row("day-31", "2026-10-04"),
      row("today", "2026-09-03"),
    ];
    const got = scholarshipsClosingSoon(list, asOf, CLOSING_WINDOW_DAYS);
    expect(got.map((s) => s.id)).toEqual(["today", "soon", "later", "on-day-30"]);
    expect(got.every((s) => s.deadline.date)).toBe(true);
    expect(got.some((s) => s.id === "no-date")).toBe(false);
    expect(got.some((s) => s.id === "past")).toBe(false);
    expect(got.some((s) => s.id === "day-31")).toBe(false);
  });

  it("excludes live catalog rows that have no close date", () => {
    const undated = MATCHABLE_SCHOLARSHIPS.filter((s) => !s.deadline.date);
    expect(undated.length).toBeGreaterThan(0);
    const closing = scholarshipsClosingSoon(
      uniqueMatchableByApplyUrl(MATCHABLE_SCHOLARSHIPS),
      asOf,
    );
    expect(closing.every((s) => Boolean(s.deadline.date))).toBe(true);
    for (const s of undated) {
      expect(closing.map((x) => x.id)).not.toContain(s.id);
    }
    const dates = closing.map((s) => s.deadline.date as string);
    expect(dates).toEqual([...dates].sort());
  });
});

describe("closing page is in the sitemap", () => {
  it("includes /closing/ with trailing slash", () => {
    const urls = sitemapEntries().map((e) => e.url);
    expect(urls).toContain("https://pikrfr-cloud.github.io/milgot-students/closing/");
  });
});
