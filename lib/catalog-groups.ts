import { MATCHABLE_SCHOLARSHIPS } from "@/data/scholarships";
import { uniqueMatchableCount } from "./catalog";
import { requiresVolunteering } from "./card-chips";
import { walkPredicates } from "./rule-walk";
import type { Scholarship } from "./types";

export const SEARCH_GROUP_IDS = ["without-volunteering", "miluim", "periphery"] as const;
export type SearchGroupId = (typeof SEARCH_GROUP_IDS)[number];

export const SEARCH_GROUP_LABEL_HE: Record<SearchGroupId, string> = {
  "without-volunteering": "בלי התנדבות",
  miluim: "מילואים",
  periphery: "פריפריה",
};

export function groupCollectionPath(id: string): string {
  return `/catalog/group/${id}/`;
}

export function isSearchGroupId(id: string): id is SearchGroupId {
  return (SEARCH_GROUP_IDS as readonly string[]).includes(id);
}

/** Reserved-duty funds — name or a reservist-days rule, not every service mention. */
export function isMiluimScholarship(s: Scholarship): boolean {
  let reservist = false;
  walkPredicates(s.eligibility, (pred) => {
    if (pred.type === "reservistDaysMin") reservist = true;
  });
  if (reservist) return true;
  return /מילוא/.test(s.nameHe);
}

/** Periphery / national-priority by type or eligibility — not campus lists that swallow HUJI. */
export function isPeripheryScholarship(s: Scholarship): boolean {
  if (s.types.includes("periphery")) return true;
  let found = false;
  walkPredicates(s.eligibility, (pred) => {
    if (pred.type === "periphery" || pred.type === "nationalPriority") found = true;
  });
  return found;
}

export function scholarshipsForGroup(
  id: SearchGroupId,
  list: Scholarship[] = MATCHABLE_SCHOLARSHIPS,
): Scholarship[] {
  switch (id) {
    case "without-volunteering":
      return list.filter((s) => !requiresVolunteering(s));
    case "miluim":
      return list.filter(isMiluimScholarship);
    case "periphery":
      return list.filter(isPeripheryScholarship);
  }
}

export type SearchGroupChip = {
  id: SearchGroupId;
  labelHe: string;
  href: string;
  count: number;
};

export function searchGroupsWithCounts(
  list: Scholarship[] = MATCHABLE_SCHOLARSHIPS,
): SearchGroupChip[] {
  return SEARCH_GROUP_IDS.map((id) => ({
    id,
    labelHe: SEARCH_GROUP_LABEL_HE[id],
    href: groupCollectionPath(id),
    count: uniqueMatchableCount(scholarshipsForGroup(id, list)),
  })).filter((g) => g.count > 0);
}

export function groupStaticParams(list: Scholarship[] = MATCHABLE_SCHOLARSHIPS): { id: string }[] {
  return searchGroupsWithCounts(list).map((g) => ({ id: g.id }));
}
