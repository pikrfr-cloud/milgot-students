import type { Scholarship } from "./types";
import { amountHeadlineHe, formatHebrewLongDate } from "./format";

export function scholarshipDeadlineOgHe(s: Pick<Scholarship, "deadline">): string {
  return s.deadline.date ? formatHebrewLongDate(s.deadline.date) : "לא ודאי";
}

/** True when the funder string is already a token inside the scholarship name. */
export function funderAlreadyInNameHe(nameHe: string, funderHe: string): boolean {
  const name = nameHe.trim();
  const funder = funderHe.trim();
  if (!funder) return true;
  return name.includes(funder);
}

function titleTail(s: Scholarship): string {
  return `${amountHeadlineHe(s.amounts)} · ${scholarshipDeadlineOgHe(s)}`;
}

/**
 * Unique share/OG copy from published amount + known deadline only.
 * Skip repeating funderHe when it already appears inside nameHe.
 */
export function scholarshipOgCopy(s: Scholarship): { title: string; description: string } {
  const amountHe = amountHeadlineHe(s.amounts);
  const deadlineHe = scholarshipDeadlineOgHe(s);
  const tail = titleTail(s);
  const title = funderAlreadyInNameHe(s.nameHe, s.funderHe)
    ? `${s.nameHe} — ${tail}`
    : `${s.nameHe} — ${s.funderHe} — ${tail}`;
  const who = s.whoItsForHe.trim();
  const description = [amountHe, `מועד: ${deadlineHe}`, who || null]
    .filter(Boolean)
    .join(". ")
    .slice(0, 200);
  return { title, description };
}
