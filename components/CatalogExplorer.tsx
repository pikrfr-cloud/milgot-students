"use client";

import { useMemo, useState } from "react";
import type { Scholarship, ScholarshipScope, ScholarshipType } from "@/lib/types";
import { ExternalLink } from "@/components/ExternalLink";
import { HeWithEn } from "@/components/HeWithEn";
import { deadlineStatus, formatAmount, formatDeadline, scopeLabelHe } from "@/lib/format";
import { scholarshipTypeLabel } from "@/lib/labels";
import { bestSourceLevel, sourceLevelLabelHe } from "@/lib/sources";
import { HE } from "@/lib/i18n/he";

export function CatalogExplorer({
  scholarships,
  tips,
}: {
  scholarships: Scholarship[];
  tips: Scholarship[];
}) {
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<"all" | ScholarshipScope>("all");
  const [type, setType] = useState<"all" | ScholarshipType | "">("all");
  const [due, setDue] = useState<"all" | "open" | "closed" | "unpublished">("all");

  const list = useMemo(() => {
    const t = q.trim();
    return scholarships.filter((s) => {
      if (t && !(s.nameHe.includes(t) || s.funderHe.includes(t) || s.whoItsForHe.includes(t))) {
        return false;
      }
      if (scope !== "all" && s.scope !== scope) return false;
      if (type !== "all" && type && !s.types.includes(type as ScholarshipType)) return false;
      if (due !== "all") {
        const kind = deadlineStatus(s.deadline).kind;
        if (due === "open" && kind !== "open" && kind !== "closingSoon" && kind !== "rolling" && kind !== "notYetOpen") {
          return false;
        }
        if (due === "closed" && kind !== "closed") return false;
        if (due === "unpublished" && kind !== "unpublished") return false;
      }
      return true;
    });
  }, [scholarships, q, scope, type, due]);

  const tipList = useMemo(() => {
    const t = q.trim();
    if (!t) return tips;
    return tips.filter(
      (s) => s.nameHe.includes(t) || s.funderHe.includes(t) || s.whoItsForHe.includes(t),
    );
  }, [tips, q]);

  return (
    <>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          className="min-h-11 w-full rounded-xl border border-line bg-card px-3 py-2"
          placeholder="חיפוש בקטלוג"
          aria-label="חיפוש בקטלוג המלגות"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="min-h-11 rounded-xl border border-line bg-card px-3"
          aria-label="סינון לפי היקף"
          value={scope}
          onChange={(e) => setScope(e.target.value as typeof scope)}
        >
          <option value="all">כל ההיקפים</option>
          <option value="national">ארצי</option>
          <option value="institution">מוסדי</option>
          <option value="municipal">עירוני</option>
          <option value="regional">אזורי</option>
        </select>
        <select
          className="min-h-11 rounded-xl border border-line bg-card px-3"
          aria-label="סינון לפי סוג"
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
        >
          <option value="all">כל הסוגים</option>
          <option value="need">סיוע כלכלי</option>
          <option value="merit">הצטיינות</option>
          <option value="volunteering">התנדבות</option>
          <option value="leadership">מנהיגות</option>
          <option value="population">אוכלוסייה ייעודית</option>
          <option value="periphery">פריפריה</option>
          <option value="service">שירות / מילואים</option>
          <option value="research">מחקר</option>
          <option value="loan">הלוואה</option>
        </select>
        <select
          className="min-h-11 rounded-xl border border-line bg-card px-3"
          aria-label="סינון לפי מועד"
          value={due}
          onChange={(e) => setDue(e.target.value as typeof due)}
        >
          <option value="all">כל המועדים</option>
          <option value="open">פתוח / נפתח</option>
          <option value="closed">נסגר למחזור זה</option>
          <option value="unpublished">מועד טרם פורסם</option>
        </select>
      </div>
      <ul className="mt-8 grid gap-4">
        {list.map((s) => {
          const grade = s.sourceLevel ?? bestSourceLevel(s.sourceUrls);
          const status = deadlineStatus(s.deadline);
          return (
            <li key={s.id} id={s.id} className="scroll-mt-24 rounded-2xl border border-line bg-card p-5">
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
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
                {status.kind === "closed" ? (
                  <span className="rounded-full bg-gold/20 px-2 py-0.5 text-ink">{HE.buckets.closedCycle}</span>
                ) : null}
                {s.deadline.windowHe ? (
                  <span className="rounded-full bg-paper-deep px-2 py-0.5">{s.deadline.windowHe}</span>
                ) : null}
                <span>
                  {status.labelHe} · {formatDeadline(s.deadline)} · {s.types.map(scholarshipTypeLabel).join(", ")} ·{" "}
                  {scopeLabelHe(s.scope)}
                </span>
              </p>
              <p className="mt-2 text-xs">
                <span
                  className={`rounded-full px-2 py-0.5 ${
                    grade === "official_page"
                      ? "bg-ok/10 text-ok"
                      : grade === "institution_site"
                        ? "bg-info/10 text-info"
                        : "bg-warn/10 text-warn"
                  }`}
                >
                  {sourceLevelLabelHe(grade)}
                </span>
              </p>
              {s.sourceUrls.length > 0 ? (
                <p className="mt-2 text-xs text-ink-soft">
                  מקורות:{" "}
                  {s.sourceUrls.map((url, i) => (
                    <span key={url}>
                      {i > 0 ? " · " : null}
                      <ExternalLink className="underline ltr-isolate" href={url}>
                        {url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
                      </ExternalLink>
                    </span>
                  ))}
                </p>
              ) : null}
              {s.applyUrl ? (
                <ExternalLink className="mt-2 inline-block text-sm underline ltr-isolate" href={s.applyUrl}>
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
        {tipList.map((s) => (
          <li key={s.id} id={s.id} className="scroll-mt-24 rounded-2xl border border-dashed border-line bg-card p-5">
            <h3 className="font-display text-lg text-forest-deep">
              <HeWithEn text={s.nameHe} />
            </h3>
            <p className="mt-1 text-sm text-ink-soft">
              <HeWithEn text={s.funderHe} />
            </p>
            <p className="mt-2 text-sm">{s.whoItsForHe}</p>
            {s.sourceUrls[0] ? (
              <ExternalLink className="mt-2 inline-block text-sm underline ltr-isolate" href={s.sourceUrls[0]}>
                מקור
              </ExternalLink>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
