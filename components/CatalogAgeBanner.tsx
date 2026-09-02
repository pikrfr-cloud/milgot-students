"use client";

import { useEffect, useState } from "react";
import { catalogAgeBanner } from "@/lib/format";
import { CATALOG_STATS } from "@/data/scholarships";

export function CatalogAgeBanner({ className = "" }: { className?: string }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client clock, not SSG build time
    setText(catalogAgeBanner(CATALOG_STATS.lastVerifiedMonth, new Date()));
  }, []);

  if (!text) return null;
  return (
    <p className={`rounded-2xl border border-line bg-paper-deep px-4 py-3 text-sm text-ink-soft ${className}`}>
      {text}
    </p>
  );
}
