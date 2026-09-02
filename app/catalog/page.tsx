import type { Metadata } from "next";
import { CoverageNote } from "@/components/CoverageNote";
import { CatalogAgeBanner } from "@/components/CatalogAgeBanner";
import { CatalogExplorer } from "@/components/CatalogExplorer";
import { CATALOG_STATS, GUIDE_SCHOLARSHIPS, MATCHABLE_SCHOLARSHIPS, TIPS } from "@/data/scholarships";
import Link from "next/link";
import {
  catalogCities,
  catalogInstitutionIds,
  catalogSectors,
  cityCollectionPath,
  cityToSlug,
  institutionCollectionPath,
  sectorCollectionPath,
  sectorLabelHe,
} from "@/lib/catalog-routes";
import { INSTITUTIONS } from "@/lib/institutions";
import { HE } from "@/lib/i18n/he";

export const metadata: Metadata = {
  title: "קטלוג המלגות",
  description: `עיון ב־${CATALOG_STATS.total} מלגות להתאמה מול הקטלוג, בלי המצאת סכומים.`,
  alternates: { canonical: "/catalog/" },
};

export default function CatalogPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl text-forest-deep">קטלוג המלגות</h1>
      <p className="mt-2 text-ink-soft">
        {CATALOG_STATS.total} מלגות להתאמה מול הקטלוג, {CATALOG_STATS.guide} במדריך (דיקן / רשות),
        ועוד {TIPS.length} טיפים שאינם מלגות. לא הומצאו מלגות.
      </p>
      <p className="mt-3">
        <Link href="/catalog/updates/" className="underline underline-offset-4">
          {HE.nav.updates}
        </Link>
      </p>
      <CoverageNote className="mt-3" />
      <CatalogAgeBanner className="mt-3" />
      <section className="mt-6 rounded-2xl border border-line bg-card p-4 text-sm">
        <h2 className="font-medium">עיון לפי מוסד / עיר / קהילה</h2>
        <p className="mt-2 text-ink-soft">דפי אוסף רק כשיש נתונים בקטלוג.</p>
        <p className="mt-3 font-medium">מוסדות</p>
        <ul className="mt-1 flex flex-wrap gap-2">
          {catalogInstitutionIds().map((id) => {
            const name = INSTITUTIONS.find((i) => i.id === id)?.nameHe ?? id;
            return (
              <li key={id}>
                <Link href={institutionCollectionPath(id)} className="underline underline-offset-4">
                  {name}
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 font-medium">ערים</p>
        <ul className="mt-1 flex flex-wrap gap-2">
          {catalogCities().map((city) => (
            <li key={city}>
              <Link href={cityCollectionPath(cityToSlug(city))} className="underline underline-offset-4">
                {city}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 font-medium">קהילות</p>
        <ul className="mt-1 flex flex-wrap gap-2">
          {catalogSectors().map((id) => (
            <li key={id}>
              <Link href={sectorCollectionPath(id)} className="underline underline-offset-4">
                {sectorLabelHe(id)}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <CatalogExplorer scholarships={MATCHABLE_SCHOLARSHIPS} guide={GUIDE_SCHOLARSHIPS} tips={TIPS} />
    </div>
  );
}
