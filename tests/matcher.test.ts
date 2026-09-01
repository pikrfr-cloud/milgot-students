import { describe, expect, it } from "vitest";
import { matchAll, matchScholarship } from "@/lib/matcher";
import { SCHOLARSHIPS } from "@/data/scholarships";
import { TIPS, TIP_IDS } from "@/data/tips";
import { citiesMatch, isPeripheryCity, neighborhoodMatches } from "@/lib/cities";
import { deadlineSortValue, deadlineStatus, isDeadlineClosed } from "@/lib/format";
import { allOf, anyOf, deadline, not } from "@/data/scholarships/helpers";
import { bestSourceGrade, gradeSourceUrl, hasOfficialSource } from "@/lib/sources";
import { deriveIncomeBand } from "@/lib/income";
import { INSTITUTIONS } from "@/lib/institutions";
import type { StudentProfile } from "@/lib/types";

const byId = (id: string) => {
  const s = SCHOLARSHIPS.find((x) => x.id === id);
  if (!s) throw new Error(`missing ${id}`);
  return s;
};

const tauPeripheryFirstYear: StudentProfile = {
  institution: "tau",
  degreeLevel: "ba",
  yearOfStudy: 1,
  fieldOfStudy: "social_sciences",
  cityOfResidence: "שדרות",
  hometown: "שדרות",
  peripheryResidence: true,
  peripheryHometown: true,
  service: "idf",
  yearsSinceDischarge: 1,
  combatRole: false,
  willingToVolunteer: true,
  incomeBand: "low",
  studyLoad: "full",
  age: 23,
  gender: "female",
  sectors: ["jewish_general"],
  isOleh: false,
  hasDisability: false,
  firstGeneration: true,
  completedMechina: false,
};

const technionMaStem: StudentProfile = {
  institution: "technion",
  degreeLevel: "ma",
  yearOfStudy: 1,
  fieldOfStudy: "engineering",
  average: 88,
  cityOfResidence: "חיפה",
  peripheryResidence: false,
  service: "idf",
  yearsSinceDischarge: 4,
  willingToVolunteer: true,
  incomeBand: "middle",
  studyLoad: "full",
  age: 27,
  sectors: ["jewish_general"],
  isOleh: false,
};

const arabHaifaBa: StudentProfile = {
  institution: "haifa",
  degreeLevel: "ba",
  yearOfStudy: 1,
  fieldOfStudy: "computer_science",
  cityOfResidence: "נצרת",
  hometown: "נצרת",
  peripheryResidence: true,
  sectors: ["arab"],
  service: "none",
  willingToVolunteer: true,
  incomeBand: "low",
  studyLoad: "full",
  age: 20,
  gender: "male",
  isOleh: false,
};

const harediCollege: StudentProfile = {
  institution: "ono",
  degreeLevel: "ba",
  yearOfStudy: 2,
  fieldOfStudy: "business",
  cityOfResidence: "בני ברק",
  peripheryResidence: false,
  sectors: ["haredi"],
  service: "exempt",
  willingToVolunteer: true,
  incomeBand: "low",
  studyLoad: "full",
  age: 24,
  gender: "male",
  isOleh: false,
};

const olehStudent: StudentProfile = {
  institution: "huji",
  degreeLevel: "ba",
  yearOfStudy: 1,
  fieldOfStudy: "humanities",
  cityOfResidence: "ירושלים",
  isOleh: true,
  yearsInIsrael: 3,
  age: 22,
  service: "none",
  willingToVolunteer: true,
  incomeBand: "lower_middle",
  studyLoad: "full",
  sectors: ["jewish_general"],
};

/** Fully filled ordinary profile from the P0 review. */
export const ordinaryColmanProfile: StudentProfile = {
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
  familyFlags: [],
  outstanding: [],
};

function bucketOf(profile: StudentProfile, id: string) {
  return matchScholarship(byId(id), profile).bucket;
}

