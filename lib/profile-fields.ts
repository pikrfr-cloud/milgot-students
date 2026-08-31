import type { ProfileField } from "./types";

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
  householdSize: 4,
  householdIncomeBand: 4,
  incomeBand: 4,
};

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
  "householdSize",
  "householdIncomeBand",
];

export function profileFocusHref(field: ProfileField): string {
  return `/profile/?focus=${encodeURIComponent(field)}`;
}

export function fieldDomId(field: ProfileField): string {
  return `profile-field-${field}`;
}
