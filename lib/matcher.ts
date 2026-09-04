import {
  INCOME_BANDS,
  type CriterionResult,
  type EvalStatus,
  type FamilyFlag,
  type IncomeBand,
  type MatchBucket,
  type Predicate,
  type ProfileField,
  type Rule,
  type RuleEval,
  type Scholarship,
  type ScholarshipMatch,
  type Sector,
  type StudentProfile,
} from "./types";
import { INSTITUTIONS } from "./institutions";
import { cityInList, isPeripheryCity, neighborhoodMatches } from "./cities";
import { fieldLabelHe, predicateLabelHe } from "./labels";
import { isDeadlineClosed } from "./format";
import { profileIncomeBand } from "./income";
import { collectInstitutionValues } from "./rule-walk";

function isUnknown(value: unknown): boolean {
  return value === null || value === undefined;
}

/**
 * Native-born students (isOleh === false) do not see years-in-Israel in the wizard.
 * Treat them as having lived in Israel their whole life so Marom-style mins are not stuck
 * on a hidden field. Oleh with a skipped count stays unknown.
 */
function effectiveYearsInIsrael(profile: StudentProfile): number | null {
  if (!isUnknown(profile.yearsInIsrael)) return profile.yearsInIsrael as number;
  if (profile.isOleh === false) {
    if (!isUnknown(profile.age)) return profile.age as number;
    return 80;
  }
  return null;
}

function includesAny<T>(have: T[] | null | undefined, needed: T[]): boolean {
  if (!have) return false;
  return needed.some((n) => have.includes(n));
}

function incomeRank(band: IncomeBand): number {
  return INCOME_BANDS.indexOf(band);
}

/** Identity / not reasonably changeable this cycle. Failures → not eligible. */
const IMMUTABLE_TYPES = new Set<Predicate["type"]>([
  "institutionIn",
  "institutionNotIn",
  "sectorIn",
  "genderIn",
  "cityIn",
  "isOleh",
  "yearsInIsraelMax",
  "yearsInIsraelMin",
  "serviceIn",
  "degreeLevelIn",
  "fieldOfStudyIn",
  "yearOfStudyIn",
  "yearOfStudyMin",
  "yearOfStudyMax",
  "minBagrut",
  "minPsychometric",
  "minSechem",
  "completedMechina",
  "hasDisability",
  "disabilityRecognizedBy",
  "familyFlagIn",
  "combatRole",
  "loneSoldier",
  "firstGeneration",
  "histadrutMember",
  "ageMin",
  "ageMax",
  "yearsSinceDischargeMax",
  "periphery",
  "nationalPriority",
  "neighborhoodIn",
  "reservistDaysMin",
]);

function isImmutablePredicate(pred: Predicate): boolean {
  return IMMUTABLE_TYPES.has(pred.type);
}

/** True when every leaf in the rule tree is an identity predicate. */
function innerImmutable(rule: Rule): boolean {
  if (isPredicate(rule)) return isImmutablePredicate(rule);
  if (rule.op === "not") return innerImmutable(rule.rule);
  return rule.rules.length > 0 && rule.rules.every(innerImmutable);
}

function cityMatches(
  profile: StudentProfile,
  values: string[],
  of: "residence" | "hometown" | "either" = "residence",
): EvalStatus {
  const res = profile.cityOfResidence;
  const home = profile.hometown;
  const match = (city: string | null | undefined) =>
    !isUnknown(city) && cityInList(city as string, values);

  if (of === "residence") {
    if (isUnknown(res)) return "unknown";
    return match(res) ? "pass" : "fail";
  }
  if (of === "hometown") {
    if (isUnknown(home)) return "unknown";
    return match(home) ? "pass" : "fail";
  }
  if (match(res) || match(home)) return "pass";
  if (isUnknown(res) && isUnknown(home)) return "unknown";
  // Known mismatch on the filled city is a fail. Do not report a filled
  // cityOfResidence as «חסר במפורט» just because hometown is still blank.
  if (!isUnknown(res) && !match(res)) return "fail";
  return "unknown";
}

