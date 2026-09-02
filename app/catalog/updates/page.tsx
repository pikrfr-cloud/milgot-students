import type { Metadata } from "next";
import Link from "next/link";
import { SCHOLARSHIPS } from "@/data/scholarships";
import { groupByLastVerified, thisWeekUpdates } from "@/lib/changelog";
import { scholarshipPagePath } from "@/lib/catalog-routes";
import { HE } from "@/lib/i18n/he";

export const metadata: Metadata = {
  title: HE.nav.updates,
  description: "רשומות שאומתו השבוע לפי תאריך lastVerified בקטלוג — לא יומן עריכות מלא.",
  alternates: { canonical: "/catalog/updates/" },
};

export default function CatalogUpdatesPage() {
  const asOf = new Date();
  const week = thisWeekUpdates(SCHOLARSHIPS, asOf);
  const groups = groupByLastVerified(SCHOLARSHIPS);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl text-forest-deep">{HE.nav.updates}</h1>
      <p className="mt-3 text-ink-soft leading-relaxed">
        מוצג לפי תאריך האימות האחרון (`lastVerified`) בקטלוג. אין כאן היסטוריית עריכות מלאה — לא הומצא יומן.
      </p>

      <section className="mt-8">
        <h2 className="font-display text-2xl">אומת השבוע</h2>
        {week.length ? (
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
        {groups.map((g) => (
          <details key={g.lastVerified} className="mt-3 rounded-2xl border border-line bg-card p-4" open={g.lastVerified >= "2026-09"}>
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
        ))}
      </section>
    </div>
  );
}
