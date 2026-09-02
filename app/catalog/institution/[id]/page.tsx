import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { INSTITUTIONS } from "@/lib/institutions";
import {
  institutionCollectionPath,
  institutionStaticParams,
  scholarshipPagePath,
  scholarshipsForInstitution,
} from "@/lib/catalog-routes";
import { amountHeadlineHe, deadlineSortValue, formatDeadline } from "@/lib/format";
import { HE } from "@/lib/i18n/he";
import { CoverageNote } from "@/components/CoverageNote";

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
      <p className="mt-2 text-ink-soft">{list.length} רשומות בקטלוג שקשורות למוסד זה.</p>
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