describe("catalog integrity", () => {
  it("has at least 80 scholarships with unique ids", () => {
    const ids = SCHOLARSHIPS.map((s) => s.id);
    expect(ids.length).toBeGreaterThanOrEqual(80);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every record has Hebrew name, funder, rules, and sources", () => {
    for (const s of SCHOLARSHIPS) {
      expect(s.nameHe.length).toBeGreaterThan(3);
      expect(s.funderHe.length).toBeGreaterThan(3);
      expect(s.sourceUrls.length).toBeGreaterThan(0);
      expect(s.eligibility).toBeTruthy();
      expect(s.lastVerified.startsWith("2026")).toBe(true);
      expect(s.kind ?? "scholarship").toBe("scholarship");
    }
  });

  it("every remaining scholarship has at least one official source", () => {
    for (const s of SCHOLARSHIPS) {
      expect(hasOfficialSource(s.sourceUrls), s.id).toBe(true);
      expect(s.officialSource, s.id).toBe(true);
    }
  });

  it("does not treat dean skeletons as eligible-now", () => {
    for (const s of SCHOLARSHIPS.filter((x) => x.treatment === "checkAtInstitution")) {
      const match = matchScholarship(s, { institution: s.institutionIds?.[0] });
      expect(match.bucket, s.id).not.toBe("eligible");
    }
  });

  it("does not count the 7 tip records as scholarships", () => {
    const expected = [
      "single-parent-need-note",
      "orphan-funds-generic",
      "large-family-need",
      "sports-excellence-generic",
      "arts-excellence-generic",
      "aluma-haredi-support",
      "mifal-hapayis-volunteering",
    ];
    for (const id of expected) {
      expect(SCHOLARSHIPS.find((s) => s.id === id)).toBeUndefined();
    }
    expect([...TIP_IDS].sort()).toEqual([...expected].sort());
    expect(TIPS.every((t) => t.kind === "tip")).toBe(true);
  });
});

describe("unknown fields never silently fail", () => {
  it("puts Perach in needInfo when volunteering willingness is skipped", () => {
    const match = matchScholarship(byId("perach"), {
      degreeLevel: "ba",
    });
    expect(match.bucket).toBe("needInfo");
    expect(match.unknown.length).toBeGreaterThan(0);
    expect(match.failed.length).toBe(0);
  });

  it("does not exclude Irtikaa when sector is unknown", () => {
    const match = matchScholarship(byId("irtikaa"), {
      degreeLevel: "ba",
      yearOfStudy: 1,
      fieldOfStudy: "computer_science",
      studyLoad: "full",
      willingToVolunteer: true,
    });
    expect(match.bucket).toBe("needInfo");
    expect(match.failed.length).toBe(0);
  });
});

describe("first-year BA at TAU from the periphery", () => {
  const matches = matchAll(SCHOLARSHIPS, tauPeripheryFirstYear);
  const eligible = new Set(matches.filter((m) => m.bucket === "eligible").map((m) => m.scholarship.id));

  it("does not auto-qualify yeud 45 from a city/periphery flag; yeud 44 is not TAU", () => {
    expect(eligible.has("yeud-45")).toBe(false);
    expect(bucketOf(tauPeripheryFirstYear, "yeud-45")).toBe("needInfo");
    expect(bucketOf(tauPeripheryFirstYear, "yeud-44")).not.toBe("eligible");
  });

  it("is eligible for yeud 45 when 5-of-6 national-priority address is attested", () => {
    expect(
      bucketOf({ ...tauPeripheryFirstYear, nationalPriorityResidence: true }, "yeud-45"),
    ).toBe("eligible");
  });

  it("is eligible for Perach and TAU aid; mil-go is score-based not binary eligible", () => {
    expect(eligible.has("perach")).toBe(true);
    expect(eligible.has("mil-go")).toBe(false);
    expect(bucketOf(tauPeripheryFirstYear, "mil-go")).toBe("needInfo");
    expect(eligible.has("tau-financial-aid")).toBe(true);
  });

  it("is not eligible for Irtikaa or Tena (wrong community — immutable)", () => {
    expect(bucketOf(tauPeripheryFirstYear, "irtikaa")).toBe("ineligible");
    expect(bucketOf(tauPeripheryFirstYear, "tena")).toBe("ineligible");
    expect(matchScholarship(byId("tena"), tauPeripheryFirstYear).failed.some((c) => c.field === "sectors")).toBe(
      true,
    );
  });

  it("does not treat yeud 46 as eligible without a mechina", () => {
    expect(bucketOf(tauPeripheryFirstYear, "yeud-46")).toBe("nearMiss");
  });

  it("is not eligible for Schulich (STEM field is identity, not a near-miss)", () => {
    expect(bucketOf(tauPeripheryFirstYear, "schulich-leaders")).toBe("ineligible");
    const match = matchScholarship(byId("schulich-leaders"), tauPeripheryFirstYear);
    expect(match.failed.some((c) => c.labelHe.includes("תחום"))).toBe(true);
    expect(match.eval.immutableFailCount).toBeGreaterThan(0);
  });
});

