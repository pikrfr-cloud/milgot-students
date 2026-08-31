/** Shared domain types for the scholarship matcher. Keys are English. */

export const DEGREE_LEVELS = [
  "ba",
  "ma",
  "phd",
  "teaching_certificate",
  "practical_engineer",
  "prep",
] as const;
export type DegreeLevel = (typeof DEGREE_LEVELS)[number];

export const STUDY_LOADS = ["full", "partial"] as const;
export type StudyLoad = (typeof STUDY_LOADS)[number];

export const FIELD_GROUPS = [
  "stem",
  "engineering",
  "computer_science",
  "exact_sciences",
  "life_sciences",
  "medicine",
  "nursing",
  "health",
  "law",
  "business",
  "social_sciences",
  "humanities",
  "education",
  "arts",
  "design",
  "architecture",
  "social_work",
  "other",
] as const;
export type FieldGroup = (typeof FIELD_GROUPS)[number];

export const INCOME_BANDS = [
  "very_low",
  "low",
  "lower_middle",
  "middle",
  "high",
] as const;
export type IncomeBand = (typeof INCOME_BANDS)[number];

export const SERVICE_TYPES = [
  "idf",
  "national",
  "civil",
  "none",
  "exempt",
] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const GENDERS = ["female", "male", "other"] as const;
export type Gender = (typeof GENDERS)[number];

export const SECTORS = [
  "jewish_general",
  "arab",
  "druze",
  "bedouin",
  "circassian",
  "haredi",
  "ethiopian",
] as const;
export type Sector = (typeof SECTORS)[number];

export const FAMILY_FLAGS = [
  "single_parent",
  "orphan",
  "large_family",
  "married",
  "has_children",
] as const;
export type FamilyFlag = (typeof FAMILY_FLAGS)[number];

export const SOCIAL_BENEFITS = [
  "income_support",
  "disability_pension",
  "alimony_assurance",
  "unemployment",
  "other_bituach_leumi",
] as const;
export type SocialBenefit = (typeof SOCIAL_BENEFITS)[number];

export const OUTSTANDING = [
  "sports",
  "arts",
  "leadership",
  "research",
  "community",
] as const;
export type OutstandingActivity = (typeof OUTSTANDING)[number];

export const SCHOLARSHIP_TYPES = [
  "need",
  "merit",
  "volunteering",
  "leadership",
  "population",
  "periphery",
  "service",
  "research",
  "loan",
] as const;
export type ScholarshipType = (typeof SCHOLARSHIP_TYPES)[number];

export const SCOPE_TYPES = ["national", "institution", "municipal", "regional"] as const;
export type ScholarshipScope = (typeof SCOPE_TYPES)[number];

/** How the matcher should present a record even when predicates pass. */
export const SCHOLARSHIP_TREATMENTS = ["standard", "scoreBased", "checkAtInstitution"] as const;
export type ScholarshipTreatment = (typeof SCHOLARSHIP_TREATMENTS)[number];

export const CATALOG_KINDS = ["scholarship", "tip"] as const;
export type CatalogKind = (typeof CATALOG_KINDS)[number];

export const CADENCES = [
  "annual",
  "one_time",
  "multi_year",
  "monthly",
  "varies",
] as const;
export type Cadence = (typeof CADENCES)[number];

/**
 * Student profile. `null` / omitted = skipped/unknown.
 * Unknown fields must never fail a rule that depends on them.
 */
export type StudentProfile = {
  institution?: string | null;
  campus?: string | null;
  degreeLevel?: DegreeLevel | null;
  yearOfStudy?: number | null;
  faculty?: string | null;
  fieldOfStudy?: FieldGroup | null;
  average?: number | null;
  studyLoad?: StudyLoad | null;
  cityOfResidence?: string | null;
  hometown?: string | null;
  peripheryResidence?: boolean | null;
  peripheryHometown?: boolean | null;
  /**
   * Legal national-priority address: registered address in 5 of the 6 years
   * before studies. Never inferred from a city list (ייעוד 45/46).
   */
  nationalPriorityResidence?: boolean | null;
  age?: number | null;
  gender?: Gender | null;
  familyFlags?: FamilyFlag[] | null;
  employmentHours?: number | null;
  volunteerHoursPerYear?: number | null;
  hasPerach?: boolean | null;
  willingToVolunteer?: boolean | null;
  outstanding?: OutstandingActivity[] | null;
  service?: ServiceType | null;
  combatRole?: boolean | null;
  yearsSinceDischarge?: number | null;
  reservistDaysLastYear?: number | null;
  loneSoldier?: boolean | null;
  sectors?: Sector[] | null;
  isOleh?: boolean | null;
  yearsInIsrael?: number | null;
  hasDisability?: boolean | null;
  incomeBand?: IncomeBand | null;
  socialBenefits?: SocialBenefit[] | null;
  firstGeneration?: boolean | null;
  completedMechina?: boolean | null;
};

export type ProfileField = keyof StudentProfile;

export type Amount = {
  minIls?: number | null;
  maxIls?: number | null;
  /** Human-readable Hebrew amount when a number is misleading or unknown. */
  textHe: string;
  uncertain?: boolean;
};

