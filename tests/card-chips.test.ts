import { describe, expect, it } from "vitest";
import { MATCHABLE_SCHOLARSHIPS, SCHOLARSHIPS } from "@/data/scholarships";
import { allOf, amount, deadline, s } from "@/data/scholarships/helpers";
import {
  amountChipHe,
  amountConfidence,
  deadlineChipHe,
  faceChips,
  requiresVolunteering,
} from "@/lib/card-chips";

function fixture(
  partial: Partial<Parameters<typeof s>[0]> & Pick<Parameters<typeof s>[0], "id">,
) {
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

describe("amount confidence chips", () => {
  it("marks a published number as approved", () => {
    expect(amountConfidence({ textHe: "15,000 ₪", minIls: 15000, maxIls: 15000 })).toBe("approved");
    expect(amountChipHe({ textHe: "15,000 ₪", minIls: 15000, maxIls: 15000 })).toBe("15,000 ₪");
  });

  it("marks a numeric uncertain amount as צפי", () => {
    expect(amountConfidence({ textHe: "עד 10,000", minIls: 10000, maxIls: 10000, uncertain: true })).toBe(
      "estimate",
    );
  });

  it("marks a numberless amount as unpublished", () => {
    expect(amountConfidence({ textHe: "משתנה לפי ועדה", uncertain: true })).toBe("unpublished");
    expect(amountChipHe({ textHe: "משתנה לפי ועדה", uncertain: true })).toBe("לא פורסם");
  });

  it("keeps mil-GO as an approved shekel chip", () => {
    const milGo = SCHOLARSHIPS.find((row) => row.id === "mil-go")!;
    expect(amountConfidence(milGo.amounts)).toBe("approved");
    expect(amountChipHe(milGo.amounts)).toBe("עד 12,480 ₪");
  });
});

describe("deadline chips", () => {
  const asOf = new Date("2026-09-02T12:00:00Z");

  it("shows a public label when a date exists", () => {
    const label = deadlineChipHe(
      { kind: "fixed", date: "2026-09-10", textHe: "10 בספטמבר" },
      "2026-09-02",
      asOf,
    );
    expect(label).toMatch(/נסגרת|פתוח/);
    expect(label).not.toBe("טרם פורסם");
  });

  it("uses צפי when the window is an estimate", () => {
    expect(
      deadlineChipHe(
        { kind: "varies", textHe: "לפי המוסד", windowHe: "סתיו", uncertain: true },
        "2026-09-02",
        asOf,
      ),
    ).toBe("צפי");
  });

  it("uses טרם פורסם when nothing was published", () => {
    expect(
      deadlineChipHe({ kind: "varies", textHe: "טרם פורסם" }, "2026-09-02", asOf),
    ).toBe("טרם פורסם");
  });
});

describe("volunteering chips", () => {
  it("requires volunteering from type, hours, willingness, or Perach", () => {
    expect(
      requiresVolunteering(fixture({ id: "t-vol", types: ["volunteering"] })),
    ).toBe(true);
    expect(
      requiresVolunteering(
        fixture({
          id: "t-hours",
          eligibility: allOf({ type: "minVolunteerHours", value: 40 }),
        }),
      ),
    ).toBe(true);
    expect(
      requiresVolunteering(
        fixture({
          id: "t-will",
          eligibility: allOf({ type: "willingToVolunteer" }),
        }),
      ),
    ).toBe(true);
    expect(requiresVolunteering(fixture({ id: "t-none" }))).toBe(false);
  });

  it("puts the three face chips on every matchable row", () => {
    for (const row of MATCHABLE_SCHOLARSHIPS) {
      const chips = faceChips(row, new Date("2026-09-02T12:00:00Z"));
      expect(chips.amountHe.length).toBeGreaterThan(0);
      expect(chips.deadlineHe.length).toBeGreaterThan(0);
      expect(["ללא התנדבות", "דורש התנדבות"]).toContain(chips.volunteeringHe);
    }
  });
});
