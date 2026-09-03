import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { INSTITUTIONS } from "@/lib/institutions";
import { CatalogListCard } from "@/components/CatalogListCard";
import { CoverageNote } from "@/components/CoverageNote";
import { uniqueMatchableCount } from "@/lib/catalog";
import {
  institutionCollectionPath,
  institutionStaticParams,
  scholarshipsForInstitution,
} from "@/lib/catalog-routes";
import { deadlineSortValue } from "@/lib/format";
import { HE } from "@/lib/i18n/he";

export const dynamicParams = false;

export function generateStaticParams() {
  return institutionStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const inst = INSTITUTIONS.find((i) => i.id === id);
  return {
    title: inst ? `מלגות — ${inst.nameHe}` : "מוסד",
    description: inst ? `מלגות בקטלוג הקשורות ל${inst.nameHe}` : undefined,
    alternates: { canonical: institutionCollectionPath(id) },
  };
}

export default async function InstitutionCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inst = INSTITUTIONS.find((i) => i.id === id);
  const list = scholarshipsForInstitution(id);
  if (!inst || list.length === 0) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm text-ink-soft">
        <Link href="/catalog/" className="underline underline-offset-4">
          {HE.nav.catalog}
        </Link>
      </p>
      <h1 className="mt-2 font-display text-4xl text-forest-deep">מלגות — {inst.nameHe}</h1>
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