describe("MA STEM at Technion", () => {
  it("matches Technion graduate-relevant and national volunteering funds", () => {
    expect(bucketOf(technionMaStem, "technion-financial-aid")).not.toBe("eligible");
    expect(bucketOf(technionMaStem, "perach")).toBe("eligible");
    expect(bucketOf(technionMaStem, "technion-schulich-entrepreneurship")).toBe("ineligible");
  });

  it("does not match BA-only national aid as eligible", () => {
    expect(bucketOf(technionMaStem, "mil-go")).not.toBe("eligible");
    expect(bucketOf(technionMaStem, "yeud-45")).not.toBe("eligible");
    expect(bucketOf(technionMaStem, "irtikaa")).not.toBe("eligible");
  });

  it("does not match Weizmann stipends as eligible", () => {
    expect(bucketOf(technionMaStem, "weizmann-graduate")).not.toBe("eligible");
  });
});

describe("Arab first-year student at Haifa in CS", () => {
  it("is eligible for Irtikaa, Perach, Haifa aid, and not Tena", () => {
    expect(bucketOf(arabHaifaBa, "irtikaa")).toBe("eligible");
    expect(bucketOf(arabHaifaBa, "perach")).toBe("eligible");
    expect(bucketOf(arabHaifaBa, "haifa-financial-aid")).toBe("eligible");
    expect(bucketOf(arabHaifaBa, "tena")).not.toBe("eligible");
    expect(bucketOf(arabHaifaBa, "marom")).not.toBe("eligible");
  });

  it("is not eligible for yeud 45 because of no military/national service (immutable)", () => {
    const match = matchScholarship(byId("yeud-45"), arabHaifaBa);
    expect(match.bucket).toBe("ineligible");
    expect(match.failed.some((c) => c.field === "service")).toBe(true);
  });
});

describe("Haredi college student", () => {
  it("is eligible for Tena and not Irtikaa; dean skeleton is check-at-institution", () => {
    expect(bucketOf(harediCollege, "tena")).toBe("eligible");
    expect(bucketOf(harediCollege, "irtikaa")).not.toBe("eligible");
    expect(bucketOf(harediCollege, "ono-dean")).toBe("needInfo");
    expect(TIPS.some((t) => t.id === "aluma-haredi-support")).toBe(true);
  });
});

describe("oleh at Hebrew University", () => {
  it("matches HIAS and HUJI aid; Student Authority is check-at-authority not a fake age cap", () => {
    expect(bucketOf(olehStudent, "olim-student-authority")).toBe("needInfo");
    expect(bucketOf(olehStudent, "hias-olim")).toBe("eligible");
    expect(bucketOf(olehStudent, "marom")).not.toBe("eligible");
    expect(bucketOf(olehStudent, "huji-financial-aid")).toBe("eligible");
  });
});

describe("near-miss counting", () => {
  it("counts a single failed conjunct as near-miss", () => {
    const almost = matchScholarship(byId("yeud-45"), {
      ...tauPeripheryFirstYear,
      nationalPriorityResidence: true,
      yearOfStudy: 2,
    });
    expect(almost.bucket).toBe("nearMiss");
    expect(almost.eval.failCount).toBe(1);
    expect(almost.failed.length).toBe(almost.eval.failCount);
  });

  it("keeps anyOf failCount in sync with failed.length", () => {
    const match = matchScholarship(byId("gruss"), {
      ...ordinaryColmanProfile,
      willingToVolunteer: true,
      yearsSinceDischarge: 2,
      studyLoad: "full",
    });
    expect(match.eval.failCount).toBe(match.failed.length);
  });
});

