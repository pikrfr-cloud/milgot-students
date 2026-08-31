import type { Amount, Deadline, ScholarshipMatch } from "./types";

export function formatIls(n: number): string {
  return `${n.toLocaleString("he-IL")} ₪`;
}

export function formatAmount(amount: Amount): string {
  return amount.textHe;
}

export function formatDeadline(deadline: Deadline): string {
  return deadline.textHe;
}

export function amountSortValue(amount: Amount): number {
  return amount.maxIls ?? amount.minIls ?? 0;
}

export function deadlineSortValue(deadline: Deadline): number {
  if (deadline.date) return new Date(deadline.date).getTime();
  if (deadline.kind === "rolling") return Number.POSITIVE_INFINITY - 1;
  return Number.POSITIVE_INFINITY;
}

export function countLabel(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

export function matchHeadline(match: ScholarshipMatch): string {
  switch (match.bucket) {
    case "eligible":
      return "עומד/ת בתנאי הסף שבקטלוג";
    case "needInfo":
      return "חסר פרט לאישור";
    case "nearMiss":
      return `כמעט זכאי/ת — פער ב־${match.failed.length} קריטריונים`;
    default:
      return "לא עומד/ת בתנאים שבקטלוג";
  }
}
