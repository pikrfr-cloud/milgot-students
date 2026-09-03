import { describe, expect, it } from "vitest";
import { amount, deadline } from "@/data/scholarships/helpers";
import { MATCHABLE_SCHOLARSHIPS, SCHOLARSHIPS } from "@/data/scholarships";
import { amountHeadlineHe, formatHebrewLongDate } from "@/lib/format";
import { scholarshipOgCopy } from "@/lib/scholarship-og";
import type { Scholarship } from "@/lib/types";

function row(partial: Partial<Scholarship> & Pick<Scholarship, "id" | "nameHe">): Scholarship {
  return {
    funderHe: "קרן",
    types: ["need"],
    scope: "national",
    cadence: "annual",
    amounts: amount("10,000 ₪", { min: 10000, max: 10000 }),
    deadline: deadline("1 באוקטובר", { date: "2026-10-01" }),
    whoItsForHe: "לסטודנטים במסלול בדיקה",
    documentsHe: ["מסמך"],
    howToApplyHe: "הגשה",
    lastVerified: "2026-09-02",
    sourceUrls: ["https://example.org/page"],
    eligibility: { type: "degreeLevelIn", values: ["ba"] },
    ...partial,
  };
}

describe("scholarshipOgCopy", () => {
  it("includes published amount and known deadline in title and description", () => {
    const og = scholarshipOgCopy(
      row({
        id: "sample",
        nameHe: "מלגת בדיקה",
        amounts: amount("עד 12,480 ₪", { min: 5000, max: 12480 }),
        deadline: deadline("4 באוקטובר", { date: "2026-10-04" }),
      }),
    );
    expect(og.title).toBe("מלגת בדיקה — קרן — עד 12,480 ₪ · 4 באוקטובר 2026");
    expect(og.description).toContain("עד 12,480 ₪");
    expect(og.description).toContain("4 באוקטובר 2026");
    expect(og.description).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it("marks a missing close date as לא ודאי and does not invent one", () => {
    const og = scholarshipOgCopy(
      row({
        id: "undated",
        nameHe: "בלי מועד",
        deadline: deadline("מועד טרם פורסם", { kind: "varies", uncertain: true }),
      }),
    );
    expect(og.title).toContain("לא ודאי");
    expect(og.description).toContain("לא ודאי");
    expect(og.title).not.toMatch(/2026-1[0-2]/);
  });

  it("gives each catalog scholarship a unique OG title with its own amount and deadline", () => {
    const titles = SCHOLARSHIPS.map((s) => scholarshipOgCopy(s).title);
    expect(new Set(titles).size).toBe(titles.length);
    for (const s of MATCHABLE_SCHOLARSHIPS) {
      const og = scholarshipOgCopy(s);
      expect(og.title).toContain(s.nameHe);
      expect(og.title).toContain(amountHeadlineHe(s.amounts));
      if (s.deadline.date) {
        expect(og.title).toContain(formatHebrewLongDate(s.deadline.date));
        expect(og.description).toContain(formatHebrewLongDate(s.deadline.date));
      } else {
        expect(og.title).toContain("לא ודאי");
        expect(og.description).toContain("לא ודאי");
      }
    }
  });

  it("does not repeat funderHe when that token is already inside nameHe", () => {
    const achva = SCHOLARSHIPS.find((s) => s.id === "achva-aid");
    if (!achva) throw new Error("missing achva-aid");
    const og = scholarshipOgCopy(achva);
    expect(achva.nameHe).toContain(achva.funderHe);
    expect(og.title).toBe(
      `${achva.nameHe} — ${amountHeadlineHe(achva.amounts)} · לא ודאי`,
    );
    const funderHits = og.title.split(achva.funderHe).length - 1;
    expect(funderHits).toBe(1);
    expect(og.title).not.toBe(
      `${achva.nameHe} — ${achva.funderHe} — ${amountHeadlineHe(achva.amounts)} · לא ודאי`,
    );
  });
});
