import Link from "next/link";
import { CatalogListCard } from "@/components/CatalogListCard";
import { CoverageNote } from "@/components/CoverageNote";
import { deadlineSortValue } from "@/lib/format";
import { HE } from "@/lib/i18n/he";
import type { CollectionLanding } from "@/lib/landing-pages";

export function CatalogLandingPage({ landing }: { landing: CollectionLanding }) {
  const list = [...landing.scholarships].sort(
    (a, b) => deadlineSortValue(a.deadline) - deadlineSortValue(b.deadline),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
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