function peripheryMatches(
  profile: StudentProfile,
  of: "residence" | "hometown" | "either" = "residence",
): EvalStatus {
  const fromFlag = (flag: boolean | null | undefined, city: string | null | undefined) => {
    if (flag === true) return "pass" as const;
    if (flag === false) return "fail" as const;
    if (isUnknown(city)) return "unknown" as const;
    return isPeripheryCity(city as string) ? "pass" : "fail";
  };

  if (of === "residence") return fromFlag(profile.peripheryResidence, profile.cityOfResidence);
  if (of === "hometown") return fromFlag(profile.peripheryHometown, profile.hometown);

  const a = fromFlag(profile.peripheryResidence, profile.cityOfResidence);
  const b = fromFlag(profile.peripheryHometown, profile.hometown);
  if (a === "pass" || b === "pass") return "pass";
  if (a === "unknown" || b === "unknown") return "unknown";
  return "fail";
}

function boolPred(
  actual: boolean | null | undefined,
  expected: boolean,
): EvalStatus {
  if (isUnknown(actual)) return "unknown";
  return actual === expected ? "pass" : "fail";
}

function numPred(
  actual: number | null | undefined,
  ok: (n: number) => boolean,
): EvalStatus {
  if (isUnknown(actual)) return "unknown";
  return ok(actual as number) ? "pass" : "fail";
}

function listPred<T>(
  actual: T | null | undefined,
  values: T[],
): EvalStatus {
  if (isUnknown(actual)) return "unknown";
  return values.includes(actual as T) ? "pass" : "fail";
}

function arrayOverlap<T>(
  actual: T[] | null | undefined,
  values: T[],
): EvalStatus {
  if (isUnknown(actual)) return "unknown";
  return includesAny(actual, values) ? "pass" : "fail";
}

function profileValueHe(profile: StudentProfile, field?: ProfileField): string {
  if (!field) return "";
  const v = profile[field];
  if (isUnknown(v)) return "לא צוין";
  if (typeof v === "boolean") return v ? "כן" : "לא";
  if (Array.isArray(v)) return v.length ? v.map((x) => fieldLabelHe(String(x))).join(", ") : "אין";
  if (field === "institution") {
    return INSTITUTIONS.find((i) => i.id === v)?.nameHe ?? String(v);
  }
  return fieldLabelHe(String(v));
}

function detailFor(
  pred: Predicate,
  status: EvalStatus,
  profile: StudentProfile,
  field?: ProfileField,
): string {
  const value = field ? profileValueHe(profile, field) : "";
  if (status === "unknown") {
    if (pred.type === "incomeAtMost" && profile && !isUnknown(profileIncomeBand(profile))) {
      return "ההכנסה שבפרופיל היא הערכה פנימית לפי סדר גודל, לא נוסחת הקרן. לא נפסלה המלגה — יש לאמת מול הקרן.";
    }
    return `חסר במפורט: ${field ? fieldLabelHe(field) : "פרט נדרש"}. לא נפסלה המלגה — נדרש אימות.`;
  }
  if (status === "pass") {
    return value ? `מתאים לפי הנתון בפרופיל: ${value}.` : "הקריטריון מתקיים לפי הפרופיל.";
  }
  return value
    ? `לא מתקיים. בפרופיל: ${value}.`
    : "הקריטריון אינו מתקיים לפי הפרופיל.";
}

function incomeMissingField(profile: StudentProfile): ProfileField {
  const hasSize = !isUnknown(profile.householdSize);
  const hasBand = !isUnknown(profile.householdIncomeBand);
  if (hasBand && !hasSize) return "householdSize";
  if (hasSize && !hasBand) return "householdIncomeBand";
  if (!hasBand) return "householdIncomeBand";
  return "householdSize";
}

