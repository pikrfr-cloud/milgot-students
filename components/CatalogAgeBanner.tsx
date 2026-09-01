import { catalogAgeBanner } from "@/lib/format";
import { CATALOG_STATS } from "@/data/scholarships";

export function CatalogAgeBanner({ className = "" }: { className?: string }) {
  const text = catalogAgeBanner(CATALOG_STATS.lastVerifiedMonth);
  if (!text) return null;
  return (
    <p className={`rounded-2xl border border-line bg-paper-deep px-4 py-3 text-sm text-ink-soft ${className}`}>
      {text}
    </p>
  );
}
