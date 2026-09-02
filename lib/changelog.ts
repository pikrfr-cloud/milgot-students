import { daysSinceVerified } from "./format";
import type { Scholarship } from "./types";

export const CHANGELOG_WEEK_DAYS = 7;

export type CatalogUpdateGroup = {
  lastVerified: string;
  scholarships: Scholarship[];
};

export function thisWeekUpdates(
  scholarships: Scholarship[],
  asOf: Date,
): Scholarship[] {
  return scholarships
    .filter((s) => {
      const age = daysSinceVerified(s.lastVerified, asOf);
      return age != null && age >= 0 && age <= CHANGELOG_WEEK_DAYS;
    })
    .sort((a, b) => b.lastVerified.localeCompare(a.lastVerified) || a.nameHe.localeCompare(b.nameHe, "he"));
}

export function groupByLastVerified(scholarships: Scholarship[]): CatalogUpdateGroup[] {
  const map = new Map<string, Scholarship[]>();
  for (const s of scholarships) {
    const list = map.get(s.lastVerified) ?? [];
    list.push(s);
    map.set(s.lastVerified, list);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([lastVerified, list]) => ({
      lastVerified,
      scholarships: list.sort((a, b) => a.nameHe.localeCompare(b.nameHe, "he")),
    }));
}
