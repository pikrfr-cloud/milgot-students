import { z } from "zod";
import type { StudentProfile } from "./types";
import {
  DEGREE_LEVELS,
  DISABILITY_AUTHORITIES,
  FAMILY_FLAGS,
  FIELD_GROUPS,
  GENDERS,
  HOUSEHOLD_INCOME_BANDS,
  INCOME_BANDS,
  OUTSTANDING,
  SECTORS,
  SERVICE_TYPES,
  SOCIAL_BENEFITS,
  STUDY_LOADS,
} from "./types";

const nullish = <T extends z.ZodTypeAny>(schema: T) => schema.nullable().optional();

export const studentProfileSchema: z.ZodType<StudentProfile> = z
  .object({
    institution: nullish(z.string()),
    campus: nullish(z.string()),
    degreeLevel: nullish(z.enum(DEGREE_LEVELS)),
    yearOfStudy: nullish(z.number()),
    faculty: nullish(z.string()),
    fieldOfStudy: nullish(z.enum(FIELD_GROUPS)),
    average: nullish(z.number()),
    studyLoad: nullish(z.enum(STUDY_LOADS)),
    weeklyHours: nullish(z.number()),
    cityOfResidence: nullish(z.string()),
    hometown: nullish(z.string()),
    peripheryResidence: nullish(z.boolean()),
    peripheryHometown: nullish(z.boolean()),
    nationalPriorityResidence: nullish(z.boolean()),
    neighborhood: nullish(z.string()),
    bagrutAverage: nullish(z.number()),
    psychometric: nullish(z.number()),
    sechem: nullish(z.number()),
    householdSize: nullish(z.number()),
    householdIncomeBand: nullish(z.enum(HOUSEHOLD_INCOME_BANDS)),
    age: nullish(z.number()),
    gender: nullish(z.enum(GENDERS)),
    familyFlags: nullish(z.array(z.enum(FAMILY_FLAGS))),
    employmentHours: nullish(z.number()),
    volunteerHoursPerYear: nullish(z.number()),
    hasPerach: nullish(z.boolean()),
    willingToVolunteer: nullish(z.boolean()),
    outstanding: nullish(z.array(z.enum(OUTSTANDING))),
    service: nullish(z.enum(SERVICE_TYPES)),
    combatRole: nullish(z.boolean()),
    yearsSinceDischarge: nullish(z.number()),
    reservistDaysLastYear: nullish(z.number()),
    loneSoldier: nullish(z.boolean()),
    sectors: nullish(z.array(z.enum(SECTORS))),
    isOleh: nullish(z.boolean()),
    yearsInIsrael: nullish(z.number()),
    hasDisability: nullish(z.boolean()),
    disabilityRecognizedBy: nullish(z.enum(DISABILITY_AUTHORITIES)),
    incomeBand: nullish(z.enum(INCOME_BANDS)),
    socialBenefits: nullish(z.array(z.enum(SOCIAL_BENEFITS))),
    firstGeneration: nullish(z.boolean()),
    completedMechina: nullish(z.boolean()),
  })
  .passthrough();

export function parseStudentProfile(data: unknown): StudentProfile | null {
  const parsed = studentProfileSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}
