import { describe, expect, it } from "vitest";
import { matchAll, matchScholarship } from "@/lib/matcher";
import { SCHOLARSHIPS } from "@/data/scholarships";
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
    }
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

  it("is eligible for yeud 45 (lives in periphery) and not yeud 44 (studies at TAU)", () => {
    expect(eligible.has("yeud-45")).toBe(true);
    expect(bucketOf(tauPeripheryFirstYear, "yeud-44")).not.toBe("eligible");
  });

  it("is eligible for Perach, Mil-GO, TAU aid, and ISEF path when first-gen + periphery", () => {
    expect(eligible.has("perach")).toBe(true);
    expect(eligible.has("mil-go")).toBe(true);
    expect(eligible.has("tau-financial-aid")).toBe(true);
    expect(eligible.has("isef")).toBe(true);
  });

  it("is not eligible for Irtikaa or Tena (wrong community)", () => {
    expect(bucketOf(tauPeripheryFirstYear, "irtikaa")).not.toBe("eligible");
    expect(bucketOf(tauPeripheryFirstYear, "tena")).not.toBe("eligible");
    expect(matchScholarship(byId("tena"), tauPeripheryFirstYear).failed.some((c) => c.field === "sectors")).toBe(
      true,
    );
  });

  it("does not treat yeud 46 as eligible without a mechina", () => {
    expect(bucketOf(tauPeripheryFirstYear, "yeud-46")).toBe("nearMiss");
  });

  it("is a near-miss for Schulich (STEM required)", () => {
    expect(bucketOf(tauPeripheryFirstYear, "schulich-leaders")).toBe("nearMiss");
    const match = matchScholarship(byId("schulich-leaders"), tauPeripheryFirstYear);
    expect(match.failed.some((c) => c.labelHe.includes("תחום"))).toBe(true);
  });
});

describe("MA STEM at Technion", () => {
  it("matches Technion graduate-relevant and national volunteering funds", () => {
    expect(bucketOf(technionMaStem, "technion-financial-aid")).not.toBe("eligible");
    expect(bucketOf(technionMaStem, "perach")).toBe("eligible");
    expect(bucketOf(technionMaStem, "technion-schulich-entrepreneurship")).toBe("nearMiss");
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

  it("is a near-miss for yeud 45 because of no military/national service", () => {
    const match = matchScholarship(byId("yeud-45"), arabHaifaBa);
    expect(["nearMiss", "ineligible"]).toContain(match.bucket);
    expect(match.failed.some((c) => c.field === "service")).toBe(true);
  });
});

describe("Haredi college student", () => {
  it("is eligible for Tena and not Irtikaa", () => {
    expect(bucketOf(harediCollege, "tena")).toBe("eligible");
    expect(bucketOf(harediCollege, "aluma-haredi-support")).toBe("eligible");
    expect(bucketOf(harediCollege, "irtikaa")).not.toBe("eligible");
    expect(bucketOf(harediCollege, "ono-dean")).toBe("eligible");
  });
});

describe("oleh at Hebrew University", () => {
  it("matches Student Authority tuition aid and HIAS, not Marom", () => {
    expect(bucketOf(olehStudent, "olim-student-authority")).toBe("eligible");
    expect(bucketOf(olehStudent, "hias-olim")).toBe("eligible");
    expect(bucketOf(olehStudent, "marom")).not.toBe("eligible");
    expect(bucketOf(olehStudent, "huji-financial-aid")).toBe("eligible");
  });
});

describe("near-miss counting", () => {
  it("counts a single failed conjunct as near-miss", () => {
    const almost = matchScholarship(byId("yeud-45"), {
      ...tauPeripheryFirstYear,
      yearOfStudy: 2,
    });
    expect(almost.bucket).toBe("nearMiss");
    expect(almost.eval.failCount).toBe(1);
  });
});