describe("ordinary Colman BA year-2 profile near-miss cap", () => {
  it("has a tight volunteering-related near-miss list after field/reservist immutability", () => {
    const matches = matchAll(SCHOLARSHIPS, ordinaryColmanProfile);
    const near = matches.filter((m) => m.bucket === "nearMiss");
    const ids = near.map((m) => m.scholarship.id).sort();
    expect(ids).toEqual(["eilim", "negev-galil-students-future", "nuis-community", "perach", "sahlav"]);
    for (const m of near) {
      expect(m.failed.some((c) => c.field === "fieldOfStudy")).toBe(false);
      expect(m.failed.some((c) => c.field === "reservistDaysLastYear")).toBe(false);
    }
  });

  it("does not treat colman dean skeleton or rishon city-hall as eligible now", () => {
    expect(bucketOf(ordinaryColmanProfile, "colman-aid")).toBe("needInfo");
    expect(bucketOf(ordinaryColmanProfile, "rishon-muni")).toBe("needInfo");
  });

  it("sends wrong-institution and wrong-community failures to ineligible", () => {
    expect(bucketOf(ordinaryColmanProfile, "tau-financial-aid")).toBe("ineligible");
    expect(bucketOf(ordinaryColmanProfile, "irtikaa")).toBe("ineligible");
    expect(bucketOf(ordinaryColmanProfile, "tena")).toBe("ineligible");
  });
});

describe("city aliases", () => {
  it("treats תל אביב as תל אביב-יפו and קרית as קריית", () => {
    expect(citiesMatch("תל אביב", "תל אביב-יפו")).toBe(true);
    expect(citiesMatch("קרית גת", "קריית גת")).toBe(true);
    expect(citiesMatch("קרית שמונה", "קריית שמונה")).toBe(true);
    expect(citiesMatch("באר-שבע", "באר שבע")).toBe(true);
    expect(citiesMatch("ב\"ש", "באר שבע")).toBe(true);
    expect(citiesMatch("ראשל\"צ", "ראשון לציון")).toBe(true);
    expect(citiesMatch("פ\"ת", "פתח תקווה")).toBe(true);
  });

  it("matches Tel Aviv municipal aid city alias but requires a south-neighborhood", () => {
    const match = matchScholarship(byId("telaviv-south-neighborhoods"), {
      cityOfResidence: "תל אביב",
      hometown: "תל אביב",
      studyLoad: "full",
    });
    expect(match.failed.some((c) => c.field === "cityOfResidence")).toBe(false);
    expect(match.passed.some((c) => c.field === "cityOfResidence" || c.field === "hometown")).toBe(true);
    expect(match.bucket).toBe("needInfo");
    expect(match.unknown.some((c) => c.field === "neighborhood")).toBe(true);
  });

  it("is eligible for south TA aid when a listed neighborhood is filled", () => {
    expect(
      bucketOf(
        {
          cityOfResidence: "תל אביב",
          hometown: "תל אביב",
          neighborhood: "שפירא",
          studyLoad: "full",
        },
        "telaviv-south-neighborhoods",
      ),
    ).toBe("eligible");
    expect(neighborhoodMatches("קרית שלום", ["קריית שלום"])).toBe(true);
  });
});

describe("past deadlines stay visible as closed-cycle", () => {
  it("does not bucket a closed-deadline match as eligible or hidden ineligible", () => {
    const closed = {
      ...byId("perach"),
      deadline: deadline("נסגר", { date: "2020-01-01", kind: "fixed" as const }),
    };
    const match = matchScholarship(closed, {
      degreeLevel: "ba",
      willingToVolunteer: true,
    });
    expect(match.bucket).not.toBe("eligible");
    expect(match.bucket).toBe("closedCycle");
    expect(isDeadlineClosed(closed.deadline, new Date("2026-08-31"))).toBe(true);
  });

  it("sorts closed dates after upcoming ones", () => {
    const past = deadline("עבר", { date: "2020-01-01", kind: "fixed" as const });
    const future = deadline("עתיד", { date: "2026-12-17", kind: "fixed" as const });
    const asOf = new Date("2026-08-31T12:00:00Z");
    expect(deadlineStatus(past, asOf).kind).toBe("closed");
    expect(deadlineStatus(future, asOf).kind).toBe("open");
    expect(deadlineSortValue(future, asOf)).toBeLessThan(deadlineSortValue(past, asOf));
  });
});

describe("national-priority vs social periphery", () => {
  it("does not treat Jerusalem as yeud-45 eligible from the city list", () => {
    const jerusalem = {
      ...tauPeripheryFirstYear,
      cityOfResidence: "ירושלים",
      hometown: "ירושלים",
      peripheryResidence: true,
    };
    expect(bucketOf(jerusalem, "yeud-45")).toBe("needInfo");
    expect(bucketOf({ ...jerusalem, nationalPriorityResidence: true }, "yeud-45")).toBe("eligible");
  });

  it("does not list Jerusalem, Ashdod, Hadera, Lod, Ramla, or Yavne as social-periphery cities", () => {
    for (const city of ["ירושלים", "אשדוד", "חדרה", "לוד", "רמלה", "יבנה"]) {
      expect(isPeripheryCity(city)).toBe(false);
    }
  });
});

