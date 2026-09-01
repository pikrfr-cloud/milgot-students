import type { Metadata } from "next";
import { CoverageNote } from "@/components/CoverageNote";
import { CatalogAgeBanner } from "@/components/CatalogAgeBanner";
import { CATALOG_STATS } from "@/data/scholarships";
import { CatalogExplorer } from "@/components/CatalogExplorer";
import { SCHOLARSHIPS, TIPS } from "@/data/scholarships";

export const metadata: Metadata = {
  title: "קטלוג המלגות",
  description: `עיון ב־${CATALOG_STATS.total} מלגות מאומתות ככל האפשר, בלי המצאת סכומים.`,
  alternates: { canonical: "/catalog/" },
};

export default function CatalogPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl text-forest-deep">קטלוג המלגות</h1>
      <p className="mt-2 text-ink-soft">
        {SCHOLARSHIPS.length} מלגות מאומתות ככל האפשר, ועוד {TIPS.length} טיפים שאינם מלגות. לא
        הומצאו מלגות.
      </p>
      <CoverageNote className="mt-3" />
      <CatalogAgeBanner className="mt-3" />
      <CatalogExplorer scholarships={SCHOLARSHIPS} tips={TIPS} />
    </div>
  );
}