function fieldFor(pred: Predicate, profile?: StudentProfile): ProfileField | undefined {
  switch (pred.type) {
    case "institutionIn":
    case "institutionNotIn":
      return "institution";
    case "degreeLevelIn":
      return "degreeLevel";
    case "yearOfStudyIn":
    case "yearOfStudyMin":
    case "yearOfStudyMax":
      return "yearOfStudy";
    case "fieldOfStudyIn":
      return "fieldOfStudy";
    case "minAverage":
      return "average";
    case "studyLoadFull":
      return "studyLoad";
    case "cityIn":
      return pred.of === "hometown" ? "hometown" : "cityOfResidence";
    case "neighborhoodIn":
      return "neighborhood";
    case "periphery":
      return pred.of === "hometown" ? "peripheryHometown" : "peripheryResidence";
    case "nationalPriority":
      return "nationalPriorityResidence";
    case "incomeAtMost":
      return profile ? incomeMissingField(profile) : "householdIncomeBand";
    case "minBagrut":
      return "bagrutAverage";
    case "minPsychometric":
      return "psychometric";
    case "minSechem":
      return "sechem";
    case "hasSocialBenefit":
      return "socialBenefits";
    case "serviceIn":
      return "service";
    case "combatRole":
      return "combatRole";
    case "yearsSinceDischargeMax":
      return "yearsSinceDischarge";
    case "reservistDaysMin":
      return "reservistDaysLastYear";
    case "loneSoldier":
      return "loneSoldier";
    case "genderIn":
      return "gender";
    case "sectorIn":
      return "sectors";
    case "isOleh":
      return "isOleh";
    case "yearsInIsraelMax":
    case "yearsInIsraelMin":
      return "yearsInIsrael";
    case "hasDisability":
      return "hasDisability";
    case "familyFlagIn":
      return "familyFlags";
    case "maxEmploymentHours":
      return "employmentHours";
    case "minVolunteerHours":
      return "volunteerHoursPerYear";
    case "willingToVolunteer":
      return "willingToVolunteer";
    case "hasPerach":
      return "hasPerach";
    case "ageMin":
    case "ageMax":
      return "age";
    case "outstandingIn":
      return "outstanding";
    case "firstGeneration":
      return "firstGeneration";
    case "histadrutMember":
      return "histadrutMember";
    case "completedMechina":
      return "completedMechina";
    case "weeklyHoursMin":
      return "weeklyHours";
    case "disabilityRecognizedBy":
      return "disabilityRecognizedBy";
    default:
      return undefined;
  }
}

