"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Scholarship } from "@/lib/types";
import { groupByLastVerified, thisWeekUpdates } from "@/lib/changelog";
import { scholarshipPagePath } from "@/lib/catalog-routes";

export function CatalogUpdates({ scholarships }: { scholarships: Scholarship[] }) {
  const [asOf, setAsOf] = useState<Date | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client clock, not SSG build time
    setAsOf(new Date());
  }, []);

  const groups = useMemo(() => groupByLastVerified(scholarships), [scholarships]);
  const newestMonth = (groups[0]?.lastVerified ?? "").slice(0, 7);
  const week = asOf ? thisWeekUpdates(scholarships, asOf) : null;

  return (
    <>
      <section className="mt-8">
        <h2 className="font-display text-2xl">אומת השבוע</h2>
        {week == null ? (
          <p className="mt-3 text-sm text-ink-soft">טוען לפי התאריך במכשיר…</p>
        ) : week.length ? (
          <ul className="mt-3 space-y-2">
            {week.map((s) => (
              <li key={s.id}>
                <Link href={scholarshipPagePath(s.id)} className="underline underline-offset-4">
                  {s.nameHe}
                </Link>
                <span className="text-ink-soft"> · {s.lastVerified}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">אין רשומות עם תאריך אימות ב־7 הימים האחרונים.</p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">לפי תאריך אימות</h2>
        {groups.map((g) => {
          const openByData = g.lastVerified.slice(0, 7) === newestMonth;
          return (
            <details
              key={g.lastVerified}
              className="mt-3 rounded-2xl border border-line bg-card p-4"
              open={openByData}
            >
              <summary className="min-h-11 cursor-pointer font-medium">
                {g.lastVerified} ({g.scholarships.length})
              </summary>
              <ul className="mt-3 space-y-1 text-sm">
                {g.scholarships.map((s) => (
                  <li key={s.id}>
                    <Link href={scholarshipPagePath(s.id)} className="underline underline-offset-4">
                      {s.nameHe}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </section>
    </>
  );
}
