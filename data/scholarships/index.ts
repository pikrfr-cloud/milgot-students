import { TIPS } from "@/data/tips";
import type { Scholarship } from "@/lib/types";
import { NATIONAL } from "./national";
import { UNIVERSITIES } from "./universities";
import { COLLEGES } from "./colleges";
import { MUNICIPAL } from "./municipal";
import { FOUNDATIONS } from "./foundations";

export const SCHOLARSHIPS: Scholarship[] = [
  ...NATIONAL,
  ...UNIVERSITIES,
  ...COLLEGES,
  ...MUNICIPAL,
  ...FOUNDATIONS,
];

export { TIPS };

export function getScholarshipById(id: string): Scholarship | undefined {
  return SCHOLARSHIPS.find((s) => s.id === id);
}

export const CATALOG_STATS = {
  total: SCHOLARSHIPS.length,
  tips: TIPS.length,
  lastVerifiedMonth: "2026-08",
};

