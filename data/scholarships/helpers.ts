import type { Amount, Deadline, FieldGroup, Rule, Scholarship } from "@/lib/types";

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

export function allOf(...rules: Rule[]): Rule {
  return { op: "allOf", rules };
}

export function anyOf(...rules: Rule[]): Rule {
  return { op: "anyOf", rules };
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
  opts?: { date?: string; kind?: Deadline["kind"]; uncertain?: boolean; windowHe?: string },
): Deadline {
  return {
    kind: opts?.kind ?? (opts?.date ? "fixed" : "annual_window"),
    date: opts?.date,
    windowHe: opts?.windowHe,
    textHe,
    uncertain: opts?.uncertain ?? false,
  };
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

export function s(entry: Scholarship): Scholarship {
  return entry;
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
