import type { Metadata } from "next";
import { SCHOLARSHIPS } from "@/data/scholarships";
import { hasNumericIls, uniqueMatchableByApplyUrl } from "./catalog";
import {
  groupCollectionPath,
  SEARCH_GROUP_IDS,
  scholarshipsForGroup,
  type SearchGroupId,
} from "./catalog-groups";
import {
  catalogCities,
  catalogInstitutionIds,
  catalogSectors,
  cityCollectionPath,
  cityToSlug,
  institutionCollectionPath,
  sectorCollectionPath,
  scholarshipsForCity,
  scholarshipsForInstitution,
  scholarshipsForSector,
  scholarshipPagePath,
} from "./catalog-routes";
import { daysUntilIsoDate, deadlineSortValue, formatHebrewLongDate, formatIls } from "./format";
import { INSTITUTIONS } from "./institutions";
import {
  compactStudentProfile,
  encodeSharedProfile,
  SHARED_PROFILE_PARAM,
  sharedProfileIsEmpty,
} from "./profile-share";
import { absoluteUrl } from "./site";
import { SECTOR_CHIP_HE } from "./student-landings";
import type { Scholarship, Sector, StudentProfile } from "./types";

export const TASHPAZ_HE = "תשפ״ז";
export const UNCERTAIN_HE = "לא ודאי";
export const MIN_LANDING_SCHOLARSHIPS = 2;

export type CollectionLandingKind = "city" | "institution" | "sector" | "group";

export type CollectionLanding = {
  kind: CollectionLandingKind;
  id: string;
  href: string;
  titleHe: string;
  introHe: string;
  chatHref: string;
  scholarships: Scholarship[];
};

/** Published ₪ only — skip uncertain / unnumbered amounts. Never invent a range. */
export function publishedAmountRange(
  list: readonly Scholarship[],
): { min: number; max: number } | null {
  const nums: number[] = [];
  for (const s of list) {
    if (s.amounts.uncertain) continue;
    if (!hasNumericIls(s)) continue;
    const min = s.amounts.minIls;
    const max = s.amounts.maxIls;
    if (typeof min === "number" && min > 0) nums.push(min);
    if (typeof max === "number" && max > 0) nums.push(max);
  }
  if (nums.length === 0) return null;
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

/** Soonest upcoming known `deadline.date`; if none upcoming, the nearest known date. */
export function nearestKnownDeadlineIso(
  list: readonly Scholarship[],
  asOf: Date = new Date(),
): string | null {
  const dated = list.map((s) => s.deadline.date).filter((d): d is string => Boolean(d));
  if (dated.length === 0) return null;
  const upcoming = dated.filter((d) => daysUntilIsoDate(d, asOf) >= 0).sort();
  if (upcoming[0]) return upcoming[0];
  return [...dated].sort(
    (a, b) => Math.abs(daysUntilIsoDate(a, asOf)) - Math.abs(daysUntilIsoDate(b, asOf)),
  )[0]!;
}

export function landingIntroHe(list: readonly Scholarship[], asOf: Date = new Date()): string {
  const n = list.length;
  const countSentence = n === 1 ? "יש כאן מלגה אחת בקטלוג." : `יש כאן ${n} מלגות בקטלוג.`;

  const range = publishedAmountRange(list);
  let amountSentence: string;
  if (!range) {
    amountSentence = `הסכומים ${UNCERTAIN_HE}.`;
  } else if (range.min === range.max) {
    amountSentence = `הסכום שפורסם הוא ${formatIls(range.min)}.`;
  } else {
    amountSentence = `הסכומים שפורסמו נעים בין ${formatIls(range.min)} ל־${formatIls(range.max)}.`;
  }

  const iso = nearestKnownDeadlineIso(list, asOf);
  const deadlineSentence = iso
    ? `המועד הקרוב שפורסם הוא ${formatHebrewLongDate(iso)}.`
    : `המועד ${UNCERTAIN_HE}.`;

  return `${countSentence} ${amountSentence} ${deadlineSentence}`;
}

export function cityLandingTitleHe(cityHe: string): string {
  return `מלגות לסטודנטים ב${cityHe} ${TASHPAZ_HE}`;
}

export function institutionLandingTitleHe(nameHe: string): string {
  return `מלגות ל${nameHe} ${TASHPAZ_HE}`;
}

export function sectorLandingTitleHe(sector: Sector): string {
  return `מלגות ל${SECTOR_CHIP_HE[sector]} ${TASHPAZ_HE}`;
}

export function groupLandingTitleHe(id: SearchGroupId): string {
  switch (id) {
    case "without-volunteering":
      return `מלגות ללא התנדבות ${TASHPAZ_HE}`;
    case "miluim":
      return `מלגות למילואימניקים ${TASHPAZ_HE}`;
    case "periphery":
      return `מלגות לפריפריה ${TASHPAZ_HE}`;
  }
}

export function groupChatSeed(id: SearchGroupId): StudentProfile {
  switch (id) {
    case "without-volunteering":
      return { willingToVolunteer: false };
    case "miluim":
      return { service: "idf", reservistDaysLastYear: 1 };
    case "periphery":
      return { peripheryResidence: true };
  }
}

/**
 * Chat pre-filter URL. Institution/city use the simple query ChatIntake reads;
 * other seeds use existing `#p=` profile-share. One encoding per link.
 */
export function chatSeedHref(seed: StudentProfile): string {
  const compact = compactStudentProfile(seed);
  if (sharedProfileIsEmpty(compact)) return "/chat/";
  const keys = Object.keys(compact);
  if (keys.length === 1 && compact.institution) {
    return `/chat/?institution=${encodeURIComponent(compact.institution)}`;
  }
  if (keys.length === 1 && compact.cityOfResidence) {
    return `/chat/?city=${encodeURIComponent(compact.cityOfResidence)}`;
  }
  const encoded = encodeSharedProfile(compact);
  return encoded ? `/chat/#${SHARED_PROFILE_PARAM}=${encoded}` : "/chat/";
}

export function sortedLandingScholarships(list: readonly Scholarship[]): Scholarship[] {
  return [...list].sort((a, b) => deadlineSortValue(a.deadline) - deadlineSortValue(b.deadline));
}

export type LandingItemListJsonLd = {
  "@context": "https://schema.org";
  "@type": "ItemList";
  name: string;
  numberOfItems: number;
  itemListElement: {
    "@type": "ListItem";
    position: number;
    name: string;
    url: string;
  }[];
};

export function landingItemListJsonLd(landing: CollectionLanding): LandingItemListJsonLd {
  const list = sortedLandingScholarships(landing.scholarships);
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: landing.titleHe,
    numberOfItems: list.length,
    itemListElement: list.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: s.nameHe,
      url: absoluteUrl(scholarshipPagePath(s.id)),
    })),
  };
}

