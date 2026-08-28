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
import { isPeripheryCity } from "./cities";
import { fieldLabelHe, predicateLabelHe } from "./labels";

function isUnknown(value: unknown): boolean {
  return value === null || value === undefined;
}

function includesAny<T>(have: T[] | null | undefined, needed: T[]): boolean {
  if (!have) return false;
  return needed.some((n) => have.includes(n));
}

function incomeRank(band: IncomeBand): number {
  return INCOME_BANDS.indexOf(band);
}

function cityMatches(
  profile: StudentProfile,
  values: string[],
  of: "residence" | "hometown" | "either" = "residence",
): EvalStatus {
  const res = profile.cityOfResidence;
  const home = profile.hometown;
  const match = (city: string | null | undefined) =>
    !isUnknown(city) && values.includes(city as string);

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
  if (isUnknown(res) || isUnknown(home)) return "unknown";
  return "fail";
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
    return `חסר במפורט: ${field ? fieldLabelHe(field) : "פרט נדרש"}. לא נפסלה המלגה — נדרש אימות.`;
  }
  if (status === "pass") {
    return value ? `מתאים לפי הנתון בפרופיל: ${value}.` : "הקריטריון מתקיים לפי הפרופיל.";
  }
  return value
    ? `לא מתקיים. בפרופיל: ${value}.`
    : "הקריטריון אינו מתקיים לפי הפרופיל.";
}

function fieldFor(pred: Predicate): ProfileField | undefined {
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
    case "periphery":
      return pred.of === "hometown" ? "peripheryHometown" : "peripheryResidence";
    case "incomeAtMost":
      return "incomeBand";
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
      if (isUnknown(profile.studyLoad)) return "unknown";
      return profile.studyLoad === "full" ? "pass" : "fail";
    }
    case "cityIn":
      return cityMatches(profile, pred.values, pred.of ?? "residence");
    case "periphery":
      return peripheryMatches(profile, pred.of ?? "residence");
    case "incomeAtMost": {
      if (isUnknown(profile.incomeBand)) return "unknown";
      return incomeRank(profile.incomeBand as IncomeBand) <= incomeRank(pred.value)
        ? "pass"
        : "fail";
    }
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
      return numPred(profile.yearsInIsrael, (n) => n <= pred.value);
    case "yearsInIsraelMin":
      return numPred(profile.yearsInIsrael, (n) => n >= pred.value);
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

function evalRule(rule: Rule, profile: StudentProfile): RuleEval {
  if (isPredicate(rule)) {
    const status = evalPredicate(rule, profile);
    const field = fieldFor(rule);
    const criterion: CriterionResult = {
      id: nextId("c"),
      labelHe: rule.labelHe ?? predicateLabelHe(rule),
      status,
      detailHe: detailFor(rule, status, profile, field),
      field,
    };
    return {
      status,
      failCount: status === "fail" ? 1 : 0,
      criteria: [criterion],
    };
  }

  if (rule.op === "not") {
    const inner = evalRule(rule.rule, profile);
    const status: EvalStatus =
      inner.status === "pass" ? "fail" : inner.status === "fail" ? "pass" : "unknown";
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
      failCount: status === "fail" ? 1 : 0,
      criteria,
    };
  }

  if (rule.op === "anyOf") {
    const children = rule.rules.map((r) => evalRule(r, profile));
    const anyPass = children.some((c) => c.status === "pass");
    const anyUnknown = children.some((c) => c.status === "unknown");
    const status: EvalStatus = anyPass ? "pass" : anyUnknown ? "unknown" : "fail";
    const passing = children.filter((c) => c.status === "pass");
    const relevant = anyPass
      ? passing
      : anyUnknown
        ? children.filter((c) => c.status !== "fail")
        : children;
    const criteria = relevant.flatMap((c) => c.criteria);
    if (rule.labelHe) {
      criteria.unshift({
        id: nextId("any"),
        labelHe: rule.labelHe,
        status,
        detailHe:
          status === "pass"
            ? "לפחות אחד מהתנאים בקבוצה מתקיים."
            : status === "unknown"
              ? "חסר פרט כדי לאשר אם אחד מהמסלולים מתקיים."
              : "אף אחד מהמסלולים בקבוצה אינו מתקיים.",
      });
    }
    return {
      status,
      failCount: status === "fail" ? 1 : 0,
      criteria,
    };
  }

  // allOf
  const children = rule.rules.map((r) => evalRule(r, profile));
  const anyFail = children.some((c) => c.status === "fail");
  const anyUnknown = children.some((c) => c.status === "unknown");
  const status: EvalStatus = anyFail ? "fail" : anyUnknown ? "unknown" : "pass";
  const failCount = children.reduce((sum, c) => sum + c.failCount, 0);
  const criteria = children.flatMap((c) => c.criteria);
  if (rule.labelHe) {
    criteria.unshift({
      id: nextId("all"),
      labelHe: rule.labelHe,
      status,
      detailHe:
        status === "pass"
          ? "כל התנאים בקבוצה מתקיימים."
          : status === "unknown"
            ? "חלק מהתנאים דורשים פרט חסר."
            : "לא כל התנאים בקבוצה מתקיימים.",
    });
  }
  return { status, failCount, criteria };
}

const NEAR_MISS_MAX = 2;

export function bucketFromEval(evaluation: RuleEval): MatchBucket {
  if (evaluation.failCount === 0 && evaluation.status === "pass") return "eligible";
  if (evaluation.failCount === 0) return "needInfo";
  if (evaluation.failCount <= NEAR_MISS_MAX) return "nearMiss";
  return "ineligible";
}

export function matchScholarship(
  scholarship: Scholarship,
  profile: StudentProfile,
): ScholarshipMatch {
  seq = 0;
  const evaluation = evalRule(scholarship.eligibility, profile);
  const bucket = bucketFromEval(evaluation);
  return {
    scholarship,
    bucket,
    eval: evaluation,
    passed: evaluation.criteria.filter((c) => c.status === "pass"),
    failed: evaluation.criteria.filter((c) => c.status === "fail"),
    unknown: evaluation.criteria.filter((c) => c.status === "unknown"),
  };
}

export function matchAll(
  scholarships: Scholarship[],
  profile: StudentProfile,
): ScholarshipMatch[] {
  return scholarships.map((s) => matchScholarship(s, profile));
}

export function groupMatches(matches: ScholarshipMatch[]) {
  return {
    eligible: matches.filter((m) => m.bucket === "eligible"),
    needInfo: matches.filter((m) => m.bucket === "needInfo"),
    nearMiss: matches.filter((m) => m.bucket === "nearMiss"),
    ineligible: matches.filter((m) => m.bucket === "ineligible"),
  };
}
