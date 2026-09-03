import type { Scholarship, ScholarshipMatch } from "./types";
import { deadlineStatus, daysUntilIsoDate } from "./format";

const OPEN_KINDS = new Set(["open", "closingSoon", "rolling"]);

export function isOpenForSubmission(
  scholarship: Pick<Scholarship, "deadline">,
  asOf: Date,
): boolean {
  return OPEN_KINDS.has(deadlineStatus(scholarship.deadline, asOf).kind);
}

function hasNumberedMax(s: Scholarship): boolean {
  return s.amounts.maxIls != null && s.amounts.maxIls > 0;
}

function conflictsWith(a: Scholarship, b: Scholarship): boolean {
  return (
    (a.excludes ?? []).includes(b.id) || (b.excludes ?? []).includes(a.id)
  );
}

/** Keep the higher maxIls when two open matches exclude each other. */
export function dropMutexDuplicates(matches: ScholarshipMatch[]): ScholarshipMatch[] {
  const sorted = [...matches].sort(
    (a, b) => (b.scholarship.amounts.maxIls ?? 0) - (a.scholarship.amounts.maxIls ?? 0),
  );
  const kept: ScholarshipMatch[] = [];
  for (const m of sorted) {
    if (kept.some((k) => conflictsWith(m.scholarship, k.scholarship))) continue;
    kept.push(m);
  }
  return kept;
}

export function openEligibleNeedInfo(
  matches: ScholarshipMatch[],
  asOf: Date,
): ScholarshipMatch[] {
  return matches.filter(
    (m) =>
      (m.bucket === "eligible" || m.bucket === "needInfo") &&
      isOpenForSubmission(m.scholarship, asOf),
  );
}

export type PotentialOpenAmount = {
  /** Null when no numbered maxIls remain — never invent 0 as a total. */
  sumIls: number | null;
  counted: number;
  openCount: number;
  missingAmountCount: number;
  mutexDroppedCount: number;
};

/**
 * Sum `amounts.maxIls` on eligible + needInfo scholarships that are currently open.
 * Missing amounts are excluded (not treated as 0). Mutex `excludes` are not double-counted.
 */
export function potentialOpenAmount(
  matches: ScholarshipMatch[],
  asOf: Date,
): PotentialOpenAmount {
  const open = openEligibleNeedInfo(matches, asOf);
  const numbered = open.filter((m) => hasNumberedMax(m.scholarship));
  const selected = dropMutexDuplicates(numbered);
  const sum = selected.reduce((acc, m) => acc + (m.scholarship.amounts.maxIls as number), 0);
  return {
    sumIls: selected.length ? sum : null,
    counted: selected.length,
    openCount: open.length,
    missingAmountCount: open.length - numbered.length,
    mutexDroppedCount: numbered.length - selected.length,
  };
}

export function matchingNowHeadlineHe(eligibleCount: number): string {
  if (eligibleCount <= 0) return "אין כרגע מלגות שמתאימות לפי מה שמילאתם";
  if (eligibleCount === 1) return "מלגה אחת שמתאימה עכשיו";
  return `${eligibleCount} מלגות שמתאימות עכשיו`;
}

export const NO_DOUBLE_COUNT_CAVEAT_HE =
  "כל מלגה מציגה את הסכום שפורסם אצלה. אי אפשר לקבל את כולן ביחד.";

export const TIMELINE_WINDOW_DAYS = 60;

export function upcomingCloseDates(
  matches: ScholarshipMatch[],
  asOf: Date,
  withinDays = TIMELINE_WINDOW_DAYS,
): ScholarshipMatch[] {
  const actionable = new Set(["eligible", "needInfo", "nearMiss", "checkAtInstitution"]);
  return matches
    .filter((m) => actionable.has(m.bucket))
    .filter((m) => {
      const date = m.scholarship.deadline.date;
      if (!date) return false;
      const days = daysUntilIsoDate(date, asOf);
      return days >= 0 && days <= withinDays;
    })
    .sort(
      (a, b) =>
        daysUntilIsoDate(a.scholarship.deadline.date as string, asOf) -
        daysUntilIsoDate(b.scholarship.deadline.date as string, asOf),
    );
}

export type UnifiedDocument = {
  documentHe: string;
  count: number;
  scholarshipIds: string[];
};

/** Aggregate existing `documentsHe` only — do not invent documents. */
export function unifiedDocuments(matches: ScholarshipMatch[]): UnifiedDocument[] {
  const pool = matches.filter((m) =>
    ["eligible", "needInfo", "nearMiss"].includes(m.bucket),
  );
  const map = new Map<string, UnifiedDocument>();
  for (const m of pool) {
    const seen = new Set<string>();
    for (const doc of m.scholarship.documentsHe) {
      const key = doc.trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const cur = map.get(key) ?? { documentHe: key, count: 0, scholarshipIds: [] };
      cur.count += 1;
      cur.scholarshipIds.push(m.scholarship.id);
      map.set(key, cur);
    }
  }
  return [...map.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.documentHe.localeCompare(b.documentHe, "he");
  });
}
