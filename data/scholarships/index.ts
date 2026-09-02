import { TIPS } from "@/data/tips";
import type { Scholarship } from "@/lib/types";
import {
  isGuideRecord,
  isMatchableScholarship,
  maxLastVerified,
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
  ...VERIFIED_EXTRA,
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

export const CATALOG_STATS = {
  /** Real matchable scholarships only — not dean/authority מדריך shells. */
  total: MATCHABLE_SCHOLARSHIPS.length,
  guide: GUIDE_SCHOLARSHIPS.length,
  records: SCHOLARSHIPS.length,
  tips: TIPS.length,
  lastVerifiedMonth: maxLastVerified(SCHOLARSHIPS),
};

/** Shared legal-page date — derived from catalog max lastVerified, not a hardcoded string. */
export const LEGAL_UPDATED_HE = formatHebrewLongDate(CATALOG_STATS.lastVerifiedMonth);
