"use client";

import { useMemo, useState } from "react";
import { SCHOLARSHIPS } from "@/data/scholarships";
import { CoverageNote } from "@/components/CoverageNote";
import { formatAmount, formatDeadline } from "@/lib/format";
import { scholarshipTypeLabel } from "@/lib/labels";

export default function CatalogPage() {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const t = q.trim();
    if (!t) return SCHOLARSHIPS;
    return SCHOLARSHIPS.filter(
      (s) => s.nameHe.includes(t) || s.funderHe.includes(t) || s.whoItsForHe.includes(t),
    );
  }, [q]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl text-forest-deep">קטלוג המלגות</h1>
      <p className="mt-2 text-ink-soft">{SCHOLARSHIPS.length} רשומות מאומתות ככל האפשר. לא הומצאו מלגות.</p>
      <CoverageNote className="mt-3" />
      <input
        className="mt-6 w-full max-w-md rounded-xl border border-line bg-card px-3 py-2"
        placeholder="חיפוש בקטלוג"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <ul className="mt-8 grid gap-4">
        {list.map((s) => (
          <li key={s.id} className="rounded-2xl border border-line bg-card p-5">
            <div className="flex flex-wrap justify-between gap-2">
              <h2 className="font-display text-xl text-forest-deep">{s.nameHe}</h2>
              <span className="text-sm">{formatAmount(s.amounts)}</span>
            </div>
            <p className="mt-1 text-sm text-ink-soft">{s.funderHe}</p>
            <p className="mt-2 text-sm">{s.whoItsForHe}</p>
            <p className="mt-2 text-sm text-ink-soft">
              {formatDeadline(s.deadline)} · {s.types.map(scholarshipTypeLabel).join(", ")} · {s.scope}
            </p>
            {s.applyUrl ? (
              <a className="mt-2 inline-block text-sm underline" href={s.applyUrl} target="_blank" rel="noreferrer">
                מקור
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