describe("nested not / allOf", () => {
  it("inverts an allOf of identity predicates as a unit (no inverted הפער on eligible)", () => {
    const sch = {
      ...byId("perach"),
      id: "synthetic-not-allof",
      treatment: undefined,
      eligibility: not(
        allOf({ type: "sectorIn", values: ["haredi"] as const }, { type: "genderIn", values: ["male"] as const }),
      ),
    };
    const eligible = matchScholarship(sch, ordinaryColmanProfile);
    expect(eligible.bucket).toBe("eligible");
    expect(eligible.failed.length).toBe(0);
    expect(eligible.eval.failCount).toBe(0);
    expect(matchScholarship(sch, harediCollege).bucket).not.toBe("eligible");
  });

  it("treats a failed not(anyOf) of identity predicates as immutable, not always mutable", () => {
    const sch = {
      ...byId("perach"),
      id: "synthetic-not-anyof",
      treatment: undefined,
      eligibility: not(
        anyOf({ type: "sectorIn", values: ["haredi"] as const }, { type: "genderIn", values: ["male"] as const }),
      ),
    };
    const match = matchScholarship(sch, ordinaryColmanProfile);
    expect(match.bucket).toBe("ineligible");
    expect(match.eval.immutableFailCount).toBeGreaterThan(0);
  });
});

describe("household income derivation", () => {
  it("maps a large household with a mid band to a lower per-capita band", () => {
    expect(deriveIncomeBand(6, "band_15_25k")).toBe("low");
    expect(deriveIncomeBand(1, "over_40k")).toBe("high");
    expect(deriveIncomeBand(null, "band_8_15k")).toBeNull();
  });
});

describe("empty institutions have check-at-institution records", () => {
  it("covers teaching colleges and other campuses that had zero records", () => {
    const ids = [
      "kibbutzim",
      "levinsky",
      "david_yellin",
      "gordon",
      "kaye",
      "oranim",
      "herzog",
      "ohalo",
      "jca",
      "wizo_haifa",
      "ramat_gan_college",
      "netanya",
      "azrieli",
    ];
    for (const inst of ids) {
      const records = SCHOLARSHIPS.filter((s) => s.institutionIds?.includes(inst));
      expect(records.length, inst).toBeGreaterThan(0);
      expect(records.some((s) => s.treatment === "checkAtInstitution"), inst).toBe(true);
    }
    expect(INSTITUTIONS.some((i) => i.id === "kibbutzim")).toBe(true);
  });
});

describe("closed-cycle matching students see Schulich and ISEF", () => {
  const asOf = new Date("2026-09-01T12:00:00Z");

  it("puts a matching STEM first-year in closedCycle for Schulich, not hidden ineligible", () => {
    const profile: StudentProfile = {
      institution: "tau",
      degreeLevel: "ba",
      yearOfStudy: 1,
      fieldOfStudy: "engineering",
      bagrutAverage: 95,
      psychometric: 720,
      studyLoad: "full",
    };
    const match = matchScholarship(byId("schulich-leaders"), profile, { asOf });
    expect(isDeadlineClosed(byId("schulich-leaders").deadline, asOf)).toBe(true);
    expect(match.bucket).toBe("closedCycle");
    expect(match.bucket).not.toBe("ineligible");
    expect(match.bucket).not.toBe("eligible");
  });

  it("puts a matching first-generation periphery student in closedCycle for ISEF", () => {
    const profile: StudentProfile = {
      degreeLevel: "ba",
      firstGeneration: true,
      studyLoad: "full",
      peripheryResidence: true,
      willingToVolunteer: true,
    };
    const match = matchScholarship(byId("isef"), profile, { asOf });
    expect(isDeadlineClosed(byId("isef").deadline, asOf)).toBe(true);
    expect(match.bucket).toBe("closedCycle");
    expect(match.bucket).not.toBe("ineligible");
  });
});

describe("disability-only profile does not auto-qualify rehab trio", () => {
  const disabilityOnly: StudentProfile = { hasDisability: true };

  it("sends the rehab trio to needInfo / check-at-authority, not eligible now", () => {
    for (const id of ["bituach-leumi-rehab", "hostilities-victims-studies", "work-injury-studies"]) {
      const match = matchScholarship(byId(id), disabilityOnly);
      expect(match.bucket, id).not.toBe("eligible");
      expect(match.bucket, id).toBe("needInfo");
      expect(byId(id).treatment).toBe("checkAtAuthority");
    }
  });
});

