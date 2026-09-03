import type { ProfileField, StudentProfile } from "./types";

/** Wizard step index (0-based) for each profile field. */
export const FIELD_STEP: Partial<Record<ProfileField, number>> = {
  institution: 0,
  degreeLevel: 0,
  yearOfStudy: 0,
  fieldOfStudy: 0,
  average: 0,
  bagrutAverage: 0,
  psychometric: 0,
  sechem: 0,
  studyLoad: 0,
  weeklyHours: 0,
  completedMechina: 0,
  cityOfResidence: 1,
  hometown: 1,
  neighborhood: 1,
  peripheryResidence: 1,
  peripheryHometown: 1,
  nationalPriorityResidence: 1,
  age: 2,
  gender: 2,
  familyFlags: 2,
  willingToVolunteer: 2,
  outstanding: 2,
  service: 3,
  combatRole: 3,
  yearsSinceDischarge: 3,
  reservistDaysLastYear: 3,
  loneSoldier: 3,
  sectors: 4,
  isOleh: 4,
  yearsInIsrael: 4,
  firstGeneration: 4,
  hasDisability: 4,
  disabilityRecognizedBy: 4,
  householdSize: 4,
  householdIncomeBand: 4,
  incomeBand: 4,
};

/** Five fields for the fast report («דוח מהיר»). */
export const FAST_REPORT_FIELDS: ProfileField[] = [
  "institution",
  "degreeLevel",
  "yearOfStudy",
  "cityOfResidence",
  "service",
];

export const HIGH_IMPACT_FIELDS: ProfileField[] = [
  "institution",
  "degreeLevel",
  "yearOfStudy",
  "cityOfResidence",
  "service",
  "willingToVolunteer",
  "householdIncomeBand",
  "sectors",
  "isOleh",
];

/**
 * Conversational intake (`/chat/`): core questions, then optional extras.
 * Same StudentProfile keys as the wizard — not a parallel schema.
 */
export const CHAT_CORE_FIELDS: ProfileField[] = [
  "degreeLevel",
  "reservistDaysLastYear",
  "cityOfResidence",
  "institution",
  "householdSize",
  "householdIncomeBand",
];

export const CHAT_EXTRA_FIELDS: ProfileField[] = [
  "yearOfStudy",
  "service",
  "willingToVolunteer",
  "sectors",
  "isOleh",
];

export const MIN_CHAT_ANSWERS_FOR_REPORT = 3;

export function isProfileFieldFilled(profile: StudentProfile, field: ProfileField): boolean {
  const v = profile[field];
  if (v === null || v === undefined) return false;
  if (Array.isArray(v) && v.length === 0) return false;
  return true;
}

/** Fields the wizard actually collects (predicates exist in the catalog). */
export const WIZARD_FIELDS: ProfileField[] = [
  "institution",
  "degreeLevel",
  "yearOfStudy",
  "fieldOfStudy",
  "average",
  "bagrutAverage",
  "psychometric",
  "sechem",
  "studyLoad",
  "weeklyHours",
  "completedMechina",
  "cityOfResidence",
  "hometown",
  "neighborhood",
  "peripheryResidence",
  "peripheryHometown",
  "nationalPriorityResidence",
  "age",
  "gender",
  "familyFlags",
  "willingToVolunteer",
  "outstanding",
  "service",
  "combatRole",
  "yearsSinceDischarge",
  "reservistDaysLastYear",
  "loneSoldier",
  "sectors",
  "isOleh",
  "yearsInIsrael",
  "firstGeneration",
  "hasDisability",
  "disabilityRecognizedBy",
  "householdSize",
  "householdIncomeBand",
];

export function filledWizardFieldCount(profile: StudentProfile): number {
  return WIZARD_FIELDS.filter((f) => isProfileFieldFilled(profile, f)).length;
}

export function profileFocusHref(field: ProfileField): string {
  return `/profile/?focus=${encodeURIComponent(field)}`;
}

export function fieldDomId(field: ProfileField): string {
  return `profile-field-${field}`;
}
