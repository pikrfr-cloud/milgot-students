import { TIPS } from "@/data/tips";
import type { Scholarship } from "@/lib/types";
import {
  isGuideRecord,
  isMatchableScholarship,
  maxLastVerified,
  uniqueApplyUrlNoteHe,
  uniqueMatchableCount,
} from "@/lib/catalog";
import { formatHebrewLongDate } from "@/lib/format";
import { NATIONAL } from "./national";
import { UNIVERSITIES } from "./universities";
import { COLLEGES } from "./colleges";
import { MUNICIPAL } from "./municipal";
import { FOUNDATIONS } from "./foundations";
import { VERIFIED_EXTRA } from "./verified-extra";
import { VERIFIED_EXTRA_2 } from "./verified-extra-2";
import { VERIFIED_EXTRA_3 } from "./verified-extra-3";

export const SCHOLARSHIPS: Scholarship[] = [
  ...NATIONAL,
  ...UNIVERSITIES,
  ...COLLEGES,
  ...MUNICIPAL,
  ...FOUNDATIONS,
  // #15 already registered tau-liber-phd in universities.ts (same official PDF).
  ...VERIFIED_EXTRA.filter((s) => s.id !== "tau-liber-phd"),
  ...VERIFIED_EXTRA_2,
  ...VERIFIED_EXTRA_3,
];

export { VERIFIED_EXTRA };
export { VERIFIED_EXTRA_2 };
export { VERIFIED_EXTRA_3 };

export { TIPS };

export const MATCHABLE_SCHOLARSHIPS = SCHOLARSHIPS.filter(isMatchableScholarship);
export const GUIDE_SCHOLARSHIPS = SCHOLARSHIPS.filter(isGuideRecord);

export function getScholarshipById(id: string): Scholarship | undefined {
  return SCHOLARSHIPS.find((s) => s.id === id);
}

const matchableUnique = uniqueMatchableCount(MATCHABLE_SCHOLARSHIPS);

export const CATALOG_STATS = {
  /** Unique matchable scholarships by applyUrl — the headline «מלגות להתאמה». */
  total: matchableUnique,
  /** Matchable rows in the list, including declared applyUrl duplicates. */
  matchableRows: MATCHABLE_SCHOLARSHIPS.length,
  guide: GUIDE_SCHOLARSHIPS.length,
  records: SCHOLARSHIPS.length,
  tips: TIPS.length,
  lastVerifiedMonth: maxLastVerified(SCHOLARSHIPS),
  /** Present only when the list is larger than the unique headline. */
  uniqueApplyUrlNote: uniqueApplyUrlNoteHe(MATCHABLE_SCHOLARSHIPS.length, matchableUnique),
};

/** Shared legal-page date — derived from catalog max lastVerified, not a hardcoded string. */
export const LEGAL_UPDATED_HE = formatHebrewLongDate(CATALOG_STATS.lastVerifiedMonth);