function evalPredicate(pred: Predicate, profile: StudentProfile): EvalStatus {
  switch (pred.type) {
    case "institutionIn":
      return listPred(profile.institution, pred.values);
    case "institutionNotIn": {
      if (isUnknown(profile.institution)) return "unknown";
      return pred.values.includes(profile.institution as string) ? "fail" : "pass";
    }
    case "degreeLevelIn":
      return listPred(profile.degreeLevel, pred.values);
    case "yearOfStudyIn":
      return listPred(profile.yearOfStudy, pred.values);
    case "yearOfStudyMin":
      return numPred(profile.yearOfStudy, (n) => n >= pred.value);
    case "yearOfStudyMax":
      return numPred(profile.yearOfStudy, (n) => n <= pred.value);
    case "fieldOfStudyIn":
      return listPred(profile.fieldOfStudy, pred.values);
    case "minAverage":
      return numPred(profile.average, (n) => n >= pred.value);
    case "studyLoadFull": {
      if (profile.studyLoad === "full") return "pass";
      if (!isUnknown(profile.weeklyHours) && (profile.weeklyHours as number) >= 12) return "pass";
      if (profile.studyLoad === "partial") return "fail";
      if (!isUnknown(profile.weeklyHours)) {
        return (profile.weeklyHours as number) >= 12 ? "pass" : "fail";
      }
      return "unknown";
    }
    case "cityIn":
      return cityMatches(profile, pred.values, pred.of ?? "residence");
    case "neighborhoodIn": {
      if (isUnknown(profile.neighborhood)) return "unknown";
      return neighborhoodMatches(profile.neighborhood as string, pred.values) ? "pass" : "fail";
    }
    case "periphery":
      return peripheryMatches(profile, pred.of ?? "residence");
    case "nationalPriority":
      return boolPred(profile.nationalPriorityResidence, true);
    case "incomeAtMost": {
      const band = profileIncomeBand(profile);
      if (isUnknown(band)) return "unknown";
      // Estimate only — a band miss is needInfo, not a hard ineligible fail.
      return incomeRank(band as IncomeBand) <= incomeRank(pred.value) ? "pass" : "unknown";
    }
    case "minBagrut":
      return numPred(profile.bagrutAverage, (n) => n >= pred.value);
    case "minPsychometric":
      return numPred(profile.psychometric, (n) => n >= pred.value);
    case "minSechem":
      return numPred(profile.sechem, (n) => n >= pred.value);
    case "hasSocialBenefit": {
      if (isUnknown(profile.socialBenefits)) return "unknown";
      if (!pred.values || pred.values.length === 0) {
        return (profile.socialBenefits as string[]).length > 0 ? "pass" : "fail";
      }
      return includesAny(profile.socialBenefits, pred.values) ? "pass" : "fail";
    }
    case "serviceIn":
      return listPred(profile.service, pred.values);
    case "combatRole":
      return boolPred(profile.combatRole, pred.value ?? true);
    case "yearsSinceDischargeMax":
      return numPred(profile.yearsSinceDischarge, (n) => n <= pred.value);
    case "reservistDaysMin":
      return numPred(profile.reservistDaysLastYear, (n) => n >= pred.value);
    case "loneSoldier":
      return boolPred(profile.loneSoldier, pred.value ?? true);
    case "genderIn":
      return listPred(profile.gender, pred.values);
    case "sectorIn": {
      if (isUnknown(profile.sectors)) return "unknown";
      return includesAny(profile.sectors as Sector[], pred.values) ? "pass" : "fail";
    }
    case "isOleh":
      return boolPred(profile.isOleh, pred.value ?? true);
    case "yearsInIsraelMax":
      return numPred(effectiveYearsInIsrael(profile), (n) => n <= pred.value);
    case "yearsInIsraelMin":
      return numPred(effectiveYearsInIsrael(profile), (n) => n >= pred.value);
    case "hasDisability":
      return boolPred(profile.hasDisability, pred.value ?? true);
    case "familyFlagIn":
      return arrayOverlap(profile.familyFlags as FamilyFlag[] | null | undefined, pred.values);
    case "maxEmploymentHours":
      return numPred(profile.employmentHours, (n) => n <= pred.value);
    case "minVolunteerHours":
      return numPred(profile.volunteerHoursPerYear, (n) => n >= pred.value);
    case "willingToVolunteer":
      return boolPred(profile.willingToVolunteer, pred.value ?? true);
    case "hasPerach":
      return boolPred(profile.hasPerach, pred.value ?? true);
    case "ageMin":
      return numPred(profile.age, (n) => n >= pred.value);
    case "ageMax":
      return numPred(profile.age, (n) => n <= pred.value);
    case "outstandingIn":
      return arrayOverlap(profile.outstanding, pred.values);
    case "firstGeneration":
      return boolPred(profile.firstGeneration, pred.value ?? true);
    case "histadrutMember":
      return boolPred(profile.histadrutMember, pred.value ?? true);
    case "completedMechina":
      return boolPred(profile.completedMechina, pred.value ?? true);
    case "weeklyHoursMin": {
      if (!isUnknown(profile.weeklyHours)) {
        return (profile.weeklyHours as number) >= pred.value ? "pass" : "fail";
      }
      if (profile.studyLoad === "full" && pred.value <= 12) return "pass";
      return "unknown";
    }
    case "disabilityRecognizedBy":
      return listPred(profile.disabilityRecognizedBy, pred.values);
    default: {
      const _exhaustive: never = pred;
      return _exhaustive;
    }
  }
}

function isPredicate(rule: Rule): rule is Predicate {
  return "type" in rule;
}

let seq = 0;
function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

function failSplit(
  status: EvalStatus,
  immutable: boolean,
): Pick<RuleEval, "failCount" | "immutableFailCount" | "mutableFailCount"> {
  if (status !== "fail") {
    return { failCount: 0, immutableFailCount: 0, mutableFailCount: 0 };
  }
  return {
    failCount: 1,
    immutableFailCount: immutable ? 1 : 0,
    mutableFailCount: immutable ? 0 : 1,
  };
}

