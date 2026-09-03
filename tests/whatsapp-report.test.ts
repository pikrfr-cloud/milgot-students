import { describe, expect, it } from "vitest";
import { amount, deadline, s } from "@/data/scholarships/helpers";
import { SCHOLARSHIPS } from "@/data/scholarships";
import { HE } from "@/lib/i18n/he";
import { formatHebrewLongDate, formatIls } from "@/lib/format";
import { groupMatches, matchAll, matchScholarship } from "@/lib/matcher";
import { profileFieldLabel } from "@/lib/labels";
import { sharedResultsUrl } from "@/lib/profile-share";
import type {
  CriterionResult,
  RuleEval,
  Scholarship,
  ScholarshipMatch,
  StudentProfile,
} from "@/lib/types";
import {
  ELIGIBLE_EXAMPLE_LIMIT,
  MUTABLE_NEAR_MISS_FIELDS,
  WHATSAPP_REPORT_MAX_CHARS,
  WHATSAPP_RESULTS_URL,
  buildWhatsAppReport,
  compactAmountHe,
  compactDeadlineHe,
  eligibleWhyHe,
  formatCatalogDeadlineHe,
  isMutableNearMiss,
  needInfoMissingHe,
  publishedAmountHe,
  reportResultsUrl,
} from "@/lib/whatsapp-report";
const AS_OF = new Date("2026-09-01T12:00:00+03:00");

/** Test fixture — not real student data. Mirrors the Colman BA year-2 matcher fixture. */
export const WHATSAPP_REPORT_FIXTURE_PROFILE: StudentProfile = {
  institution: "colman",
  degreeLevel: "ba",
  yearOfStudy: 2,
  fieldOfStudy: "business",
  cityOfResidence: "ראשון לציון",
  hometown: "ראשון לציון",
  peripheryResidence: false,
  peripheryHometown: false,
  nationalPriorityResidence: false,
  service: "idf",
  yearsSinceDischarge: 3,
  combatRole: false,
  reservistDaysLastYear: 0,
  loneSoldier: false,
  willingToVolunteer: false,
  incomeBand: "middle",
  studyLoad: "full",
  average: 82,
  age: 24,
  gender: "male",
  sectors: ["jewish_general"],
  isOleh: false,
  hasDisability: false,
  firstGeneration: false,
  completedMechina: false,
};

function testScholarship(
  partial: Partial<Scholarship> & Pick<Scholarship, "id" | "eligibility">,
): Scholarship {
  return s({
    nameHe: partial.nameHe ?? partial.id,
    funderHe: "קרן בדיקה",
    types: ["need"],
    scope: "national",
    amounts: amount("5,000 ₪", { min: 5000, max: 5000 }),
    cadence: "annual",
    deadline: deadline("1.11.2026", { date: "2026-11-01" }),
    whoItsForHe: "בדיקה",
    documentsHe: ["צילום תעודת זהות"],
    howToApplyHe: "הגשה",
    lastVerified: "2026-09-01",
    sourceUrls: ["https://example.ac.il/page/x"],
    treatment: "standard",
    ...partial,
  });
}

function matchOf(scholarship: Scholarship, profile: StudentProfile): ScholarshipMatch {
  return matchScholarship(scholarship, profile, { asOf: AS_OF });
}

function emptyEval(partial: Partial<RuleEval> = {}): RuleEval {
  return {
    status: "fail",
    failCount: 1,
    immutableFailCount: 0,
    mutableFailCount: 1,
    criteria: [],
    ...partial,
  };
}

function criterion(partial: Partial<CriterionResult> & Pick<CriterionResult, "id" | "status">): CriterionResult {
  return {
    labelHe: partial.labelHe ?? partial.id,
    detailHe: partial.detailHe ?? "",
    ...partial,
  };
}

function syntheticMatch(
  partial: Partial<ScholarshipMatch> & Pick<ScholarshipMatch, "bucket" | "scholarship">,
): ScholarshipMatch {
  return {
    eval: emptyEval(),
    passed: [],
    failed: [],
    unknown: [],
    ...partial,
  };
}

