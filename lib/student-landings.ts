import { uniqueMatchableCount } from "./catalog";
import { searchGroupsWithCounts, type SearchGroupChip } from "./catalog-groups";
import {
  catalogSectors,
  sectorCollectionPath,
  scholarshipsForSector,
} from "./catalog-routes";
import type { Sector } from "./types";

export const SECTOR_CHIP_HE: Record<Sector, string> = {
  jewish_general: "יהודים",
  arab: "ערבים",
  druze: "דרוזים",
  bedouin: "בדואים",
  circassian: "צ׳רקסים",
  haredi: "חרדים",
  ethiopian: "יוצאי אתיופיה",
};

export type LandingChip = {
  id: string;
  labelHe: string;
  href: string;
  count: number;
};

export function sectorLandingChips(): LandingChip[] {
  return catalogSectors()
    .map((id) => ({
      id: `sector-${id}`,
      labelHe: SECTOR_CHIP_HE[id],
      href: sectorCollectionPath(id),
      count: uniqueMatchableCount(scholarshipsForSector(id)),
    }))
    .filter((chip) => chip.count > 0);
}

/** Home / catalog chip row: search groups first, then existing sector pages. Empty skipped. */
export function studentLandingChips(): LandingChip[] {
  const groups: SearchGroupChip[] = searchGroupsWithCounts();
  return [...groups, ...sectorLandingChips()];
}