function evalRule(rule: Rule, profile: StudentProfile): RuleEval {
  if (isPredicate(rule)) {
    const status = evalPredicate(rule, profile);
    const field = fieldFor(rule, profile);
    const criterion: CriterionResult = {
      id: nextId("c"),
      labelHe: rule.labelHe ?? predicateLabelHe(rule),
      status,
      detailHe: detailFor(rule, status, profile, field),
      field,
    };
    return {
      status,
      ...failSplit(status, isImmutablePredicate(rule)),
      immutablePass: status === "pass" && isImmutablePredicate(rule),
      criteria: [criterion],
    };
  }

  if (rule.op === "not") {
    const inner = evalRule(rule.rule, profile);
    const status: EvalStatus =
      inner.status === "pass" ? "fail" : inner.status === "fail" ? "pass" : "unknown";
    const treeImmutable = innerImmutable(rule.rule);
    const failImmutable = status === "fail" && (!!inner.immutablePass || treeImmutable);
    const passImmutable =
      status === "pass" &&
      treeImmutable &&
      inner.mutableFailCount === 0 &&
      (inner.immutableFailCount > 0 || inner.status === "fail");
    const innerIsCompound = !isPredicate(rule.rule);

    if (innerIsCompound) {
      const criterion: CriterionResult = {
        id: nextId("not"),
        labelHe: rule.labelHe ?? "תנאי שלילה",
        status,
        detailHe:
          status === "pass"
            ? "התנאי השלילי מתקיים כמכלול (לא כל התנאים הפנימיים מתקיימים)."
            : status === "unknown"
              ? "חסר פרט כדי לאשר את התנאי השלילי."
              : "התנאי השלילי אינו מתקיים — התנאים הפנימיים מתקיימים.",
      };
      return {
        status,
        ...failSplit(status, failImmutable),
        immutablePass: passImmutable,
        criteria: [criterion],
      };
    }

    const criteria = inner.criteria.map((c) => ({
      ...c,
      id: nextId("n"),
      labelHe: rule.labelHe ? `${rule.labelHe}: ${c.labelHe}` : `לא ${c.labelHe}`,
      status:
        c.status === "unknown" ? ("unknown" as const) : c.status === "pass" ? ("fail" as const) : ("pass" as const),
      detailHe:
        c.status === "unknown"
          ? c.detailHe
          : status === "pass"
            ? `התנאי השלילי מתקיים (${c.labelHe}).`
            : `התנאי השלילי אינו מתקיים (${c.labelHe}).`,
    }));
    return {
      status,
      ...failSplit(status, failImmutable),
      immutablePass: passImmutable,
      criteria,
    };
  }

  if (rule.op === "anyOf") {
    const children = rule.rules.map((r) => evalRule(r, profile));
    const anyPass = children.some((c) => c.status === "pass");
    const anyUnknown = children.some((c) => c.status === "unknown");
    const status: EvalStatus = anyPass ? "pass" : anyUnknown ? "unknown" : "fail";
    const immutablePass = children.some((c) => c.status === "pass" && c.immutablePass);

    const summary: CriterionResult = {
      id: nextId("any"),
      labelHe: rule.labelHe ?? "לפחות אחד מהמסלולים",
      status,
      group: true,
      detailHe:
        status === "pass"
          ? "לפחות אחד מהתנאים בקבוצה מתקיים."
          : status === "unknown"
            ? "חסר פרט כדי לאשר אם אחד מהמסלולים מתקיים."
            : "אף אחד מהמסלולים בקבוצה אינו מתקיים.",
    };

    if (status === "pass") {
      const passing = children.filter((c) => c.status === "pass");
      return {
        status,
        failCount: 0,
        immutableFailCount: 0,
        mutableFailCount: 0,
        immutablePass,
        criteria: [summary, ...passing.flatMap((c) => c.criteria)],
      };
    }
    if (status === "unknown") {
      const relevant = children.filter((c) => c.status !== "fail");
      return {
        status,
        failCount: 0,
        immutableFailCount: 0,
        mutableFailCount: 0,
        immutablePass: false,
        criteria: [summary, ...relevant.flatMap((c) => c.criteria)],
      };
    }

    const blockedImmutably = children.every((c) => c.immutableFailCount > 0);
    const leaf: CriterionResult = {
      id: nextId("any-fail"),
      labelHe: rule.labelHe ?? "לפחות אחד מהמסלולים",
      status: "fail",
      detailHe: "אף אחד מהמסלולים בקבוצה אינו מתקיים.",
    };
    return {
      status,
      ...failSplit("fail", blockedImmutably),
      immutablePass: false,
      criteria: [leaf],
    };
  }

  const children = rule.rules.map((r) => evalRule(r, profile));
  const anyFail = children.some((c) => c.status === "fail");
  const anyUnknown = children.some((c) => c.status === "unknown");
  // Fail wins over unknown: allOf(immutable fail, missing field) is ineligible,
  // not «חסר פרט» on the unknown sibling.
  const status: EvalStatus = anyFail ? "fail" : anyUnknown ? "unknown" : "pass";
  const failCount = children.reduce((sum, c) => sum + c.failCount, 0);
  const immutableFailCount = children.reduce((sum, c) => sum + c.immutableFailCount, 0);
  const mutableFailCount = children.reduce((sum, c) => sum + c.mutableFailCount, 0);
  const immutablePass = status === "pass" && children.every((c) => c.immutablePass);
  const criteria = children.flatMap((c) => c.criteria);
  if (rule.labelHe) {
    criteria.unshift({
      id: nextId("all"),
      labelHe: rule.labelHe,
      status,
      group: true,
      detailHe:
        status === "pass"
          ? "כל התנאים בקבוצה מתקיימים."
          : status === "unknown"
            ? "חלק מהתנאים דורשים פרט חסר."
            : "לא כל התנאים בקבוצה מתקיימים.",
    });
  }
  return { status, failCount, immutableFailCount, mutableFailCount, immutablePass, criteria };
}