describe("section labels and natural explanations", () => {
  it("uses counselor Hebrew, WhatsApp bold, and restrained heading emojis", () => {
    const catalog = [
      testScholarship({
        id: "eligible-ba",
        nameHe: "מלגת בדיקת התאמה",
        amounts: amount("עד 8,000 ₪", { min: 8000, max: 8000 }),
        types: ["volunteering"],
        eligibility: {
          op: "allOf",
          rules: [
            { type: "degreeLevelIn", values: ["ba"] },
            { type: "willingToVolunteer" },
          ],
        },
      }),
      testScholarship({
        id: "need-field",
        nameHe: "מלגת חסר תחום",
        eligibility: {
          op: "allOf",
          rules: [
            { type: "degreeLevelIn", values: ["ba"] },
            { type: "fieldOfStudyIn", values: ["engineering"] },
          ],
        },
      }),
      testScholarship({
        id: "near-avg",
        nameHe: "מלגת ממוצע גבוה",
        eligibility: {
          op: "allOf",
          rules: [
            { type: "degreeLevelIn", values: ["ba"] },
            { type: "minAverage", value: 95 },
          ],
        },
      }),
      testScholarship({
        id: "dean-check",
        nameHe: "מלגת דיקן לבדיקה",
        treatment: "checkAtInstitution",
        amounts: amount("משתנה", { uncertain: true }),
        eligibility: { type: "institutionIn", values: ["colman"] },
      }),
      testScholarship({
        id: "closed-year",
        nameHe: "מלגה שנסגרה",
        deadline: deadline("1.3.2026", { date: "2026-03-01" }),
        eligibility: { type: "degreeLevelIn", values: ["ba"] },
      }),
    ];

    const profile: StudentProfile = {
      institution: "colman",
      degreeLevel: "ba",
      average: 80,
      willingToVolunteer: true,
    };

    const report = buildWhatsAppReport(profile, {
      asOf: AS_OF,
      matchAllFn: (_catalog, p, opts) => matchAll(catalog, p, opts),
    });

    expect(report.text).toContain(HE.whatsapp.reportTitle);
    expect(report.text).toContain("✅");
    expect(report.text).toContain(`*${HE.whatsapp.eligibleNow} — 1*`);
    expect(report.text).toContain(HE.whatsapp.eligibleIntro);
    expect(report.text).toContain("*מלגת בדיקת התאמה*");
    expect(report.text).toContain(HE.whatsapp.volunteerRequired);
    expect(report.text).toContain("למה: סימנתם שנוח לכם להתנדב");

    expect(report.text).toContain("🟡");
    expect(report.text).toContain(`*${HE.whatsapp.needInfoOne} — 1*`);
    expect(report.text).toContain(HE.whatsapp.needInfoIntro);
    expect(report.text).toContain("חסר תחום לימוד");

    expect(report.text).toContain("🟠");
    expect(report.text).toContain(`*${HE.buckets.nearMiss} — 1*`);
    expect(report.text).toContain(HE.whatsapp.nearMissIntro);
    expect(report.text).toContain("*מלגת ממוצע גבוה*");
    expect(report.text).toMatch(/ממוצע 95 לפחות|הממוצע שמילאתם נמוך מהסף/);

    expect(report.text).toContain("🏫");
    expect(report.text).toContain(`*${HE.whatsapp.checkInstitution} — 1*`);
    expect(report.text).toContain(HE.whatsapp.checkInstitutionIntro);
    expect(report.text).toContain("צריך לבדוק במוסד או ברשות");

    expect(report.text).toContain("📅");
    expect(report.text).toContain(`*${HE.buckets.closedCycle} — 1*`);
    expect(report.text).toContain(HE.whatsapp.closedCycleIntro);
    expect(report.text).toContain(formatHebrewLongDate("2026-03-01"));

    expect(report.text).toContain("🔗");
    expect(report.text).toContain(`*${HE.whatsapp.fullReportHeading}*`);
    expect(report.text).toContain(HE.whatsapp.disclaimer);
    expect(report.text).toContain(HE.whatsapp.continueAfterReport);
    expect(report.text).toContain("תזכורת");
    expect(report.text).toContain("התחל מחדש");

    expect(report.text).not.toContain("**");
    expect(report.text).not.toMatch(/🎉|🥳|🌈|✨/);
    expect(report.text).not.toContain("זכאים לזכייה");
  });
});

