import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COUNTS, studentCountsLine } from "@/data/counts";
import { getScholarshipById } from "@/data/scholarships";
import { ExternalLink } from "@/components/ExternalLink";
import { HeWithEn } from "@/components/HeWithEn";
import { CoverageNote } from "@/components/CoverageNote";
import {
  amountDisplay,
  formatDeadline,
  isVerificationStale,
  publicDeadlineLabelHe,
  scopeLabelHe,
  STALE_VERIFICATION_LABEL_HE,
} from "@/lib/format";
import { scholarshipTypeLabel } from "@/lib/labels";
import { collectEligibilityLabels } from "@/lib/rule-walk";
import { scholarshipPagePath, scholarshipStaticParams } from "@/lib/catalog-routes";
import { absoluteUrl } from "@/lib/site";
import { sourceLevelLabelHe, bestSourceLevel } from "@/lib/sources";
import { HE } from "@/lib/i18n/he";
import { INSTITUTIONS } from "@/lib/institutions";
import { isGuideRecord } from "@/lib/catalog";
import { VerificationNotes } from "@/components/VerificationNotes";
import { WhatsAppShareLink } from "@/components/WhatsAppShareLink";

export const dynamicParams = false;

export function generateStaticParams() {
  return scholarshipStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const s = getScholarshipById(id);
  if (!s) return { title: "מלגה לא נמצאה" };
  return {
    title: s.nameHe,
    description: `${s.whoItsForHe} · ${formatDeadline(s.deadline)}`.slice(0, 160),
    alternates: { canonical: scholarshipPagePath(s.id) },
  };
}

export default async function ScholarshipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const s = getScholarshipById(id);
  if (!s) notFound();

  const inst = s.institutionIds
    ?.map((i) => INSTITUTIONS.find((x) => x.id === i)?.nameHe)
    .filter(Boolean)
    .join(", ");
  const conditions = collectEligibilityLabels(s.eligibility);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: s.nameHe,
    url: absoluteUrl(scholarshipPagePath(s.id)),
    description: s.whoItsForHe,
    provider: { "@type": "Organization", name: s.funderHe },
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="text-sm text-ink-soft">
        <Link href="/catalog/" className="underline underline-offset-4">
          {HE.nav.catalog}
        </Link>
      </p>
      <h1 className="mt-2 font-display text-4xl text-forest-deep">
        <HeWithEn text={s.nameHe} />
      </h1>
      <p className="mt-2 text-ink-soft">
        <HeWithEn text={s.funderHe} />
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {isVerificationStale(s.lastVerified) ? (
          <span className="rounded-full bg-warn/10 px-2 py-0.5 text-warn">{STALE_VERIFICATION_LABEL_HE}</span>
        ) : null}
        <span className="rounded-full bg-paper-deep px-2 py-0.5">
          {publicDeadlineLabelHe(s.deadline, s.lastVerified)}
        </span>
        <span className="rounded-full bg-paper-deep px-2 py-0.5">{amountDisplay(s.amounts).headlineHe}</span>
        <span className="rounded-full bg-paper-deep px-2 py-0.5">
          {s.types.map(scholarshipTypeLabel).join(" · ")} · {scopeLabelHe(s.scope)}
        </span>
        <span className="rounded-full bg-paper-deep px-2 py-0.5">
          {sourceLevelLabelHe(s.sourceLevel ?? bestSourceLevel(s.sourceUrls))}
        </span>
        {amountDisplay(s.amounts).noteHe ? (
          <span className="rounded-full bg-paper-deep px-2 py-0.5 text-ink-soft">{amountDisplay(s.amounts).noteHe}</span>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Link
          href="/profile/fast/"
          className="inline-flex min-h-11 items-center rounded-full bg-clay px-6 text-white"
        >
          {HE.actions.checkFit}
        </Link>
        <WhatsAppShareLink scholarship={s} />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl">למי זה מיועד</h2>
        <p className="mt-3 leading-relaxed">{s.whoItsForHe}</p>
        {inst ? <p className="mt-2 text-sm text-ink-soft">מוסדות: {inst}</p> : null}
        {isGuideRecord(s) ? (
          <p className="mt-3 rounded-xl border border-line bg-paper-deep px-3 py-2 text-sm text-ink-soft">
            {HE.catalog.guideHint}
          </p>
        ) : null}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl">תנאים שבקטלוג</h2>
        <ul className="mt-3 list-disc space-y-1 pr-5">
          {conditions.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl">מועד</h2>
        <p className="mt-3">{formatDeadline(s.deadline)}</p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl">מסמכים</h2>
        <ul className="mt-3 list-disc space-y-1 pr-5">
          {s.documentsHe.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl">איך מגישים</h2>
        <p className="mt-3 leading-relaxed">{s.howToApplyHe}</p>
        {s.applyUrl ? (
          <p className="mt-2">
            <ExternalLink href={s.applyUrl} className="underline underline-offset-4 ltr-isolate">
              קישור להגשה / מידע
            </ExternalLink>
          </p>
        ) : null}
      </section>

      <VerificationNotes scholarship={s} amountTextHe={s.amounts.textHe} />

      <CoverageNote className="mt-8" />
      <p className="mt-4 text-sm">
        {studentCountsLine(COUNTS)}.{" "}
        <Link href="/catalog/" className="underline underline-offset-4">
          לכל הקטלוג
        </Link>
      </p>
    </div>
  );
}
