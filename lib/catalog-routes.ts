import { SCHOLARSHIPS } from "@/data/scholarships";
import { searchGroupsWithCounts } from "./catalog-groups";
import { INSTITUTIONS } from "./institutions";
import { fieldLabelHe } from "./labels";
import { collectCityValues, collectInstitutionValues, collectSectorValues } from "./rule-walk";
import { absoluteUrl } from "./site";
import type { Scholarship, Sector } from "./types";
import { SECTORS } from "./types";

export function scholarshipPagePath(id: string): string {
  return `/scholarships/${id}/`;
}

export function institutionCollectionPath(id: string): string {
  return `/catalog/institution/${id}/`;
}

export function cityCollectionPath(slug: string): string {
  return `/catalog/city/${slug}/`;
}

export function sectorCollectionPath(id: string): string {
  return `/catalog/sector/${id}/`;
}

export function cityToSlug(cityHe: string): string {
  return cityHe.trim().replace(/\s+/g, "-");
}

export function scholarshipsForInstitution(
  institutionId: string,
  list: Scholarship[] = SCHOLARSHIPS,
): Scholarship[] {
  return list.filter((s) => {
    if (s.institutionIds?.includes(institutionId)) return true;
    return collectInstitutionValues(s.eligibility).includes(institutionId);
  });
}

export function catalogInstitutionIds(list: Scholarship[] = SCHOLARSHIPS): string[] {
  const ids = new Set<string>();
  for (const s of list) {
    for (const id of s.institutionIds ?? []) ids.add(id);
    for (const id of collectInstitutionValues(s.eligibility)) ids.add(id);
  }
  return INSTITUTIONS.map((i) => i.id).filter((id) => ids.has(id) && scholarshipsForInstitution(id, list).length > 0);
}

export function catalogCities(list: Scholarship[] = SCHOLARSHIPS): string[] {
  const cities = new Set<string>();
  for (const s of list) {
    for (const c of collectCityValues(s.eligibility)) cities.add(c);
  }
  return [...cities].sort((a, b) => a.localeCompare(b, "he"));
}

export function cityFromSlug(slug: string, list: Scholarship[] = SCHOLARSHIPS): string | undefined {
  return catalogCities(list).find((c) => cityToSlug(c) === slug);
}

export function scholarshipsForCity(cityHe: string, list: Scholarship[] = SCHOLARSHIPS): Scholarship[] {
  return list.filter((s) => collectCityValues(s.eligibility).includes(cityHe));
}

export function catalogSectors(list: Scholarship[] = SCHOLARSHIPS): Sector[] {
  const present = new Set<Sector>();
  for (const s of list) {
    for (const sec of collectSectorValues(s.eligibility)) present.add(sec);
  }
  return SECTORS.filter((s) => present.has(s));
}

export function scholarshipsForSector(sector: Sector, list: Scholarship[] = SCHOLARSHIPS): Scholarship[] {
  return list.filter((s) => collectSectorValues(s.eligibility).includes(sector));
}

export function sectorLabelHe(sector: Sector): string {
  return fieldLabelHe(sector);
}

export function scholarshipStaticParams(list: Scholarship[] = SCHOLARSHIPS): { id: string }[] {
  return list.map((s) => ({ id: s.id }));
}

export function institutionStaticParams(list: Scholarship[] = SCHOLARSHIPS): { id: string }[] {
  return catalogInstitutionIds(list).map((id) => ({ id }));
}

export function cityStaticParams(list: Scholarship[] = SCHOLARSHIPS): { slug: string }[] {
  return catalogCities(list).map((city) => ({ slug: cityToSlug(city) }));
}

export function sectorStaticParams(list: Scholarship[] = SCHOLARSHIPS): { id: string }[] {
  return catalogSectors(list).map((id) => ({ id }));
}

const STATIC_PAGES = [
  "/",
  "/about/",
  "/catalog/",
  "/catalog/updates/",
  "/accessibility/",
  "/terms/",
  "/privacy/",
];

export function sitemapEntries(): { url: string }[] {
  const urls = [
    ...STATIC_PAGES.map((p) => absoluteUrl(p)),
    ...SCHOLARSHIPS.map((s) => absoluteUrl(scholarshipPagePath(s.id))),
    ...catalogInstitutionIds().map((id) => absoluteUrl(institutionCollectionPath(id))),
    ...catalogCities().map((c) => absoluteUrl(cityCollectionPath(cityToSlug(c)))),
    ...catalogSectors().map((id) => absoluteUrl(sectorCollectionPath(id))),
    ...searchGroupsWithCounts().map((g) => absoluteUrl(g.href)),
  ];
  return [...new Set(urls)].map((url) => ({ url }));
}
