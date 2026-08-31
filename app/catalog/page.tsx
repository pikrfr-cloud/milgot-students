"use client";

import { useMemo, useState } from "react";
import { SCHOLARSHIPS, TIPS } from "@/data/scholarships";
import { CoverageNote } from "@/components/CoverageNote";
import { formatAmount, formatDeadline, scopeLabelHe } from "@/lib/format";
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
  const tips = useMemo(() => {
    const t = q.trim();
    if (!t) return TIPS;
    return TIPS.filter(
      (s) => s.nameHe.includes(t) || s.funderHe.includes(t) || s.whoItsForHe.includes(t),
    );
  }, [q]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl text-forest-deep">קטלוג המלגות</h1>
      <p className="mt-2 text-ink-soft">
        {SCHOLARSHIPS.length} מלגות מאומתות ככל האפשר, ועוד {TIPS.length} טיפים שאינם מלגות. לא
        הומצאו מלגות.
      </p>
      <CoverageNote className="mt-3" />
      <input
        className="mt-6 w-full max-w-md rounded-xl border border-line bg-card px-3 py-2"
        placeholder="חיפוש בקטלוג"
        aria-label="חיפוש בקטלוג המלגות"
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
              {formatDeadline(s.deadline)} · {s.types.map(scholarshipTypeLabel).join(", ")} ·{" "}
              {scopeLabelHe(s.scope)}
            </p>
            <p className="mt-2 text-xs">
              {s.officialSource ? (
                <span className="rounded-full bg-ok/10 px-2 py-0.5 text-ok">מקור רשמי</span>
              ) : (
                <span className="rounded-full bg-warn/10 px-2 py-0.5 text-warn">אין מקור רשמי מאומת</span>
              )}
            </p>
            {s.sourceUrls.length > 0 ? (
              <p className="mt-2 text-xs text-ink-soft">
                מקורות:{" "}
                {s.sourceUrls.map((url, i) => (
                  <span key={url}>
                    {i > 0 ? " · " : null}
                    <a className="underline" href={url} target="_blank" rel="noreferrer">
                      {url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
                    </a>
                  </span>
                ))}
              </p>
            ) : null}
            {s.applyUrl ? (
              <a className="mt-2 inline-block text-sm underline" href={s.applyUrl} target="_blank" rel="noreferrer">
                הגשה / מידע
              </a>
            ) : null}
          </li>
        ))}
      </ul>

      <h2 className="mt-14 font-display text-3xl text-forest-deep">טיפים והפניות (לא מלגות)</h2>
      <p className="mt-2 text-sm text-ink-soft">
        רשומות אלה אינן נספרות בקטלוג המלגות: מעטפת, הפניה לדיקן או קריטריון ניקוד בתוך מלגה אחרת.
      </p>
      <ul className="mt-6 grid gap-4">
        {tips.map((s) => (
          <li key={s.id} className="rounded-2xl border border-dashed border-line bg-card p-5">
            <h3 className="font-display text-lg text-forest-deep">{s.nameHe}</h3>
            <p className="mt-1 text-sm text-ink-soft">{s.funderHe}</p>
            <p className="mt-2 text-sm">{s.whoItsForHe}</p>
            {s.sourceUrls[0] ? (
              <a className="mt-2 inline-block text-sm underline" href={s.sourceUrls[0]} target="_blank" rel="noreferrer">
                מקור
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