describe("empty checkbox groups vs skip", () => {
  it("treats sectors [] as known-none (fail) and null as unknown", () => {
    const empty = matchScholarship(byId("irtikaa"), {
      degreeLevel: "ba",
      yearOfStudy: 1,
      fieldOfStudy: "computer_science",
      studyLoad: "full",
      willingToVolunteer: true,
      sectors: [],
    });
    const skipped = matchScholarship(byId("irtikaa"), {
      degreeLevel: "ba",
      yearOfStudy: 1,
      fieldOfStudy: "computer_science",
      studyLoad: "full",
      willingToVolunteer: true,
      sectors: null,
    });
    expect(empty.bucket).toBe("ineligible");
    expect(skipped.bucket).toBe("needInfo");
  });
});

describe("marom years-in-Israel inference for native-born", () => {
  it("does not stick native-born Ethiopian students on a hidden years field", () => {
    const native: StudentProfile = {
      degreeLevel: "ba",
      sectors: ["ethiopian"],
      isOleh: false,
      studyLoad: "full",
    };
    expect(bucketOf(native, "marom")).toBe("eligible");
  });
});

describe("yeud mutex", () => {
  it("shows choose-one when yeud 44/45/46 are otherwise eligible together", () => {
    const profile: StudentProfile = {
      institution: "bgu",
      degreeLevel: "ba",
      yearOfStudy: 1,
      service: "idf",
      yearsSinceDischarge: 2,
      nationalPriorityResidence: true,
      completedMechina: true,
    };
    const matches = matchAll(
      [byId("yeud-44"), byId("yeud-45"), byId("yeud-46")],
      profile,
      { asOf: new Date("2026-09-01T12:00:00Z") },
    );
    const taking = matches.filter((m) => m.bucket === "eligible" || m.bucket === "closedCycle");
    expect(taking.length).toBeGreaterThanOrEqual(2);
    expect(taking.every((m) => m.mutexNoteHe && m.mutexNoteHe.includes("בחרו אחת"))).toBe(true);
  });
});

describe("source grades and catalog URLs", () => {
  it("does not treat kolzchut as an official dedicated source", () => {
    expect(
      gradeSourceUrl(
        "https://www.kolzchut.org.il/he/%D7%9E%D7%99%D7%9E%D7%95%D7%9F_%D7%A9%D7%9B%D7%A8_%D7%9C%D7%99%D7%9E%D7%95%D7%93",
      ),
    ).toBe("secondary");
    expect(hasOfficialSource(["https://www.kolzchut.org.il/he/x"])).toBe(false);
  });

  it("gives a dedicated tag only to scholarship pages, not every .ac.il homepage", () => {
    const grades = SCHOLARSHIPS.map((s) => s.sourceGrade ?? bestSourceGrade(s.sourceUrls));
    expect(grades.some((g) => g === "dedicated")).toBe(true);
    expect(grades.some((g) => g !== "dedicated")).toBe(true);
    expect(grades.filter((g) => g === "dedicated").length).toBeLessThan(SCHOLARSHIPS.length);
  });

  it("points yeud-44 at the yeud-44 page, not yeud-45", () => {
    const urls = byId("yeud-44").sourceUrls.join(" ");
    expect(urls).toContain("Perypheria44");
    expect(urls).not.toContain("Perypheria45");
  });

  it("does not cite gruss.org.il/blank as the official source", () => {
    expect(byId("gruss").sourceUrls.some((u) => u.includes("gruss.org.il/blank"))).toBe(false);
    expect(byId("gruss").sourceUrls.some((u) => u.includes("Gruss.aspx"))).toBe(true);
  });

  it("keeps schulich-leaders institutionIds in sync with eligibility", () => {
    const s = byId("schulich-leaders");
    expect(s.institutionIds).toEqual(["tau", "huji", "bgu", "biu", "telhai"]);
    expect(s.institutionIds).not.toContain("technion");
  });

  it("validates excludes[] ids exist", () => {
    const ids = new Set(SCHOLARSHIPS.map((s) => s.id));
    for (const s of SCHOLARSHIPS) {
      for (const ex of s.excludes ?? []) {
        expect(ids.has(ex), `${s.id} excludes missing ${ex}`).toBe(true);
      }
    }
  });
});
