"use client";

import Link from "next/link";
import { useMemo } from "react";
import { MATCHABLE_SCHOLARSHIPS } from "@/data/scholarships";
import { scholarshipPagePath } from "@/lib/catalog-routes";
import { volunteeringChipHe } from "@/lib/card-chips";
import { amountHeadlineHe, deadlineSortValue, deadlineStatus } from "@/lib/format";
import { HE } from "@/lib/i18n/he";

const LIMIT = 5;

export function UrgentNowStrip() {
  const asOf = useMemo(() => new Date(), []);
  const items = useMemo(() => {
    return MATCHABLE_SCHOLARSHIPS.filter((s) => {
      const kind = deadlineStatus(s.deadline, asOf).kind;
      return (kind === "open" || kind === "closingSoon") && !!s.deadline.date;
    })
      .sort((a, b) => deadlineSortValue(a.deadline, asOf) - deadlineSortValue(b.deadline, asOf))
      .slice(0, LIMIT);
  }, [asOf]);

  if (!items.length) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-14" aria-labelledby="urgent-now">
      <h2 id="urgent-now" className="font-display text-3xl text-forest-deep">
        <Link href="/closing/" className="hover:underline underline-offset-4">
          {HE.actions.urgentNow}
        </Link>
      </h2>
      <ul className="mt-5 grid gap-3">
        {items.map((s) => {
          const status = deadlineStatus(s.deadline, asOf);
          return (
            <li key={s.id}>
              <Link
                href={scholarshipPagePath(s.id)}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-2xl border border-line bg-card px-4 py-3 hover:border-forest/40"
              >
                <span className="font-medium text-forest-deep">{s.nameHe}</span>
                <span className="text-sm text-ink-soft">
                  {amountHeadlineHe(s.amounts)} · {status.labelHe} · {volunteeringChipHe(s)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
