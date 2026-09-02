import type { Metadata } from "next";
import { CatalogExplorer } from "@/components/CatalogExplorer";
import { COUNTS, studentCountsLineFull } from "@/data/counts";
import { GUIDE_SCHOLARSHIPS, MATCHABLE_SCHOLARSHIPS, TIPS } from "@/data/scholarships";
import { HE } from "@/lib/i18n/he";

export const metadata: Metadata = {
  title: HE.nav.catalog,
  description: `${COUNTS.matchable} מלגות. בלי המצאת סכומים.`,
  alternates: { canonical: "/catalog/" },
};

export default function CatalogPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl text-forest-deep">{HE.nav.catalog}</h1>
      <p className="mt-2 text-ink-soft">{studentCountsLineFull(COUNTS)}</p>
      <CatalogExplorer scholarships={MATCHABLE_SCHOLARSHIPS} guide={GUIDE_SCHOLARSHIPS} tips={TIPS} />
    </div>
  );
}
