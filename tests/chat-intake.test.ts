import { describe, expect, it } from "vitest";
import {
  applyChatAction,
  applyChatChoice,
  applyCityAnswer,
  applyInstitutionAnswer,
  askedIdsAfterSkip,
  canOfferChatReport,
  CHAT_POPULAR_INSTITUTION_IDS,
  CHAT_QUESTIONS,
  chatCountWithinCatalog,
  chatFieldsCoverWizardKeys,
  chatQuestionById,
  chatReportCounts,
  filterInstitutions,
  mergeSessionAndStoredProfile,
  nextChatQuestion,
  popularCities,
  popularInstitutions,
  safeLoadChatProfile,
  shouldScrollChat,
  skipChatQuestion,
} from "@/lib/chat-intake";
import { matchAll, matchScholarship } from "@/lib/matcher";
import { uniqueMatchableByApplyUrl } from "@/lib/catalog";
import { CATALOG_STATS, SCHOLARSHIPS } from "@/data/scholarships";
import { collectInstitutionIn } from "@/data/scholarships/helpers";
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
  it("first nextChatQuestion on empty profile is degreeLevel choices, not search-institution", () => {
    const first = nextChatQuestion({}, []);
    expect(first?.id).toBe("degreeLevel");
    expect(first?.kind).toBe("choices");
    expect(first?.field).toBe("degreeLevel");
    expect(first?.choices?.length).toBeGreaterThan(0);
    expect(CHAT_QUESTIONS[0]?.id).toBe("degreeLevel");
    expect(CHAT_QUESTIONS[0]?.kind).toBe("choices");
    expect(CHAT_QUESTIONS.find((q) => q.id === "institution")?.kind).toBe("search-institution");
    const ids = CHAT_QUESTIONS.map((q) => q.id);
    expect(ids.indexOf("degreeLevel")).toBeLessThan(ids.indexOf("miluim"));
    expect(ids.indexOf("miluim")).toBeLessThan(ids.indexOf("cityOfResidence"));
    expect(ids.indexOf("cityOfResidence")).toBeLessThan(ids.indexOf("institution"));
  });

  it("walks degree → miluim → city → institution chips", () => {
    const degree = nextChatQuestion({}, []);
    const ba = degree?.choices?.find((c) => c.id === "ba");
    if (!degree || !ba) throw new Error("missing degree");
    const afterDegree = applyChatAction({ profile: {}, askedIds: [] }, {
      type: "choice",
      question: degree,
      choice: ba,
    });
    const miluim = nextChatQuestion(afterDegree.profile, afterDegree.askedIds);
    expect(miluim?.id).toBe("miluim");
    const no = miluim?.choices?.find((c) => c.id === "no");
    if (!miluim || !no) throw new Error("missing miluim");
    const afterMiluim = applyChatAction(afterDegree, { type: "choice", question: miluim, choice: no });
    const city = nextChatQuestion(afterMiluim.profile, afterMiluim.askedIds);
    expect(city?.id).toBe("cityOfResidence");
    expect(canOfferChatReport(afterMiluim.profile, afterMiluim.askedIds)).toBe(false);
    const afterCity = applyChatAction(afterMiluim, {
      type: "city",
      question: city!,
      city: "תל אביב-יפו",
    });
    const institution = nextChatQuestion(afterCity.profile, afterCity.askedIds);
    expect(institution?.id).toBe("institution");
    expect(institution?.kind).toBe("search-institution");
    expect(canOfferChatReport(afterCity.profile, afterCity.askedIds)).toBe(false);
    const afterInst = applyChatAction(afterCity, {
      type: "institution",
      question: institution!,
      institutionId: "tau",
    });
    expect(canOfferChatReport(afterInst.profile, afterInst.askedIds)).toBe(true);
  });

  it("popular institution chips render with an empty query", () => {
    const list = filterInstitutions("");
    expect(list).toHaveLength(8);
    expect(list.map((i) => i.id)).toEqual([...CHAT_POPULAR_INSTITUTION_IDS]);
    expect(list.some((i) => i.nameHe.includes("אוניברסיטת תל אביב"))).toBe(true);
    expect(popularInstitutions()).toEqual(list);
    expect(popularCities()).toHaveLength(8);
  });

  it("multi-select toggle does not scroll the viewport", () => {
    expect(shouldScrollChat("multi-toggle")).toBe(false);
    expect(shouldScrollChat("messages")).toBe(false);
    expect(shouldScrollChat("question-change")).toBe(false);
    expect(shouldScrollChat("report-open")).toBe(true);
  });

  it("keeps session answers when storage hydrate would overwrite them", () => {
    const session = { degreeLevel: "ba" as const, institution: "tau" };
    expect(mergeSessionAndStoredProfile(session, {})).toEqual(session);
    expect(mergeSessionAndStoredProfile({}, session)).toEqual(session);
  });

  it("safeLoadChatProfile still yields the first choice question when storage throws", () => {
    const profile = safeLoadChatProfile(() => {
      throw new Error("localStorage blocked");
    });
    expect(profile).toEqual({});
    const first = nextChatQuestion(profile, []);
    expect(first?.id).toBe("degreeLevel");
    expect(first?.kind).toBe("choices");
  });

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
    expect(first?.id).toBe("miluim");

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

  it("applyChatAction is the single mutation used by web and WhatsApp", () => {
    const degree = chatQuestionById("degreeLevel");
    const ba = degree?.choices?.find((c) => c.id === "ba");
    if (!degree || !ba) throw new Error("missing degree");
    const afterChoice = applyChatAction({ profile: {}, askedIds: [] }, {
      type: "choice",
      question: degree,
      choice: ba,
    });
    expect(afterChoice.profile.degreeLevel).toBe("ba");
    expect(afterChoice.askedIds).toContain("degreeLevel");

    const afterSkip = applyChatAction({ profile: {}, askedIds: [] }, { type: "skip", question: degree });
    expect(afterSkip.profile.degreeLevel).toBeNull();
    expect(afterSkip.askedIds).toContain("degreeLevel");

    const reset = applyChatAction(afterChoice, { type: "reset" });
    expect(reset.profile).toEqual({});
    expect(reset.askedIds).toEqual([]);
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
    expect(canOfferChatReport({ degreeLevel: "ba", reservistDaysLastYear: 0, cityOfResidence: "שדרות" }, [
      "degreeLevel",
      "miluim",
      "cityOfResidence",
    ])).toBe(false);
    expect(canOfferChatReport({ degreeLevel: "ba", reservistDaysLastYear: 0, cityOfResidence: "שדרות" }, [
      "degreeLevel",
      "miluim",
      "cityOfResidence",
      "institution",
    ])).toBe(true);

    const asOf = new Date("2026-09-01T12:00:00+03:00");
    const matches = matchAll(SCHOLARSHIPS, profile, { asOf });
    expect(matches.length).toBe(SCHOLARSHIPS.length);
    const actionable = matches.filter((m) =>
      ["eligible", "needInfo", "nearMiss", "checkAtInstitution"].includes(m.bucket),
    );
    expect(actionable.length).toBeGreaterThan(0);

    const counts = chatReportCounts(profile, asOf);
    expect(counts.catalogTotal).toBe(CATALOG_STATS.total);
    expect(chatCountWithinCatalog(counts)).toBe(true);
    expect(counts.ineligible).toBeLessThanOrEqual(CATALOG_STATS.total);
    expect(counts.eligible + counts.needInfo + counts.nearMiss + counts.guide).toBeGreaterThan(0);
  });

  it("results and chat counts stay within the unique catalog total", () => {
    const unique = uniqueMatchableByApplyUrl(SCHOLARSHIPS);
    expect(unique.length).toBe(CATALOG_STATS.total);
    const asOf = new Date("2026-09-01T12:00:00+03:00");
    const profile: StudentProfile = {
      institution: "tau",
      degreeLevel: "ba",
      cityOfResidence: "תל אביב-יפו",
      reservistDaysLastYear: 0,
    };
    const matches = matchAll(unique, profile, { asOf });
    expect(matches.length).toBe(CATALOG_STATS.total);
    const ineligible = matches.filter((m) => m.bucket === "ineligible").length;
    expect(ineligible).toBeLessThanOrEqual(CATALOG_STATS.total);
    const counts = chatReportCounts(profile, asOf);
    expect(counts.ineligible).toBeLessThanOrEqual(CATALOG_STATS.total);
    expect(chatCountWithinCatalog(counts)).toBe(true);
  });

  it("does not count a Weizmann-only fund as כמעט מתאים for Open University or a blank school", () => {
    const asOf = new Date("2026-09-03T12:00:00+03:00");
    const unique = uniqueMatchableByApplyUrl(SCHOLARSHIPS);
    const openu: StudentProfile = {
      institution: "openu",
      yearOfStudy: 3,
      degreeLevel: "ba",
      average: 80,
      fieldOfStudy: "computer_science",
    };
    const openuMatches = matchAll(unique, openu, { asOf });
    const openuNear = openuMatches.filter((m) => m.bucket === "nearMiss");
    expect(
      openuNear
        .filter(
          (m) =>
            (m.scholarship.institutionIds?.length ?? 0) > 0 &&
            !m.scholarship.institutionIds!.includes("openu") &&
            collectInstitutionIn(m.scholarship.eligibility).length === 0,
        )
        .map((m) => m.scholarship.id),
    ).toEqual([]);
    expect(openuMatches.find((m) => m.scholarship.id === "weizmann-young-scholars")?.bucket).toBe(
      "ineligible",
    );
    const openuCounts = chatReportCounts(openu, asOf);
    expect(openuCounts.nearMiss).toBe(openuNear.length);

    const noSchool: StudentProfile = {
      degreeLevel: "ba",
      yearOfStudy: 3,
      average: 80,
      fieldOfStudy: "computer_science",
    };
    const noSchoolMatches = matchAll(unique, noSchool, { asOf });
    expect(noSchoolMatches.find((m) => m.scholarship.id === "weizmann-young-scholars")?.bucket).toBe(
      "needInfo",
    );
    expect(noSchoolMatches.some((m) => m.bucket === "nearMiss" && m.scholarship.id === "weizmann-young-scholars")).toBe(
      false,
    );
    const noSchoolCounts = chatReportCounts(noSchool, asOf);
    expect(noSchoolCounts.nearMiss).toBe(
      noSchoolMatches.filter((m) => m.bucket === "nearMiss").length,
    );
  });
});
