"use client";

import { useEffect, useState } from "react";
import { catalogAgeBanner } from "@/lib/format";
import { COUNTS } from "@/data/counts";

export function CatalogAgeBanner({ className = "" }: { className?: string }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client clock, not SSG build time
    setText(catalogAgeBanner(COUNTS.lastVerifiedMonth, new Date()));
  }, []);

  if (!text) return null;
  return (
    <p className={`rounded-2xl border border-line bg-paper-deep px-4 py-3 text-sm text-ink-soft ${className}`}>
      {text}
    </p>
  );
}
