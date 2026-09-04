import type { ProfileField, ScholarshipMatch, StudentProfile } from "./types";
import { deadlineSortValue, deadlineStatus } from "./format";
import { HIGH_IMPACT_FIELDS, isProfileFieldFilled } from "./profile-fields";

const ACTIONABLE_BUCKETS = new Set([
  "eligible",
  "needInfo",
  "nearMiss",
  "checkAtInstitution",
]);

export function isActionableMatch(match: ScholarshipMatch): boolean {
  return ACTIONABLE_BUCKETS.has(match.bucket);
}

/** Fields whose fill would move the most «חסר פרט» cards; high-impact first when tied. */
export function missingFieldUnlocks(
  matches: ScholarshipMatch[],
  profile?: StudentProfile,
): { field: ProfileField; count: number }[] {
  const counts = new Map<ProfileField, number>();
  for (const m of matches) {
    if (m.bucket !== "needInfo") continue;
    const seen = new Set<ProfileField>();
    for (const c of m.unknown) {
      if (!c.field || seen.has(c.field)) continue;
      if (profile && isProfileFieldFilled(profile, c.field)) continue;
      seen.add(c.field);
      counts.set(c.field, (counts.get(c.field) ?? 0) + 1);
    }
  }
  const entries = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    const ai = HIGH_IMPACT_FIELDS.indexOf(a[0]);
    const bi = HIGH_IMPACT_FIELDS.indexOf(b[0]);
    const aHigh = ai === -1 ? 99 : ai;
    const bHigh = bi === -1 ? 99 : bi;
    return aHigh - bHigh;
  });
  return entries.map(([field, count]) => ({ field, count }));
}

/**
 * Up to `limit` actionable matches with a published date that is currently
 * open or closing soon, soonest deadline first. Closed / not-yet-open / ineligible excluded.
 */
export function mostUrgentOpen(
  matches: ScholarshipMatch[],
  asOf: Date,
  limit = 3,
): ScholarshipMatch[] {
  return matches
    .filter((m) => isActionableMatch(m))
    .filter((m) => {
      const kind = deadlineStatus(m.scholarship.deadline, asOf).kind;
      return (kind === "open" || kind === "closingSoon") && !!m.scholarship.deadline.date;
    })
    .sort(
      (a, b) =>
        deadlineSortValue(a.scholarship.deadline, asOf) -
        deadlineSortValue(b.scholarship.deadline, asOf),
    )
    .slice(0, limit);
}

const MIN_AMOUNTS_FOR_PARTIAL_SUM = 3;

/** Sum known maxIls only. Skip rather than show a misleading total. */
export function partialKnownAmountSum(
  matches: ScholarshipMatch[],
): { sum: number; counted: number } | null {
  const pool = matches.filter((m) => m.bucket === "eligible" || m.bucket === "needInfo");
  const numbered = pool.filter(
    (m) =>
      m.scholarship.amounts.maxIls != null &&
      m.scholarship.amounts.maxIls > 0 &&
      !m.scholarship.amounts.uncertain,
  );
  if (numbered.length < MIN_AMOUNTS_FOR_PARTIAL_SUM) return null;
  const sum = numbered.reduce((s, m) => s + (m.scholarship.amounts.maxIls as number), 0);
  return { sum, counted: numbered.length };
}
