import type { Metadata } from "next";
import { SCHOLARSHIPS } from "@/data/scholarships";
import { CatalogUpdates } from "@/components/CatalogUpdates";
import { HE } from "@/lib/i18n/he";

export const metadata: Metadata = {
  title: HE.nav.updates,
  description: "מה עודכן במלגות השבוע.",
  alternates: { canonical: "/catalog/updates/" },
};

export default function CatalogUpdatesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl text-forest-deep">{HE.nav.updates}</h1>
      <p className="mt-3 text-ink-soft leading-relaxed">
        מלגות שעודכנו לאחרונה.
      </p>
      <CatalogUpdates scholarships={SCHOLARSHIPS} />
    </div>
  );
}
