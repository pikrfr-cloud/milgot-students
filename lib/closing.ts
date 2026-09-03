import type { Scholarship } from "./types";
import { daysUntilIsoDate } from "./format";

export const CLOSING_WINDOW_DAYS = 30;

/** Known close date = ISO `deadline.date`. Missing date is excluded, never invented. */
export function hasKnownCloseDate(s: Pick<Scholarship, "deadline">): boolean {
  return Boolean(s.deadline.date);
}

export function isClosingWithinDays(
  s: Pick<Scholarship, "deadline">,
  asOf: Date,
  withinDays = CLOSING_WINDOW_DAYS,
): boolean {
  const date = s.deadline.date;
  if (!date) return false;
  const days = daysUntilIsoDate(date, asOf);
  return days >= 0 && days <= withinDays;
}

/** Scholarships with a known close date in the next `withinDays` days, soonest first. */
export function scholarshipsClosingSoon(
  list: readonly Scholarship[],
  asOf: Date,
  withinDays = CLOSING_WINDOW_DAYS,
): Scholarship[] {
  return list
    .filter((s) => isClosingWithinDays(s, asOf, withinDays))
    .sort((a, b) => {
      const da = a.deadline.date as string;
      const db = b.deadline.date as string;
      if (da !== db) return da.localeCompare(db);
      return a.nameHe.localeCompare(b.nameHe, "he");
    });
}