const NEAR_MISS_MAX = 2;

/**
 * True when every passing path requires an institutionIn leaf.
 * anyOf(city, institution) is not required — city can still pass.
 */
function ruleRequiresInstitutionIn(rule: Rule): boolean {
  if (isPredicate(rule)) return rule.type === "institutionIn";
  if (rule.op === "not") return false;
  if (rule.op === "anyOf") {
    return rule.rules.length > 0 && rule.rules.every(ruleRequiresInstitutionIn);
  }
  return rule.rules.some(ruleRequiresInstitutionIn);
}

/**
 * Catalog landing `institutionIds` is a student-institution gate when eligibility
 * never mentions institutionIn. Records that already encode school (including
 * anyOf city-or-campus) are left unchanged.
 */
function catalogInstitutionIdsGate(scholarship: Scholarship): string[] | null {
  const ids = scholarship.institutionIds?.filter(Boolean) ?? [];
  if (!ids.length) return null;
  if (collectInstitutionValues(scholarship.eligibility).length > 0) return null;
  return ids;
}

function eligibilityWithInstitutionGate(scholarship: Scholarship): Rule {
  const ids = catalogInstitutionIdsGate(scholarship);
  if (!ids) return scholarship.eligibility;
  return { op: "allOf", rules: [{ type: "institutionIn", values: ids }, scholarship.eligibility] };
}

function unknownRequiredInstitution(scholarship: Scholarship, profile: StudentProfile): boolean {
  if (!isUnknown(profile.institution)) return false;
  if (catalogInstitutionIdsGate(scholarship)) return true;
  return ruleRequiresInstitutionIn(scholarship.eligibility);
}

export function bucketFromEval(
  evaluation: RuleEval,
  options: { unknownRequiredInstitution?: boolean } = {},
): MatchBucket {
  if (evaluation.immutableFailCount > 0) return "ineligible";
  if (evaluation.failCount === 0 && evaluation.status === "pass") return "eligible";
  if (evaluation.failCount === 0) return "needInfo";
  // School is a required identity fact that is still blank: never «כמעט מתאים».
  if (options.unknownRequiredInstitution) {
    return evaluation.mutableFailCount <= NEAR_MISS_MAX ? "needInfo" : "ineligible";
  }
  if (evaluation.mutableFailCount <= NEAR_MISS_MAX) return "nearMiss";
  return "ineligible";
}

export type MatchOptions = {
  asOf?: Date;
};

function leafCriteria(evaluation: RuleEval, status: EvalStatus): CriterionResult[] {
  return evaluation.criteria.filter((c) => c.status === status && !c.group);
}

