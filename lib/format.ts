import type { Amount, Deadline, ScholarshipMatch, ScholarshipScope } from "./types";

export function formatIls(n: number): string {
  return `${n.toLocaleString("he-IL")} ₪`;
}

export function formatAmount(amount: Amount): string {
  return amount.textHe;
}

export function formatDeadline(deadline: Deadline): string {
  if (deadline.windowHe) {
    return `${deadline.textHe} (${deadline.windowHe})`;
  }
  return deadline.textHe;
}

export type DeadlineStatusKind =
  | "open"
  | "closed"
  | "closingSoon"
  | "unpublished"
  | "rolling"
  | "notYetOpen";

export type DeadlineStatus = {
  kind: DeadlineStatusKind;
  daysLeft?: number;
  labelHe: string;
};

const MS_PER_DAY = 86_400_000;
const CLOSING_SOON_DAYS = 14;
const ISRAEL_TZ = "Asia/Jerusalem";

/** Calendar YYYY-MM-DD in Asia/Jerusalem for an instant. */
export function israelYmd(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ISRAEL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function daysUntilIsoDate(isoDate: string, asOf: Date): number {
  const today = israelYmd(asOf);
  const dueMs = Date.parse(`${isoDate}T12:00:00Z`);
  const todayMs = Date.parse(`${today}T12:00:00Z`);
  return Math.round((dueMs - todayMs) / MS_PER_DAY);
}

export function deadlineStatus(deadline: Deadline, asOf: Date = new Date()): DeadlineStatus {
  if (deadline.kind === "rolling") {
    return { kind: "rolling", labelHe: "הגשה שוטפת" };
  }

  if (deadline.opensAt) {
    const untilOpen = daysUntilIsoDate(deadline.opensAt, asOf);
    if (untilOpen > 0) {
      return {
        kind: "notYetOpen",
        daysLeft: untilOpen,
        labelHe: untilOpen === 1 ? "נפתחת מחר" : `נפתחת בעוד ${untilOpen} ימים`,
      };
    }
  }

  if (deadline.date) {
    const daysLeft = daysUntilIsoDate(deadline.date, asOf);
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

export function amountSortValue(amount: Amount): number | null {
  const n = amount.maxIls ?? amount.minIls;
  return n == null ? null : n;
}

/** Finite sentinels — never Infinity-n, which collapses to Infinity. */
const SORT_ROLLING = 8_000_000_000_000;
const SORT_UNPUBLISHED = 8_500_000_000_000;
const SORT_CLOSED = 9_000_000_000_000;

/**
 * Active items: soonest upcoming first. Closed/past dates sort last so they
 * never float to the top of an active list.
 */
export function deadlineSortValue(deadline: Deadline, asOf: Date = new Date()): number {
  const status = deadlineStatus(deadline, asOf);
  if (status.kind === "closed") {
    const past = deadline.date ? Date.parse(`${deadline.date}T12:00:00Z`) : 0;
    return SORT_CLOSED + past;
  }
  if (status.kind === "notYetOpen" && deadline.opensAt) {
    return Date.parse(`${deadline.opensAt}T12:00:00Z`);
  }
  if (deadline.date) return Date.parse(`${deadline.date}T12:00:00Z`);
  if (status.kind === "rolling") return SORT_ROLLING;
  return SORT_UNPUBLISHED;
}

export function countLabel(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

export function scopeLabelHe(scope: ScholarshipScope): string {
  switch (scope) {
    case "national":
      return "ארצי";
    case "institution":
      return "מוסדי";
    case "municipal":
      return "עירוני";
    case "regional":
      return "אזורי";
  }
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
