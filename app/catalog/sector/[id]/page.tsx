import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Sector } from "@/lib/types";
import { SECTORS } from "@/lib/types";
import { CatalogListCard } from "@/components/CatalogListCard";
import { CoverageNote } from "@/components/CoverageNote";
import { uniqueMatchableCount } from "@/lib/catalog";
import {
  sectorCollectionPath,
  sectorLabelHe,
  sectorStaticParams,
  scholarshipsForSector,
} from "@/lib/catalog-routes";
import { deadlineSortValue } from "@/lib/format";
import { HE } from "@/lib/i18n/he";

export const dynamicParams = false;

export function generateStaticParams() {
  return sectorStaticParams();
}

function asSector(id: string): Sector | undefined {
  return SECTORS.find((s) => s === id);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const sector = asSector(id);
  const label = sector ? sectorLabelHe(sector) : id;
  return {
    title: `מלגות — ${label}`,
    description: `מלגות בקטלוג עם תנאי קהילה: ${label}`,
    alternates: { canonical: sectorCollectionPath(id) },
  };
}

export default async function SectorCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sector = asSector(id);
  if (!sector) notFound();
  const list = scholarshipsForSector(sector);
  if (!list.length) notFound();
  const label = sectorLabelHe(sector);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm text-ink-soft">
        <Link href="/catalog/" className="underline underline-offset-4">
          {HE.nav.catalog}
        </Link>
      </p>
      <h1 className="mt-2 font-display text-4xl text-forest-deep">מלגות — {label}</h1>
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