describe("per-row amounts and deadlines, no summed total", () => {
  it("prints catalog numbers and dates per scholarship only", () => {
    const a = testScholarship({
      id: "amt-a",
      nameHe: "מלגת אלף",
      amounts: amount("6,000 ₪", { min: 6000, max: 6000 }),
      deadline: deadline("15.10.2026", { date: "2026-10-15" }),
      eligibility: { type: "degreeLevelIn", values: ["ba"] },
    });
    const b = testScholarship({
      id: "amt-b",
      nameHe: "מלגת בית",
      amounts: amount("עד 10,000 ₪", { min: 4000, max: 10000 }),
      deadline: deadline("חלון", { kind: "varies", uncertain: true }),
      eligibility: { type: "degreeLevelIn", values: ["ba"] },
    });
    const profile: StudentProfile = { degreeLevel: "ba" };
    const report = buildWhatsAppReport(profile, {
      asOf: AS_OF,
      matchAllFn: (_c, p, opts) => matchAll([a, b], p, opts),
    });

    expect(publishedAmountHe(a.amounts)).toBe("6,000 ₪");
    expect(publishedAmountHe(b.amounts)).toBe("עד 10,000 ₪");
    expect(report.text).toContain("6,000 ₪");
    expect(report.text).toContain("עד 10,000 ₪");
    expect(report.text).toContain(`מועד: ${formatHebrewLongDate("2026-10-15")}`);
    expect(report.text).not.toContain("מועד: חלון");
    expect(compactDeadlineHe(b.deadline)).toBeUndefined();
    expect(formatCatalogDeadlineHe(b.deadline)).toBeUndefined();

    const sum = 6000 + 10000;
    expect(report.text).not.toContain(formatIls(sum));
    expect(report.text).not.toContain("16,000");
    expect(report.text).not.toContain("סה״כ");
    expect(compactAmountHe(a.amounts)).toBe("6,000 ₪");
  });
});

describe("needInfo names the exact missing field", () => {
  it("uses the unknown criterion field label", () => {
    const sch = testScholarship({
      id: "need-field-exact",
      nameHe: "רקנאטי בדיקה",
      eligibility: {
        op: "allOf",
        rules: [
          { type: "degreeLevelIn", values: ["ba"] },
          { type: "fieldOfStudyIn", values: ["business"] },
        ],
      },
    });
    const profile: StudentProfile = { degreeLevel: "ba" };
    const match = matchOf(sch, profile);
    expect(match.bucket).toBe("needInfo");
    expect(needInfoMissingHe(match)).toBe(`חסר ${profileFieldLabel("fieldOfStudy")}`);
    expect(needInfoMissingHe(match)).toBe("חסר תחום לימוד");

    const unnamed = syntheticMatch({
      bucket: "needInfo",
      scholarship: sch,
      unknown: [criterion({ id: "u1", status: "unknown", labelHe: "תנאי כללי" })],
    });
    expect(needInfoMissingHe(unnamed)).toBe(HE.whatsapp.needInfoMissingFallback);

    const scoreBased = testScholarship({
      id: "score-need",
      nameHe: "מלגת ניקוד",
      treatment: "scoreBased",
      eligibility: { type: "degreeLevelIn", values: ["ba"] },
    });
    const mixed = buildWhatsAppReport(profile, {
      asOf: AS_OF,
      matchAllFn: (_c, p, opts) => matchAll([scoreBased, sch], p, opts),
    });
    expect(mixed.text).toContain("*רקנאטי בדיקה* — חסר תחום לימוד");
    const namedIdx = mixed.text.indexOf("רקנאטי בדיקה");
    const scoreIdx = mixed.text.indexOf("מלגת ניקוד");
    expect(namedIdx).toBeGreaterThan(-1);
    if (scoreIdx !== -1) expect(namedIdx).toBeLessThan(scoreIdx);
  });
});

