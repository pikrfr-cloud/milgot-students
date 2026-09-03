import Link from "next/link";
import { CatalogListCard } from "@/components/CatalogListCard";
import { CoverageNote } from "@/components/CoverageNote";
import { HE } from "@/lib/i18n/he";
import {
  landingItemListJsonLd,
  sortedLandingScholarships,
  type CollectionLanding,
} from "@/lib/landing-pages";

export function CatalogLandingPage({ landing }: { landing: CollectionLanding }) {
  const list = sortedLandingScholarships(landing.scholarships);
  const jsonLd = landingItemListJsonLd(landing);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="text-sm text-ink-soft">
        <Link href="/catalog/" className="underline underline-offset-4">
          {HE.nav.catalog}
        </Link>
      </p>
      <h1 className="mt-2 font-display text-4xl text-forest-deep">{landing.titleHe}</h1>
      <p className="mt-3 leading-relaxed text-ink">{landing.introHe}</p>
      <Link
        href={landing.chatHref}
        className="mt-4 inline-flex min-h-11 items-center rounded-full bg-clay px-5 text-white"
      >
        {HE.actions.chatIntake}
      </Link>
      <ul className="mt-8 space-y-4">
        {list.map((s) => (
          <CatalogListCard key={s.id} scholarship={s} />
        ))}
      </ul>
      <CoverageNote className="mt-8" />
    </div>
  );
}
