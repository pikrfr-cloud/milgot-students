import type { Amount, Deadline, FieldGroup, Rule, Scholarship } from "@/lib/types";
import { bestSourceLevel, hasOfficialSource } from "@/lib/sources";

export const STEM: FieldGroup[] = [
  "stem",
  "engineering",
  "computer_science",
  "exact_sciences",
  "life_sciences",
];

export const STEM_PLUS_MED: FieldGroup[] = [...STEM, "medicine", "health", "nursing"];

export const PREFERRED_EMPLOYMENT: FieldGroup[] = [
  ...STEM_PLUS_MED,
  "law",
  "business",
  "social_work",
  "education",
  "nursing",
];

export const VERIFIED = "2026-08";
/** Fetch date for flagship records re-checked against official pages. */
export const FETCHED_FLAGSHIP = "2026-09-01";
/** Label when last year's published figure is kept because תשפ״ז is not on the official page. */
export const TASHPAZ_UNPUBLISHED = "סכום תשפ״ו; טרם פורסם לתשפ״ז";

export function allOf(...rules: Rule[]): Rule {
  return { op: "allOf", rules };
}

export function anyOf(...rules: Rule[]): Rule {
  return { op: "anyOf", rules };
}

export function not(rule: Rule, labelHe?: string): Rule {
  return { op: "not", rule, labelHe };
}

/** First-year excellence proxy. Faculty cutoffs vary — unknown if no admission scores. */
export function admissionExcellence(opts?: { bagrut?: number; psychometric?: number; sechem?: number }): Rule {
  return {
    op: "anyOf",
    labelHe: "נתוני קבלה גבוהים (בגרות / פסיכומטרי / סכם) — הסף המדויק לפי פקולטה",
    rules: [
      { type: "minBagrut", value: opts?.bagrut ?? 90 },
      { type: "minPsychometric", value: opts?.psychometric ?? 650 },
      { type: "minSechem", value: opts?.sechem ?? 650 },
    ],
  };
}

export function amount(
  textHe: string,
  opts?: { min?: number | null; max?: number | null; uncertain?: boolean },
): Amount {
  return {
    minIls: opts?.min ?? null,
    maxIls: opts?.max ?? null,
    textHe,
    uncertain: opts?.uncertain ?? false,
  };
}

export function deadline(
  textHe: string,
  opts?: {
    date?: string;
    kind?: Deadline["kind"];
    uncertain?: boolean;
    windowHe?: string;
    opensAt?: string;
  },
): Deadline {
  return {
    kind: opts?.kind ?? (opts?.date ? "fixed" : "annual_window"),
    date: opts?.date,
    opensAt: opts?.opensAt,
    windowHe: opts?.windowHe,
    textHe,
    uncertain: opts?.uncertain ?? false,
  };
}

export function collectInstitutionIn(rule: Rule): string[] {
  if ("type" in rule) {
    return rule.type === "institutionIn" ? [...rule.values] : [];
  }
  if (rule.op === "not") return collectInstitutionIn(rule.rule);
  return rule.rules.flatMap(collectInstitutionIn);
}

export const CHECK_ANNUALLY = deadline("משתנה / יש לבדוק מדי שנה באתר המלגה", {
  kind: "varies",
  uncertain: true,
});

export const DOCS_BASIC = ["צילום תעודת זהות כולל ספח", "אישור לימודים רשמי מהמוסד"];
export const DOCS_INCOME = [
  "תלושי שכר עדכניים (של הסטודנט ו/או ההורים, לפי הנחיות הקרן)",
  "שומת מס / אישור הכנסות",
];
export const DOCS_BANK = ["אישור בעלות על חשבון בנק"];
export const DOCS_SERVICE = ["תעודת שחרור / אישור שירות לאומי או אזרחי"];

function isSinglePredicateRule(rule: Rule): boolean {
  if ("type" in rule) return true;
  if (rule.op === "allOf" && rule.rules.length === 1 && "type" in rule.rules[0]) return true;
  return false;
}

export function s(entry: Scholarship): Scholarship {
  const sourceLevel = entry.sourceLevel ?? bestSourceLevel(entry.sourceUrls);
  const thin =
    !entry.treatment &&
    isSinglePredicateRule(entry.eligibility) &&
    !!entry.amounts.uncertain &&
    (!!entry.deadline.uncertain || entry.deadline.kind === "varies");
  return {
    ...entry,
    officialSource: entry.officialSource ?? hasOfficialSource(entry.sourceUrls),
    sourceLevel,
    treatment: thin ? "checkAtInstitution" : entry.treatment,
  };
}

/** Dean / external-link skeleton: never auto-eligible. */
export function deanCheck(opts: {
  id: string;
  institutionId: string;
  nameHe: string;
  funderHe: string;
  applyUrl: string;
  sourceUrls?: string[];
  whoItsForHe: string;
}): Scholarship {
  return s({
    id: opts.id,
    nameHe: opts.nameHe,
    funderHe: opts.funderHe,
    types: ["need"],
    scope: "institution",
    amounts: amount("משתנה לפי ועדת דיקן; סכום לא אומת כמספר אחיד", { uncertain: true }),
    cadence: "annual",
    deadline: CHECK_ANNUALLY,
    whoItsForHe: opts.whoItsForHe,
    documentsHe: [...DOCS_BASIC, ...DOCS_INCOME],
    howToApplyHe: "דיקן הסטודנטים / מדור מלגות באתר המוסד. זו רשומת «בדקו במוסד» — לא זכאות אוטומטית.",
    applyUrl: opts.applyUrl,
    lastVerified: VERIFIED,
    sourceUrls: opts.sourceUrls ?? [opts.applyUrl],
    institutionIds: [opts.institutionId],
    treatment: "checkAtInstitution",
    eligibility: allOf({ type: "institutionIn", values: [opts.institutionId] }),
  });
}

/** Institutions commonly treated as national-priority / periphery campuses for MOD "yeud 44". */
export const PERIPHERY_STUDY_INSTITUTIONS = [
  "bgu",
  "telhai",
  "sapir",
  "kinneret",
  "sce",
  "zefat",
  "wgalil",
  "achva",
  "braude",
  "ashkelon",
  "ariel",
  "ohalo",
  "yvc",
  "kaye",
  "huji",
  "bezalel",
  "azrieli",
  "hadassah",
  "jca",
  "david_yellin",
];
