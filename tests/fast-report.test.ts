import { describe, expect, it } from "vitest";
import { FAST_REPORT_FIELDS, WIZARD_FIELDS } from "@/lib/profile-fields";
import { matchAll } from "@/lib/matcher";
import { SCHOLARSHIPS } from "@/data/scholarships";
import type { StudentProfile } from "@/lib/types";

describe("fast report five fields", () => {
  it("is exactly institution, degree/level, year, city, service", () => {
    expect(FAST_REPORT_FIELDS).toHaveLength(5);
    expect(FAST_REPORT_FIELDS).toEqual([
      "institution",
      "degreeLevel",
      "yearOfStudy",
      "cityOfResidence",
      "service",
    ]);
    for (const field of FAST_REPORT_FIELDS) {
      expect(WIZARD_FIELDS).toContain(field);
    }
  });

  it("produces a partial report from only those five fields", () => {
    const profile: StudentProfile = {
      institution: "tau",
      degreeLevel: "ba",
      yearOfStudy: 1,
      cityOfResidence: "שדרות",
      service: "idf",
    };
    const matches = matchAll(SCHOLARSHIPS, profile, {
      asOf: new Date("2026-09-01T12:00:00+03:00"),
    });
    expect(matches.length).toBe(SCHOLARSHIPS.length);
    const actionable = matches.filter((m) =>
      ["eligible", "needInfo", "nearMiss", "checkAtInstitution"].includes(m.bucket),
    );
    expect(actionable.length).toBeGreaterThan(0);
  });
});
