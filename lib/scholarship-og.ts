import type { Scholarship } from "./types";
import { amountHeadlineHe, formatHebrewLongDate } from "./format";

export function scholarshipDeadlineOgHe(s: Pick<Scholarship, "deadline">): string {
  return s.deadline.date ? formatHebrewLongDate(s.deadline.date) : "לא ודאי";
}

/** Unique share/OG copy from published amount + known deadline only. */
export function scholarshipOgCopy(s: Scholarship): { title: string; description: string } {
  const amountHe = amountHeadlineHe(s.amounts);
  const deadlineHe = scholarshipDeadlineOgHe(s);
  const title = `${s.nameHe} — ${s.funderHe} — ${amountHe} · ${deadlineHe}`;
  const who = s.whoItsForHe.trim();
  const description = [amountHe, `מועד: ${deadlineHe}`, who || null]
    .filter(Boolean)
    .join(". ")
    .slice(0, 200);
  return { title, description };
}
