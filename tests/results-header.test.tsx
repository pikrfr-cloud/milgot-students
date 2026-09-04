import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ScholarshipCard } from "@/components/ScholarshipCard";
import { ResultsMatchingHeader } from "@/components/ResultsView";
import { ScholarshipFaceChips } from "@/components/ScholarshipFaceChips";
import { amount, deadline } from "@/data/scholarships/helpers";
import { matchHeadline } from "@/lib/format";
import { matchScholarship } from "@/lib/matcher";
import { SCHOLARSHIPS } from "@/data/scholarships";
import { compactAmountHe, buildWhatsAppReport } from "@/lib/whatsapp-report";
import type { StudentProfile } from "@/lib/types";

const OPENU_YEAR3_PETAH_TIKVA_PERSONA: StudentProfile = {
  institution: "openu",
  degreeLevel: "ba",
  yearOfStudy: 3,
  cityOfResidence: "פתח תקווה",
  householdSize: 4,
  householdIncomeBand: "band_8_15k",
  service: "none",
  willingToVolunteer: false,
  sectors: ["jewish_general"],
  isOleh: false,
};
import {
  NO_DOUBLE_COUNT_CAVEAT_HE,
  matchingNowHeadlineHe,
} from "@/lib/report-conversion";
import type { Scholarship, ScholarshipMatch } from "@/lib/types";

function fake(
  partial: Partial<Scholarship> & Pick<Scholarship, "id" | "amounts" | "deadline">,
): Scholarship {
  return {
    nameHe: partial.nameHe ?? partial.id,
    funderHe: "קרן",
    types: ["need"],
    scope: "national",
    cadence: "annual",
    whoItsForHe: "x",
    documentsHe: ["צילום תעודת זהות"],
    howToApplyHe: "x",
    lastVerified: "2026-09-01",
    sourceUrls: ["https://example.ac.il/page/x"],
    eligibility: { type: "degreeLevelIn", values: ["ba"] },
    ...partial,
  };
}

function matchOf(s: Scholarship): ScholarshipMatch {
  return {
    scholarship: s,
    bucket: "eligible",
    eval: {
      status: "pass",
      failCount: 0,
      immutableFailCount: 0,
      mutableFailCount: 0,
      criteria: [],
    },
    passed: [],
    failed: [],
    unknown: [],
  };
}

describe("results header has no summed ₪", () => {
  it("renders the matching count and a no-stacking line, not a catalog total", () => {
    const a = fake({
      id: "a",
      nameHe: "מלגה א",
      amounts: amount("10,000 ₪", { min: 10000, max: 10000 }),
      deadline: deadline("open", { date: "2026-10-15" }),
    });
    const b = fake({
      id: "b",
      nameHe: "מלגה ב",
      amounts: amount("8,000 ₪", { min: 8000, max: 8000 }),
      deadline: deadline("open", { date: "2026-10-20" }),
    });

    const header = renderToStaticMarkup(<ResultsMatchingHeader eligibleCount={2} />);
    expect(header).toContain(matchingNowHeadlineHe(2));
    expect(header).toContain(NO_DOUBLE_COUNT_CAVEAT_HE);
    expect(header).not.toMatch(/₪/);
    expect(header).not.toContain("סכום משוער");
    expect(header).not.toContain("סה״כ");
    expect(header).not.toContain("18,000");
    expect(header).not.toContain("הערכה");
    expect(header).not.toContain("מלגות פתוחות בלי סכום");

    const cardA = renderToStaticMarkup(<ScholarshipFaceChips scholarship={a} />);
    const cardB = renderToStaticMarkup(<ScholarshipFaceChips scholarship={b} />);
    expect(cardA).toContain("10,000 ₪");
    expect(cardB).toContain("8,000 ₪");
    expect(cardA).not.toContain("18,000");
    expect(cardB).not.toContain("18,000");
  });

  it("does not call the old sum headline from ResultsView or print copy", () => {
    const src = readFileSync(join(process.cwd(), "components/ResultsView.tsx"), "utf8");
    expect(src).toContain("ResultsMatchingHeader");
    expect(src).toContain("eligible.length");
    expect(src).not.toContain("potentialHeadlineHe");
    expect(src).not.toContain("potentialOpenAmount");
    expect(src).not.toContain("missingAmounts");
    expect(src).not.toContain("סכום משוער");
    expect(src).not.toMatch(/formatIls\(.*sum/);
  });
});

describe("ineligible cards show the fail reason without expand", () => {
  it("prints one Hebrew fail line on the card face for מלגות 6000", () => {
    const sch = SCHOLARSHIPS.find((s) => s.id === "isef-recanati-6000");
    if (!sch) throw new Error("missing isef-recanati-6000");
    const match = matchScholarship(sch, OPENU_YEAR3_PETAH_TIKVA_PERSONA);
    expect(match.bucket).toBe("ineligible");
    const html = renderToStaticMarkup(<ScholarshipCard match={match} />);
    const headline = matchHeadline(match);
    expect(headline).toMatch(/לא מתאים/);
    expect(headline).toMatch(/שירות|התנדבות/);
    expect(html).toContain(headline);
    const reasonAt = html.indexOf(headline);
    const detailsAt = html.indexOf("פירוט קריטריונים");
    expect(reasonAt).toBeGreaterThan(-1);
    expect(detailsAt).toBeGreaterThan(reasonAt);
    expect(html).not.toContain(">4<");
  });
});

describe("chat compact report has no summed ₪", () => {
  it("keeps per-line catalog amounts and does not print a total", () => {
    const a = fake({
      id: "a",
      nameHe: "מלגה א",
      amounts: amount("10,000 ₪", { min: 10000, max: 10000 }),
      deadline: deadline("open", { date: "2026-10-15" }),
    });
    const b = fake({
      id: "b",
      nameHe: "מלגה ב",
      amounts: amount("8,000 ₪", { min: 8000, max: 8000 }),
      deadline: deadline("open", { date: "2026-10-20" }),
    });
    expect(compactAmountHe(a.amounts)).toContain("10,000");
    expect(compactAmountHe(b.amounts)).toContain("8,000");

    const report = buildWhatsAppReport(
      { degreeLevel: "ba" },
      {
        asOf: new Date("2026-09-01T12:00:00+03:00"),
        matchAllFn: () => [matchOf(a), matchOf(b)],
      },
    );
    expect(report.text).toContain("10,000");
    expect(report.text).toContain("8,000");
    expect(report.text).not.toContain("18,000");
    expect(report.text).not.toContain("סכום משוער");
    expect(report.text).not.toContain("סה״כ");

    const chat = readFileSync(join(process.cwd(), "components/ChatIntake.tsx"), "utf8");
    expect(chat).not.toContain("potentialHeadlineHe");
    expect(chat).not.toContain("potentialOpenAmount");
    expect(chat).not.toContain("סכום משוער");
  });
});
