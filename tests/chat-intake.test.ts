import { describe, expect, it } from "vitest";
import {
  applyChatChoice,
  applyCityAnswer,
  applyInstitutionAnswer,
  askedIdsAfterSkip,
  canOfferChatReport,
  chatFieldsCoverWizardKeys,
  chatQuestionById,
  chatReportCounts,
  nextChatQuestion,
  skipChatQuestion,
} from "@/lib/chat-intake";
import { matchAll, matchScholarship } from "@/lib/matcher";
import { SCHOLARSHIPS } from "@/data/scholarships";
import {
  CHAT_CORE_FIELDS,
  CHAT_EXTRA_FIELDS,
  MIN_CHAT_ANSWERS_FOR_REPORT,
  WIZARD_FIELDS,
  filledWizardFieldCount,
  isProfileFieldFilled,
} from "@/lib/profile-fields";
import { PROFILE_STORAGE_KEY } from "@/lib/profile-storage";
import type { StudentProfile } from "@/lib/types";

const byId = (id: string) => {
  const s = SCHOLARSHIPS.find((x) => x.id === id);
  if (!s) throw new Error(`missing ${id}`);
  return s;
};

describe("chat intake field glue", () => {
  it("drives questions from existing profile fields, not a parallel schema", () => {
    expect(chatFieldsCoverWizardKeys()).toBe(true);
    for (const field of [...CHAT_CORE_FIELDS, ...CHAT_EXTRA_FIELDS]) {
      expect(WIZARD_FIELDS).toContain(field);
    }
    expect(PROFILE_STORAGE_KEY).toBe("milgot-profile-v1");
    expect(MIN_CHAT_ANSWERS_FOR_REPORT).toBe(3);
  });

  it("skips already-filled fields and advances past a skip without looping", () => {
    const filled: StudentProfile = { institution: "tau", degreeLevel: "ba" };
    const first = nextChatQuestion(filled, []);
    expect(first?.field).toBe("cityOfResidence");

    const miluim = chatQuestionById("miluim");
    if (!miluim) throw new Error("missing miluim");
    const skipped = skipChatQuestion({}, miluim);
    expect(skipped.reservistDaysLastYear).toBeNull();
    const asked = askedIdsAfterSkip([], miluim);
    expect(asked).toContain("miluim");
    expect(asked).toContain("miluimDays");
    expect(nextChatQuestion(skipped, asked)?.id).not.toBe("miluim");
    expect(nextChatQuestion(skipped, asked)?.id).not.toBe("miluimDays");
  });
});

describe("chat skip never marks a scholarship ineligible", () => {
  it("leaves miluim-gated funds in needInfo when days are skipped", () => {
    const miluim = chatQuestionById("miluim");
    if (!miluim) throw new Error("missing miluim");
    const profile = skipChatQuestion(
      { institution: "tau", degreeLevel: "ba", cityOfResidence: "שדרות" },
      miluim,
    );
    expect(isProfileFieldFilled(profile, "reservistDaysLastYear")).toBe(false);

    const reserves = matchScholarship(byId("perach-reserves"), {
      ...profile,
      willingToVolunteer: true,
    });
    expect(reserves.bucket).not.toBe("ineligible");
    expect(reserves.bucket).toBe("needInfo");
    expect(reserves.failed.length).toBe(0);
    expect(reserves.unknown.some((c) => c.field === "reservistDaysLastYear")).toBe(true);

    const iron = matchScholarship(byId("iron-swords-reservist"), profile);
    expect(iron.bucket).not.toBe("ineligible");
    expect(iron.failed.length).toBe(0);
  });

  it("does not fail need-based funds when income questions are skipped", () => {
    const sizeQ = chatQuestionById("householdSize");
    const bandQ = chatQuestionById("householdIncomeBand");
    if (!sizeQ || !bandQ) throw new Error("missing income questions");
    let profile: StudentProfile = { degreeLevel: "prep" };
    profile = skipChatQuestion(profile, sizeQ);
    profile = skipChatQuestion(profile, bandQ);
    const match = matchScholarship(byId("mechina-worthy-of-aid"), profile);
    expect(match.bucket).not.toBe("ineligible");
    expect(match.failed.length).toBe(0);
    expect(match.bucket).toBe("needInfo");
  });
});

describe("chat partial profile still produces a report", () => {
  it("offers a report after three answered fields and matchAll covers the catalog", () => {
    let profile: StudentProfile = {};
    profile = applyInstitutionAnswer(profile, "tau");
    const degree = chatQuestionById("degreeLevel");
    const ba = degree?.choices?.find((c) => c.id === "ba");
    if (!degree || !ba) throw new Error("missing degree");
    profile = applyChatChoice(profile, ba);
    profile = applyCityAnswer(profile, "שדרות");

    expect(filledWizardFieldCount(profile)).toBe(3);
    expect(canOfferChatReport(profile)).toBe(true);

    const asOf = new Date("2026-09-01T12:00:00+03:00");
    const matches = matchAll(SCHOLARSHIPS, profile, { asOf });
    expect(matches.length).toBe(SCHOLARSHIPS.length);
    const actionable = matches.filter((m) =>
      ["eligible", "needInfo", "nearMiss", "checkAtInstitution"].includes(m.bucket),
    );
    expect(actionable.length).toBeGreaterThan(0);

    const counts = chatReportCounts(profile, asOf);
    expect(counts.eligible + counts.needInfo + counts.nearMiss + counts.guide + counts.ineligible + counts.closedCycle).toBe(
      SCHOLARSHIPS.length,
    );
    expect(counts.eligible + counts.needInfo + counts.nearMiss + counts.guide).toBeGreaterThan(0);
  });
});
