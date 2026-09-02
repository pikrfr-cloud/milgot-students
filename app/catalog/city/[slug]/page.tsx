import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  cityCollectionPath,
  cityFromSlug,
  cityStaticParams,
  scholarshipPagePath,
  scholarshipsForCity,
} from "@/lib/catalog-routes";
import { amountHeadlineHe, deadlineSortValue, formatDeadline } from "@/lib/format";
import { HE } from "@/lib/i18n/he";
import { CoverageNote } from "@/components/CoverageNote";

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
      <p className="mt-2 text-ink-soft">{list.length} רשומות עם תנאי מגורים בעיר זו.</p>
      <Link
        href="/profile/fast/"
        className="mt-4 inline-flex min-h-11 items-center rounded-full bg-clay px-5 text-white"
      >
        {HE.actions.checkFit}
      </Link>
      <ul className="mt-8 space-y-4">
        {[...list]
          .sort((a, b) => deadlineSortValue(a.deadline) - deadlineSortValue(b.deadline))
          .map((s) => (
          <li key={s.id} className="rounded-2xl border border-line bg-card p-4">
            <Link href={scholarshipPagePath(s.id)} className="font-display text-xl text-forest-deep underline-offset-4 hover:underline">
              {s.nameHe}
            </Link>
            <p className="mt-1 text-sm text-ink-soft">
              {amountHeadlineHe(s.amounts)} · {formatDeadline(s.deadline)}
            </p>
          </li>
        ))}
      </ul>
      <CoverageNote className="mt-8" />
    </div>
  );
}