export type Deadline = {
  kind: "fixed" | "annual_window" | "varies" | "rolling";
  /** ISO date when known, e.g. 2026-10-31 */
  date?: string;
  windowHe?: string;
  textHe: string;
  uncertain?: boolean;
};

export type Predicate =
  | { type: "institutionIn"; values: string[]; labelHe?: string }
  | { type: "institutionNotIn"; values: string[]; labelHe?: string }
  | { type: "degreeLevelIn"; values: DegreeLevel[]; labelHe?: string }
  | { type: "yearOfStudyIn"; values: number[]; labelHe?: string }
  | { type: "yearOfStudyMin"; value: number; labelHe?: string }
  | { type: "yearOfStudyMax"; value: number; labelHe?: string }
  | { type: "fieldOfStudyIn"; values: FieldGroup[]; labelHe?: string }
  | { type: "minAverage"; value: number; labelHe?: string }
  | { type: "studyLoadFull"; labelHe?: string }
  | { type: "cityIn"; values: string[]; of?: "residence" | "hometown" | "either"; labelHe?: string }
  | { type: "periphery"; of?: "residence" | "hometown" | "either"; labelHe?: string }
  | { type: "nationalPriority"; labelHe?: string }
  | { type: "incomeAtMost"; value: IncomeBand; labelHe?: string }
  | { type: "hasSocialBenefit"; values?: SocialBenefit[]; labelHe?: string }
  | { type: "serviceIn"; values: ServiceType[]; labelHe?: string }
  | { type: "combatRole"; value?: boolean; labelHe?: string }
  | { type: "yearsSinceDischargeMax"; value: number; labelHe?: string }
  | { type: "reservistDaysMin"; value: number; labelHe?: string }
  | { type: "loneSoldier"; value?: boolean; labelHe?: string }
  | { type: "genderIn"; values: Gender[]; labelHe?: string }
  | { type: "sectorIn"; values: Sector[]; labelHe?: string }
  | { type: "isOleh"; value?: boolean; labelHe?: string }
  | { type: "yearsInIsraelMax"; value: number; labelHe?: string }
  | { type: "yearsInIsraelMin"; value: number; labelHe?: string }
  | { type: "hasDisability"; value?: boolean; labelHe?: string }
  | { type: "familyFlagIn"; values: FamilyFlag[]; labelHe?: string }
  | { type: "maxEmploymentHours"; value: number; labelHe?: string }
  | { type: "minVolunteerHours"; value: number; labelHe?: string }
  | { type: "willingToVolunteer"; value?: boolean; labelHe?: string }
  | { type: "hasPerach"; value?: boolean; labelHe?: string }
  | { type: "ageMin"; value: number; labelHe?: string }
  | { type: "ageMax"; value: number; labelHe?: string }
  | { type: "outstandingIn"; values: OutstandingActivity[]; labelHe?: string }
  | { type: "firstGeneration"; value?: boolean; labelHe?: string }
  | { type: "completedMechina"; value?: boolean; labelHe?: string };

export type Rule =
  | { op: "allOf"; rules: Rule[]; labelHe?: string }
  | { op: "anyOf"; rules: Rule[]; labelHe?: string }
  | { op: "not"; rule: Rule; labelHe?: string }
  | Predicate;

export type Scholarship = {
  id: string;
  nameHe: string;
  funderHe: string;
  types: ScholarshipType[];
  scope: ScholarshipScope;
  amounts: Amount;
  cadence: Cadence;
  deadline: Deadline;
  whoItsForHe: string;
  documentsHe: string[];
  howToApplyHe: string;
  applyUrl?: string;
  notesHe?: string;
  coverageNoteHe?: string;
  lastVerified: string;
  sourceUrls: string[];
  eligibility: Rule;
  /** Institutions this scholarship is tied to; empty/omitted = national or not institution-specific. */
  institutionIds?: string[];
  /** Default `scholarship`. Tips are listed separately and not counted as scholarships. */
  kind?: CatalogKind;
  /**
   * `scoreBased`: never «eligible now» — award is a scored lottery/scale.
   * `checkAtInstitution`: skeleton dean/city-hall record; never auto-eligible.
   */
  treatment?: ScholarshipTreatment;
};

export type EvalStatus = "pass" | "fail" | "unknown";

export type CriterionResult = {
  id: string;
  labelHe: string;
  status: EvalStatus;
  detailHe: string;
  field?: ProfileField;
  /** Group headers are not counted as extra fails vs failCount. */
  group?: boolean;
};

export type RuleEval = {
  status: EvalStatus;
  failCount: number;
  /** Failures of identity predicates (institution, sector, gender, city, oleh, service, …). */
  immutableFailCount: number;
  /** Failures the student could still change (volunteer, load, average, mechina, …). */
  mutableFailCount: number;
  criteria: CriterionResult[];
};

export type MatchBucket = "eligible" | "needInfo" | "nearMiss" | "ineligible";

export type ScholarshipMatch = {
  scholarship: Scholarship;
  bucket: MatchBucket;
  eval: RuleEval;
  passed: CriterionResult[];
  failed: CriterionResult[];
  unknown: CriterionResult[];
};
