import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Sector } from "@/lib/types";
import { SECTORS } from "@/lib/types";
import {
  sectorCollectionPath,
  sectorLabelHe,
  sectorStaticParams,
  scholarshipPagePath,
  scholarshipsForSector,
} from "@/lib/catalog-routes";
import { formatAmount, formatDeadline } from "@/lib/format";
import { HE } from "@/lib/i18n/he";
import { CoverageNote } from "@/components/CoverageNote";

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
      <p className="mt-2 text-ink-soft">{list.length} רשומות עם תנאי קהילה זה.</p>
      <Link
        href="/profile/fast/"
        className="mt-4 inline-flex min-h-11 items-center rounded-full bg-clay px-5 text-white"
      >
        {HE.actions.checkFit}
      </Link>
      <ul className="mt-8 space-y-4">
        {list.map((s) => (
          <li key={s.id} className="rounded-2xl border border-line bg-card p-4">
            <Link href={scholarshipPagePath(s.id)} className="font-display text-xl text-forest-deep underline-offset-4 hover:underline">
              {s.nameHe}
            </Link>
            <p className="mt-1 text-sm text-ink-soft">
              {formatAmount(s.amounts)} · {formatDeadline(s.deadline)}
            </p>
          </li>
        ))}
      </ul>
      <CoverageNote className="mt-8" />
    </div>
  );
}
