import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AmountLegend } from "@/components/AmountLegend";
import { CatalogListCard } from "@/components/CatalogListCard";
import { CoverageNote } from "@/components/CoverageNote";
import { uniqueMatchableByApplyUrl } from "@/lib/catalog";
import {
  groupCollectionPath,
  groupStaticParams,
  isSearchGroupId,
  SEARCH_GROUP_LABEL_HE,
  scholarshipsForGroup,
} from "@/lib/catalog-groups";
import { deadlineSortValue } from "@/lib/format";
import { HE } from "@/lib/i18n/he";

export const dynamicParams = false;

export function generateStaticParams() {
  return groupStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!isSearchGroupId(id)) return { title: HE.nav.catalog };
  const label = SEARCH_GROUP_LABEL_HE[id];
  const list = uniqueMatchableByApplyUrl(scholarshipsForGroup(id));
  return {
    title: `מלגות — ${label}`,
    description: `${list.length} מלגות · ${label}`,
    alternates: { canonical: groupCollectionPath(id) },
  };
}

export default async function GroupCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isSearchGroupId(id)) notFound();
  const list = uniqueMatchableByApplyUrl(scholarshipsForGroup(id));
  if (!list.length) notFound();
  const label = SEARCH_GROUP_LABEL_HE[id];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm text-ink-soft">
        <Link href="/catalog/" className="underline underline-offset-4">
          {HE.nav.catalog}
        </Link>
      </p>
      <h1 className="mt-2 font-display text-4xl text-forest-deep">מלגות — {label}</h1>
      <p className="mt-2 text-ink-soft">
        {list.length} {list.length === 1 ? "מלגה" : "מלגות"}
      </p>
      <Link
        href="/chat/"
        className="mt-4 inline-flex min-h-11 items-center rounded-full bg-clay px-5 text-white"
      >
        {HE.actions.chatIntake}
      </Link>
      <AmountLegend className="mt-4" />
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