describe("nearMiss shows only mutable reasons", () => {
  it("explains a changeable average/volunteer miss and drops immutable failures", () => {
    const volunteerSch = testScholarship({
      id: "needs-volunteer",
      nameHe: "מלגת התנדבות",
      types: ["volunteering"],
      eligibility: {
        op: "allOf",
        rules: [
          { type: "degreeLevelIn", values: ["ba"] },
          { type: "willingToVolunteer" },
        ],
      },
    });
    const profile: StudentProfile = { degreeLevel: "ba", willingToVolunteer: false };
    const real = matchOf(volunteerSch, profile);
    expect(real.bucket).toBe("nearMiss");
    expect(isMutableNearMiss(real)).toBe(true);
    expect(real.failed.every((c) => c.field && MUTABLE_NEAR_MISS_FIELDS.has(c.field))).toBe(true);

    const report = buildWhatsAppReport(profile, {
      asOf: AS_OF,
      matchAllFn: (_c, p, opts) => matchAll([volunteerSch], p, opts),
    });
    expect(report.text).toContain("*מלגת התנדבות*");
    expect(report.text).toContain("דורשת נכונות להתנדב");
    expect(report.text).not.toMatch(/כמעט.*מוסד|כמעט.*תואר|כמעט.*עיר/);

    const immutableRow = syntheticMatch({
      bucket: "nearMiss",
      scholarship: testScholarship({
        id: "wrong-school",
        nameHe: "מלגת מוסד אחר",
        eligibility: { type: "institutionIn", values: ["tau"] },
      }),
      eval: emptyEval({ immutableFailCount: 1, mutableFailCount: 0 }),
      failed: [
        criterion({
          id: "f1",
          status: "fail",
          field: "institution",
          labelHe: "לומד/ת ב: אוניברסיטת תל אביב",
        }),
      ],
    });
    expect(isMutableNearMiss(immutableRow)).toBe(false);

    const mixed = buildWhatsAppReport(profile, {
      asOf: AS_OF,
      matchAllFn: () => [real, immutableRow],
    });
    expect(mixed.text).toContain("*מלגת התנדבות*");
    expect(mixed.text).not.toContain("מלגת מוסד אחר");
    expect(mixed.text).toContain("*כמעט מתאים — 2*");
  });
});

describe("full report URL includes the profile payload", () => {
  it("uses sharedResultsUrl with #p= and falls back to the results base", () => {
    const profile: StudentProfile = { institution: "technion", degreeLevel: "ma" };
    const report = buildWhatsAppReport(profile, { asOf: AS_OF });
    const expected = sharedResultsUrl(profile);
    expect(expected).toContain("/results/#p=");
    expect(report.resultsUrl).toBe(expected);
    expect(report.text).toContain(expected);
    expect(report.text).toContain("#p=");
    expect(reportResultsUrl({})).toBe(WHATSAPP_RESULTS_URL);
    expect(reportResultsUrl({ institution: "tau" })).toContain("#p=");
  });
});

describe("empty sections are omitted", () => {
  it("does not print a heading when the bucket has no rows", () => {
    const onlyEligible = testScholarship({
      id: "only-ok",
      nameHe: "רק מתאימה",
      eligibility: { type: "degreeLevelIn", values: ["ba"] },
    });
    const report = buildWhatsAppReport({ degreeLevel: "ba" }, {
      asOf: AS_OF,
      matchAllFn: (_c, p, opts) => matchAll([onlyEligible], p, opts),
    });
    expect(report.text).toContain(HE.whatsapp.eligibleNow);
    expect(report.text).not.toContain(HE.whatsapp.needInfoOne);
    expect(report.text).not.toContain(HE.buckets.nearMiss);
    expect(report.text).not.toContain(HE.whatsapp.checkInstitution);
    expect(report.text).not.toContain(HE.buckets.closedCycle);
    expect(report.text).not.toContain("🟡");
    expect(report.text).not.toContain("🟠");
    expect(report.text).not.toContain("🏫");
    expect(report.text).not.toContain("📅");
  });
});

