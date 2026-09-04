import type { Amount, Deadline, ScholarshipMatch, ScholarshipScope } from "./types";

export function formatIls(n: number): string {
  return `${n.toLocaleString("he-IL")} ₪`;
}

export function formatAmount(amount: Amount): string {
  return amount.textHe;
}

export type AmountDisplay = {
  /** Number-first line for cards, e.g. «עד 12,480 ₪». */
  headlineHe: string;
  /** Short optional caveat — never the kitchen paragraph. */
  noteHe?: string;
};

/** Student-facing amount: a number first, long `textHe` stays in verification notes. */
export function amountDisplay(amount: Amount): AmountDisplay {
  const min = amount.minIls;
  const max = amount.maxIls;
  const hasMin = typeof min === "number" && min > 0;
  const hasMax = typeof max === "number" && max > 0;

  let headlineHe: string;
  if (hasMin && hasMax && min === max) {
    headlineHe = formatIls(min);
  } else if (hasMax) {
    headlineHe = `עד ${formatIls(max)}`;
  } else if (hasMin) {
    headlineHe = `מ־${formatIls(min)}`;
  } else {
    const short = amount.textHe.trim();
    headlineHe = short.length <= 28 ? short : "סכום משתנה";
  }

  const noteHe =
    (hasMin || hasMax) && amount.uncertain ? "סכום לא ודאי — יש לאמת במקור" : undefined;
  return { headlineHe, noteHe };
}

export function amountHeadlineHe(amount: Amount): string {
  return amountDisplay(amount).headlineHe;
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

export function daysUntilIsoDate(isoDate: string, asOf: Date): number {
  const today = israelYmd(asOf);
  const dueMs = Date.parse(`${isoDate}T12:00:00Z`);
  const todayMs = Date.parse(`${today}T12:00:00Z`);
  return Math.round((dueMs - todayMs) / MS_PER_DAY);
}

/** Normalize lastVerified (`YYYY-MM` or `YYYY-MM-DD`) to a calendar day. */
export function verifiedIsoDate(lastVerified: string): string | null {
  if (/^\d{4}-\d{2}$/.test(lastVerified)) return `${lastVerified}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(lastVerified)) return lastVerified;
  return null;
}

export function daysSinceVerified(lastVerified: string, asOf: Date = new Date()): number | null {
  const iso = verifiedIsoDate(lastVerified);
  if (!iso) return null;
  return -daysUntilIsoDate(iso, asOf);
}

export const RECORD_STALE_DAYS = 90;
export const STALE_VERIFICATION_LABEL_HE = "לא אומת לאחרונה";

export function isVerificationStale(
  lastVerified: string,
  asOf: Date = new Date(),
  days = RECORD_STALE_DAYS,
): boolean {
  const age = daysSinceVerified(lastVerified, asOf);
  return age != null && age > days;
}

/**
 * Public deadline chip. Stale records must not be labeled «פתוח להגשה».
 * Closing-soon / closed / rolling labels are unchanged.
 */
export function publicDeadlineLabelHe(
  deadline: Deadline,
  lastVerified: string,
  asOf: Date = new Date(),
): string {
  const status = deadlineStatus(deadline, asOf);
  if (isVerificationStale(lastVerified, asOf) && status.kind === "open") {
    return deadline.date ? `מועד מפורסם: ${deadline.date}` : formatDeadline(deadline);
  }
  return status.labelHe;
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

const CATALOG_STALE_DAYS = 60;

/** Quiet banner when catalog lastVerified (YYYY-MM or YYYY-MM-DD) is older than 60 days. */
export function catalogAgeBanner(lastVerified: string, asOf: Date = new Date()): string | null {
  const iso = /^\d{4}-\d{2}$/.test(lastVerified) ? `${lastVerified}-01` : lastVerified;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const daysOld = -daysUntilIsoDate(iso, asOf);
  if (daysOld <= CATALOG_STALE_DAYS) return null;
  const months = Math.max(1, Math.round(daysOld / 30));
  return `המלגות עודכנו לפני ${months} חודשים`;
}

/** ICS is for a dated window that is currently open (or closing soon), not closed/not-yet-open. */
export function shouldHideIcs(deadline: Deadline, asOf: Date = new Date()): boolean {
  if (!deadline.date) return true;
  const kind = deadlineStatus(deadline, asOf).kind;
  return kind === "closed" || kind === "notYetOpen";
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

const HEBREW_MONTH_NAMES = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
] as const;

const HEBREW_MONTHS = HEBREW_MONTH_NAMES.map((name) => `ב${name}`);

/** `2026-09-01` or `2026-09` → `1 בספטמבר 2026`. */
export function whatsappScholarshipShareText(opts: {
  nameHe: string;
  amounts: Amount;
  deadline: Deadline;
}): string {
  const amountHe = amountHeadlineHe(opts.amounts);
  const closeHe = opts.deadline.date
    ? formatHebrewLongDate(opts.deadline.date)
    : "מועד טרם פורסם";
  return `מלגת ${opts.nameHe}, ${amountHe}, נסגרת ב-${closeHe}`;
}

export function whatsappShareHref(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function formatHebrewLongDate(iso: string): string {
  const dayIso = /^\d{4}-\d{2}$/.test(iso) ? `${iso}-01` : iso;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayIso);
  if (!m) return iso;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const monthHe = HEBREW_MONTHS[month - 1];
  if (!monthHe) return iso;
  return `${day} ${monthHe} ${year}`;
}

/** `2026-09` / `2026-09-02` → `ספטמבר 2026`. Invalid input → null. */
export function hebrewMonthYear(iso: string): string | null {
  const m = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(iso.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const monthHe = HEBREW_MONTH_NAMES[month - 1];
  if (!monthHe) return null;
  return `${monthHe} ${year}`;
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
    return "נסגר השנה — אפשר למחזור הבא";
  }
  if (match.bucket === "checkAtInstitution") {
    return "יש לבדוק במוסד/ברשות";
  }
  const treatment = match.scholarship.treatment;
  if (treatment === "scoreBased" && (match.bucket === "needInfo" || match.bucket === "eligible")) {
    return "תלוי בניקוד — לא מובטח";
  }
  if (treatment === "selective" && (match.bucket === "eligible" || match.bucket === "needInfo")) {
    return "מתאים לסף — יש מיון תחרותי";
  }
  switch (match.bucket) {
    case "eligible":
      return "מתאים לפי מה שמילאתם";
    case "needInfo":
      return "חסר פרט";
    case "nearMiss":
      return `כמעט מתאים — פער ב־${match.eval.failCount} דברים`;
    default: {
      const reason = primaryFailReasonHe(match);
      return reason ? `לא מתאים: ${reason}` : "לא מתאים לפי מה שמילאתם";
    }
  }
}

/** First failed leaf in Hebrew — never an internal id or raw household-size digit. */
export function primaryFailReasonHe(match: ScholarshipMatch): string | undefined {
  const leaf = match.failed.find((c) => !c.group && c.labelHe);
  if (!leaf) return undefined;
  const label = leaf.labelHe.trim();
  if (!label || /^\d+$/.test(label)) return undefined;
  return label;
}
