import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogListCard } from "@/components/CatalogListCard";
import { CoverageNote } from "@/components/CoverageNote";
import { uniqueMatchableCount } from "@/lib/catalog";
import { cityCollectionPath, cityFromSlug, cityStaticParams, scholarshipsForCity } from "@/lib/catalog-routes";
import { deadlineSortValue } from "@/lib/format";
import { HE } from "@/lib/i18n/he";

export const dynamicParams = false;

export function generateStaticParams() {
  return cityStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const city = cityFromSlug(slug);
  return {
    title: city ? `מלגות לתושבי ${city}` : "עיר",
    description: city ? `מלגות בקטלוג עם תנאי מגורים ב${city}` : undefined,
    alternates: { canonical: cityCollectionPath(slug) },
  };
}

export default async function CityCollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const city = cityFromSlug(slug);
  if (!city) notFound();
  const list = scholarshipsForCity(city);
  if (!list.length) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm text-ink-soft">
        <Link href="/catalog/" className="underline underline-offset-4">
          {HE.nav.catalog}
        </Link>
      </p>
      <h1 className="mt-2 font-display text-4xl text-forest-deep">מלגות לתושבי {city}</h1>
      <p className="mt-2 text-ink-soft">{uniqueMatchableCount(list)} מלגות</p>
      <Link
        href="/chat/"
        className="mt-4 inline-flex min-h-11 items-center rounded-full bg-clay px-5 text-white"
      >
        {HE.actions.chatIntake}
      </Link>
      <ul className="mt-8 space-y-4">
        {[...list]
          .sort((a, b) => deadlineSortValue(a.deadline) - deadlineSortValue(b.deadline))
          .map((s) => (
            <CatalogListCard key={s.id} scholarship={s} />
          ))}
      </ul>
      <CoverageNote className="mt-8" />
    </div>
  );
}
