import type { Amount, Deadline, ScholarshipMatch, ScholarshipScope } from "./types";

export function formatIls(n: number): string {
  return `${n.toLocaleString("he-IL")} ₪`;
}

export function formatAmount(amount: Amount): string {
  return amount.textHe;
}

export function formatDeadline(deadline: Deadline): string {
  return deadline.textHe;
}

export type DeadlineStatusKind = "open" | "closed" | "closingSoon" | "unpublished" | "rolling";

export type DeadlineStatus = {
  kind: DeadlineStatusKind;
  daysLeft?: number;
  labelHe: string;
};

const MS_PER_DAY = 86_400_000;
const CLOSING_SOON_DAYS = 14;

function startOfDay(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function deadlineStatus(deadline: Deadline, asOf: Date = new Date()): DeadlineStatus {
  if (deadline.kind === "rolling") {
    return { kind: "rolling", labelHe: "הגשה שוטפת" };
  }

  if (deadline.date) {
    const due = startOfDay(new Date(`${deadline.date}T00:00:00Z`));
    const today = startOfDay(asOf);
    const daysLeft = Math.round((due - today) / MS_PER_DAY);
    if (daysLeft < 0) {
      return { kind: "closed", daysLeft, labelHe: "ההרשמה נסגרה" };
    }
    if (daysLeft === 0) {
      return { kind: "closingSoon", daysLeft: 0, labelHe: "נסגרת היום" };
    }
    if (daysLeft <= CLOSING_SOON_DAYS) {
      return {
        kind: "closingSoon",
        daysLeft,
        labelHe: daysLeft === 1 ? "נסגרת מחר" : `נסגרת בעוד ${daysLeft} ימים`,
      };
    }
    return { kind: "open", daysLeft, labelHe: "פתוח להגשה" };
  }

  if (deadline.kind === "varies" || deadline.uncertain || !deadline.date) {
    return { kind: "unpublished", labelHe: "מועד טרם פורסם" };
  }

  return { kind: "unpublished", labelHe: "מועד טרם פורסם" };
}

export function isDeadlineClosed(deadline: Deadline, asOf: Date = new Date()): boolean {
  return deadlineStatus(deadline, asOf).kind === "closed";
}

export function amountSortValue(amount: Amount): number {
  return amount.maxIls ?? amount.minIls ?? 0;
}

/**
 * Active items: soonest upcoming first. Closed/past dates sort last so they
 * never float to the top of an active list.
 */
export function deadlineSortValue(deadline: Deadline, asOf: Date = new Date()): number {
  const status = deadlineStatus(deadline, asOf);
  if (status.kind === "closed") return Number.POSITIVE_INFINITY - 5;
  if (deadline.date) return new Date(`${deadline.date}T00:00:00Z`).getTime();
  if (status.kind === "rolling") return Number.POSITIVE_INFINITY - 20;
  return Number.POSITIVE_INFINITY - 10;
}

export function countLabel(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

const SCOPE_HE: Record<ScholarshipScope, string> = {
  national: "ארצי",
  institution: "מוסדי",
  municipal: "עירוני",
  regional: "אזורי",
};

export function scopeLabelHe(scope: ScholarshipScope): string {
  return SCOPE_HE[scope] ?? scope;
}

export function matchHeadline(match: ScholarshipMatch): string {
  if (match.bucket === "closedCycle") {
    return "נסגר למחזור זה — מתאים למחזור הבא";
  }
  const treatment = match.scholarship.treatment;
  if (treatment === "scoreBased" && (match.bucket === "needInfo" || match.bucket === "eligible")) {
    return "סיכוי לפי ניקוד — לא זכאות אוטומטית";
  }
  if (
    (treatment === "checkAtInstitution" || treatment === "checkAtAuthority") &&
    match.bucket === "needInfo"
  ) {
    return treatment === "checkAtAuthority"
      ? "יש לבדוק ברשות המוסמכת — אין זכאות אוטומטית מהפרופיל"
      : "יש לבדוק בדיקן / ברשות המקומית — אין תנאי סף מאומת בקטלוג";
  }
  switch (match.bucket) {
    case "eligible":
      return "עומד/ת בתנאי הסף שבקטלוג";
    case "needInfo":
      return "חסר פרט לאישור";
    case "nearMiss":
      return `כמעט זכאי/ת — פער ב־${match.eval.failCount} קריטריונים`;
    default:
      return "לא עומד/ת בתנאים שבקטלוג";
  }
}