function applyPostEval(
  scholarship: Scholarship,
  evaluation: RuleEval,
  bucket: MatchBucket,
  asOf: Date,
): { bucket: MatchBucket; evaluation: RuleEval } {
  const extra: CriterionResult[] = [];

  if (
    (bucket === "eligible" || bucket === "needInfo" || bucket === "nearMiss") &&
    isDeadlineClosed(scholarship.deadline, asOf)
  ) {
    extra.push({
      id: nextId("deadline"),
      labelHe: "מועד ההגשה",
      status: "unknown",
      detailHe: "המועד שפורסם למחזור זה כבר עבר. המלגה נשארת רלוונטית למחזור הבא — לא «לא זכאים».",
    });
    return {
      bucket: "closedCycle",
      evaluation: {
        ...evaluation,
        criteria: [...evaluation.criteria, ...extra],
      },
    };
  }

  if (bucket === "eligible" && scholarship.treatment === "scoreBased") {
    extra.push({
      id: nextId("score"),
      labelHe: "ניקוד השוואתי",
      status: "unknown",
      detailHe:
        "הזכאות נקבעת לפי ניקוד מול כלל הפונים, לא לפי סף בינארי. אי אפשר לאשר זכאות מהפרופיל בלבד.",
    });
    return {
      bucket: "needInfo",
      evaluation: {
        ...evaluation,
        status: "unknown",
        criteria: [...evaluation.criteria, ...extra],
      },
    };
  }

  if (scholarship.treatment === "checkAtInstitution" || scholarship.treatment === "checkAtAuthority") {
    const missingNamedField = evaluation.criteria.some(
      (c) => c.status === "unknown" && !!c.field && !c.group,
    );
    if (bucket === "eligible" || (bucket === "needInfo" && !missingNamedField)) {
      const atAuthority = scholarship.treatment === "checkAtAuthority";
      extra.push({
        id: nextId("check"),
        labelHe: atAuthority ? "בדיקה ברשות המוסמכת" : "בדיקה במוסד / ברשות",
        status: "unknown",
        detailHe: atAuthority
          ? "רשומה זו מציינת מסלול שיקום או מימון ברשות (ביטוח לאומי / משרד), בלי תנאי סף מאומתים בקטלוג. יש לבדוק במקור — לא «עומדים בתנאי הסף»."
          : "רשומה זו מציינת שקיים מסלול דיקן או עירייה, בלי תנאי סף מאומתים בקטלוג. יש לבדוק במקור — לא «עומדים בתנאי הסף».",
      });
      return {
        bucket: "checkAtInstitution",
        evaluation: {
          ...evaluation,
          status: "unknown",
          criteria: [...evaluation.criteria, ...extra],
        },
      };
    }
  }

  return { bucket, evaluation };
}

export function matchScholarship(
  scholarship: Scholarship,
  profile: StudentProfile,
  options: MatchOptions = {},
): ScholarshipMatch {
  seq = 0;
  const asOf = options.asOf ?? new Date();
  const evaluation = evalRule(eligibilityWithInstitutionGate(scholarship), profile);
  const rawBucket = bucketFromEval(evaluation, {
    unknownRequiredInstitution: unknownRequiredInstitution(scholarship, profile),
  });
  const { bucket, evaluation: finalEval } = applyPostEval(
    scholarship,
    evaluation,
    rawBucket,
    asOf,
  );
  return {
    scholarship,
    bucket,
    eval: finalEval,
    passed: leafCriteria(finalEval, "pass"),
    failed: leafCriteria(finalEval, "fail"),
    unknown: leafCriteria(finalEval, "unknown"),
  };
}

export function matchAll(
  scholarships: Scholarship[],
  profile: StudentProfile,
  options: MatchOptions = {},
): ScholarshipMatch[] {
  return applyMutexNotes(scholarships.map((s) => matchScholarship(s, profile, options)));
}

const TAKING_BUCKETS = new Set<MatchBucket>(["eligible", "closedCycle"]);

function applyMutexNotes(matches: ScholarshipMatch[]): ScholarshipMatch[] {
  const byId = new Map(matches.map((m) => [m.scholarship.id, m]));
  return matches.map((m) => {
    const excludes = m.scholarship.excludes;
    if (!excludes?.length || !TAKING_BUCKETS.has(m.bucket)) return m;
    const rivals = excludes
      .map((id) => byId.get(id))
      .filter((o): o is ScholarshipMatch => !!o && TAKING_BUCKETS.has(o.bucket));
    if (!rivals.length) return m;
    const names = [m.scholarship.nameHe, ...rivals.map((r) => r.scholarship.nameHe)];
    return { ...m, mutexNoteHe: `בחרו אחת מ‑${names.join(" / ")}` };
  });
}

export function groupMatches(matches: ScholarshipMatch[]) {
  return {
    eligible: matches.filter((m) => m.bucket === "eligible"),
    closedCycle: matches.filter((m) => m.bucket === "closedCycle"),
    needInfo: matches.filter((m) => m.bucket === "needInfo"),
    nearMiss: matches.filter((m) => m.bucket === "nearMiss"),
    checkAtInstitution: matches.filter((m) => m.bucket === "checkAtInstitution"),
    ineligible: matches.filter((m) => m.bucket === "ineligible"),
  };
}