describe("max WhatsApp length on a worst-case catalog", () => {
  it("stays at or under 3500 characters without cutting a name or URL", () => {
    const long = (n: number, label: string) =>
      `${label}-${n}-` + "מלגהארוכהמאודלבדיקתחיתוךשמות".repeat(8);

    const catalog: Scholarship[] = [];
    for (let i = 0; i < 12; i++) {
      catalog.push(
        testScholarship({
          id: `elig-${i}`,
          nameHe: long(i, "מתאים"),
          amounts: amount("עד 12,000 ₪", { min: 8000, max: 12000 }),
          types: i % 2 === 0 ? ["volunteering"] : ["need"],
          eligibility: {
            op: "allOf",
            rules: [
              { type: "degreeLevelIn", values: ["ba"] },
              { type: "willingToVolunteer" },
            ],
          },
        }),
      );
    }
    for (let i = 0; i < 10; i++) {
      catalog.push(
        testScholarship({
          id: `need-${i}`,
          nameHe: long(i, "חסר"),
          eligibility: {
            op: "allOf",
            rules: [
              { type: "degreeLevelIn", values: ["ba"] },
              { type: "fieldOfStudyIn", values: ["law"] },
            ],
          },
        }),
      );
    }
    for (let i = 0; i < 10; i++) {
      catalog.push(
        testScholarship({
          id: `near-${i}`,
          nameHe: long(i, "כמעט"),
          eligibility: {
            op: "allOf",
            rules: [
              { type: "degreeLevelIn", values: ["ba"] },
              { type: "minAverage", value: 99 },
            ],
          },
        }),
      );
    }
    for (let i = 0; i < 8; i++) {
      catalog.push(
        testScholarship({
          id: `dean-${i}`,
          nameHe: long(i, "מוסד"),
          treatment: "checkAtInstitution",
          amounts: amount("משתנה", { uncertain: true }),
          eligibility: { type: "institutionIn", values: ["colman"] },
        }),
      );
    }
    for (let i = 0; i < 8; i++) {
      catalog.push(
        testScholarship({
          id: `closed-${i}`,
          nameHe: long(i, "נסגר"),
          deadline: deadline("1.1.2026", { date: "2026-01-01" }),
          eligibility: { type: "degreeLevelIn", values: ["ba"] },
        }),
      );
    }

    const profile: StudentProfile = {
      institution: "colman",
      degreeLevel: "ba",
      average: 70,
      willingToVolunteer: true,
      cityOfResidence: "ראשון לציון",
      yearOfStudy: 2,
      fieldOfStudy: "business",
      service: "idf",
    };
    const report = buildWhatsAppReport(profile, {
      asOf: AS_OF,
      matchAllFn: (_c, p, opts) => matchAll(catalog, p, opts),
    });

    expect(report.text.length).toBeLessThanOrEqual(WHATSAPP_REPORT_MAX_CHARS);
    expect(WHATSAPP_REPORT_MAX_CHARS).toBe(3500);
    expect(report.resultsUrl).toContain("#p=");
    expect(report.text).toContain(report.resultsUrl);

    const names = catalog.map((row) => row.nameHe);
    for (const name of names) {
      const idx = report.text.indexOf(name);
      if (idx === -1) continue;
      expect(report.text.slice(idx, idx + name.length)).toBe(name);
    }
    expect(report.text.includes(report.resultsUrl.slice(0, 40))).toBe(true);
    expect(report.text.split(report.resultsUrl).length).toBe(2);
  });
});

describe("real catalog fixture sample (not a student)", () => {
  it("builds a labeled counselor report from the Colman test fixture", () => {
    const report = buildWhatsAppReport(WHATSAPP_REPORT_FIXTURE_PROFILE, { asOf: AS_OF });
    const grouped = groupMatches(matchAll(SCHOLARSHIPS, WHATSAPP_REPORT_FIXTURE_PROFILE, { asOf: AS_OF }));

    if (grouped.eligible.length > 0) {
      expect(report.text).toContain(`*${HE.whatsapp.eligibleNow} — ${grouped.eligible.length}*`);
      const shown = grouped.eligible.slice(0, ELIGIBLE_EXAMPLE_LIMIT);
      for (const m of shown) {
        expect(report.text).toContain(m.scholarship.nameHe);
        const why = eligibleWhyHe(m, WHATSAPP_REPORT_FIXTURE_PROFILE);
        expect(report.text).toContain(`למה: ${why}`);
        const amountHe = publishedAmountHe(m.scholarship.amounts);
        if (amountHe) expect(report.text).toContain(amountHe);
      }
    } else {
      expect(report.text).not.toContain(HE.whatsapp.eligibleNow);
    }

    if (grouped.needInfo.length === 0) expect(report.text).not.toContain(HE.whatsapp.needInfoOne);
    if (grouped.nearMiss.length === 0) expect(report.text).not.toContain(`*${HE.buckets.nearMiss}`);
    if (grouped.checkAtInstitution.length === 0) {
      expect(report.text).not.toContain(HE.whatsapp.checkInstitution);
    }
    if (grouped.closedCycle.length === 0) expect(report.text).not.toContain(HE.buckets.closedCycle);

    expect(report.text).toContain(sharedResultsUrl(WHATSAPP_REPORT_FIXTURE_PROFILE));
    expect(report.text.length).toBeLessThanOrEqual(WHATSAPP_REPORT_MAX_CHARS);
    expect(report.counts.eligible + report.counts.needInfo + report.counts.nearMiss).toBeGreaterThan(0);
  });
});
