"use client";

import { useMemo, useState } from "react";
import { SCHOLARSHIPS, TIPS } from "@/data/scholarships";
import { CoverageNote } from "@/components/CoverageNote";
import { ExternalLink } from "@/components/ExternalLink";
import { HeWithEn } from "@/components/HeWithEn";
import { deadlineStatus, formatAmount, formatDeadline, scopeLabelHe } from "@/lib/format";
import { scholarshipTypeLabel } from "@/lib/labels";
import { bestSourceGrade, sourceGradeLabelHe } from "@/lib/sources";

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
        {list.map((s) => {
          const grade = s.sourceGrade ?? bestSourceGrade(s.sourceUrls);
          const due = deadlineStatus(s.deadline);
          return (
            <li key={s.id} className="rounded-2xl border border-line bg-card p-5">
              <div className="flex flex-wrap justify-between gap-2">
                <h2 className="font-display text-xl text-forest-deep">
                  <HeWithEn text={s.nameHe} />
                </h2>
                <span className="text-sm">{formatAmount(s.amounts)}</span>
              </div>
              <p className="mt-1 text-sm text-ink-soft">
                <HeWithEn text={s.funderHe} />
              </p>
              <p className="mt-2 text-sm">{s.whoItsForHe}</p>
              <p className="mt-2 text-sm text-ink-soft">
                {due.labelHe} · {formatDeadline(s.deadline)} · {s.types.map(scholarshipTypeLabel).join(", ")} ·{" "}
                {scopeLabelHe(s.scope)}
              </p>
              <p className="mt-2 text-xs">
                <span
                  className={`rounded-full px-2 py-0.5 ${
                    grade === "dedicated"
                      ? "bg-ok/10 text-ok"
                      : grade === "homepage"
                        ? "bg-info/10 text-info"
                        : "bg-warn/10 text-warn"
                  }`}
                >
                  {sourceGradeLabelHe(grade)}
                </span>
              </p>
              {s.sourceUrls.length > 0 ? (
                <p className="mt-2 text-xs text-ink-soft">
                  מקורות:{" "}
                  {s.sourceUrls.map((url, i) => (
                    <span key={url}>
                      {i > 0 ? " · " : null}
                      <ExternalLink className="underline" href={url}>
                        {url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
                      </ExternalLink>
                    </span>
                  ))}
                </p>
              ) : null}
              {s.applyUrl ? (
                <ExternalLink className="mt-2 inline-block text-sm underline" href={s.applyUrl}>
                  הגשה / מידע
                </ExternalLink>
              ) : null}
            </li>
          );
        })}
      </ul>

      <h2 className="mt-14 font-display text-3xl text-forest-deep">טיפים והפניות (לא מלגות)</h2>
      <p className="mt-2 text-sm text-ink-soft">
        רשומות אלה אינן נספרות בקטלוג המלגות: מעטפת, הפניה לדיקן או קריטריון ניקוד בתוך מלגה אחרת.
      </p>
      <ul className="mt-6 grid gap-4">
        {tips.map((s) => (
          <li key={s.id} className="rounded-2xl border border-dashed border-line bg-card p-5">
            <h3 className="font-display text-lg text-forest-deep">
              <HeWithEn text={s.nameHe} />
            </h3>
            <p className="mt-1 text-sm text-ink-soft">
              <HeWithEn text={s.funderHe} />
            </p>
            <p className="mt-2 text-sm">{s.whoItsForHe}</p>
            {s.sourceUrls[0] ? (
              <ExternalLink className="mt-2 inline-block text-sm underline" href={s.sourceUrls[0]}>
                מקור
              </ExternalLink>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
