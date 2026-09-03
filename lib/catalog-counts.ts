import {
  isGuideRecord,
  maxLastVerified,
  uniqueMatchableCount,
} from "@/lib/catalog";
import type { Scholarship } from "@/lib/types";

export type CatalogCounts = {
  /** Unique matchable scholarships by applyUrl — the only student-facing headline. */
  matchable: number;
  guide: number;
  tips: number;
  lastVerifiedMonth: string;
};

export function computeCatalogCounts(list: Scholarship[], tips: Scholarship[]): CatalogCounts {
  return {
    matchable: uniqueMatchableCount(list),
    guide: list.filter(isGuideRecord).length,
    tips: tips.length,
    lastVerifiedMonth: maxLastVerified(list),
  };
}

export function studentCountsLine(c: Pick<CatalogCounts, "matchable" | "guide">): string {
  return `${c.matchable} מלגות`;
}

export function studentCountsLineFull(c: Pick<CatalogCounts, "matchable" | "guide">): string {
  return `${c.matchable} מלגות · ${c.guide} לבדיקה במוסד`;
}