export function landingMetadata(landing: Pick<CollectionLanding, "titleHe" | "introHe" | "href">): Metadata {
  const description = landing.introHe.slice(0, 160);
  return {
    title: { absolute: landing.titleHe },
    description,
    alternates: { canonical: landing.href },
    openGraph: {
      title: landing.titleHe,
      description,
    },
  };
}

function toLanding(
  kind: CollectionLandingKind,
  id: string,
  href: string,
  titleHe: string,
  scholarships: Scholarship[],
  seed: StudentProfile,
): CollectionLanding {
  return {
    kind,
    id,
    href,
    titleHe,
    introHe: landingIntroHe(scholarships),
    chatHref: chatSeedHref(seed),
    scholarships,
  };
}

export function cityLanding(cityHe: string, list: Scholarship[] = SCHOLARSHIPS): CollectionLanding {
  const slug = cityToSlug(cityHe);
  return toLanding(
    "city",
    slug,
    cityCollectionPath(slug),
    cityLandingTitleHe(cityHe),
    scholarshipsForCity(cityHe, list),
    { cityOfResidence: cityHe },
  );
}

export function institutionLanding(
  institutionId: string,
  list: Scholarship[] = SCHOLARSHIPS,
): CollectionLanding | undefined {
  const inst = INSTITUTIONS.find((i) => i.id === institutionId);
  if (!inst) return undefined;
  return toLanding(
    "institution",
    institutionId,
    institutionCollectionPath(institutionId),
    institutionLandingTitleHe(inst.nameHe),
    scholarshipsForInstitution(institutionId, list),
    { institution: institutionId },
  );
}

export function sectorLanding(sector: Sector, list: Scholarship[] = SCHOLARSHIPS): CollectionLanding {
  return toLanding(
    "sector",
    sector,
    sectorCollectionPath(sector),
    sectorLandingTitleHe(sector),
    scholarshipsForSector(sector, list),
    { sectors: [sector] },
  );
}

export function cityLandings(list: Scholarship[] = SCHOLARSHIPS): CollectionLanding[] {
  return catalogCities(list)
    .map((city) => cityLanding(city, list))
    .filter((l) => l.scholarships.length > 0);
}

export function institutionLandings(list: Scholarship[] = SCHOLARSHIPS): CollectionLanding[] {
  return catalogInstitutionIds(list)
    .map((id) => institutionLanding(id, list))
    .filter((l): l is CollectionLanding => Boolean(l && l.scholarships.length > 0));
}

export function sectorLandings(list: Scholarship[] = SCHOLARSHIPS): CollectionLanding[] {
  return catalogSectors(list)
    .map((id) => sectorLanding(id, list))
    .filter((l) => l.scholarships.length > 0);
}

export function groupLanding(id: SearchGroupId): CollectionLanding {
  const scholarships = uniqueMatchableByApplyUrl(scholarshipsForGroup(id));
  return toLanding(
    "group",
    id,
    groupCollectionPath(id),
    groupLandingTitleHe(id),
    scholarships,
    groupChatSeed(id),
  );
}

export function groupLandings(): CollectionLanding[] {
  return SEARCH_GROUP_IDS.map(groupLanding).filter((l) => l.scholarships.length > 0);
}

/** City / institution / sector pages with at least two catalog rows. */
export function qualifyingCollectionLandings(list: Scholarship[] = SCHOLARSHIPS): CollectionLanding[] {
  return [...cityLandings(list), ...institutionLandings(list), ...sectorLandings(list)].filter(
    (l) => l.scholarships.length >= MIN_LANDING_SCHOLARSHIPS,
  );
}

/** All student landings that meet the two-scholarship bar, including groups. */
export function qualifyingStudentLandings(list: Scholarship[] = SCHOLARSHIPS): CollectionLanding[] {
  return [
    ...qualifyingCollectionLandings(list),
    ...groupLandings().filter((l) => l.scholarships.length >= MIN_LANDING_SCHOLARSHIPS),
  ];
}

export function allCollectionLandings(list: Scholarship[] = SCHOLARSHIPS): CollectionLanding[] {
  return [...cityLandings(list), ...institutionLandings(list), ...sectorLandings(list), ...groupLandings()];
}
