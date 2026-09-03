"use client";

import { useMemo, useState } from "react";
import type { Scholarship, ScholarshipScope, ScholarshipType } from "@/lib/types";
import { ExternalLink } from "@/components/ExternalLink";
import { HeWithEn } from "@/components/HeWithEn";
import { AmountLegend } from "@/components/AmountLegend";
import { GroupChipRow } from "@/components/GroupChipRow";
import { ScholarshipFaceChips } from "@/components/ScholarshipFaceChips";
import { deadlineSortValue, deadlineStatus, isVerificationStale, scopeLabelHe, STALE_VERIFICATION_LABEL_HE } from "@/lib/format";
import { scholarshipTypeLabel } from "@/lib/labels";
import { HE } from "@/lib/i18n/he";
import { scholarshipPagePath } from "@/lib/catalog-routes";
import { VerificationNotes } from "@/components/VerificationNotes";
import { WhatsAppShareLink } from "@/components/WhatsAppShareLink";
import Link from "next/link";

export function CatalogExplorer({
  scholarships,
  tips,
  guide = [],
}: {
  scholarships: Scholarship[];
  tips: Scholarship[];
  guide?: Scholarship[];
}) {
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<"all" | ScholarshipScope>("all");
  const [type, setType] = useState<"all" | ScholarshipType | "">("all");
  const [due, setDue] = useState<"all" | "open" | "closed" | "unpublished">("all");

  const list = useMemo(() => {
    const t = q.trim();
    const asOf = new Date();
    return scholarships
      .filter((s) => {
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
      })
      .sort((a, b) => deadlineSortValue(a.deadline, asOf) - deadlineSortValue(b.deadline, asOf));
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
      <GroupChipRow className="mt-6" />
      <AmountLegend className="mt-4" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          className="min-h-11 w-full rounded-xl border border-line bg-card px-3 py-2"
          placeholder="חיפוש מלגה"
          aria-label="חיפוש מלגה"
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
          const status = deadlineStatus(s.deadline);
          return (
            <li key={s.id} id={s.id} className="scroll-mt-24 rounded-2xl border border-line bg-card p-5">
              <div className="flex flex-wrap justify-between gap-2">
                <h2 className="font-display text-xl text-forest-deep">
                  <Link href={scholarshipPagePath(s.id)} className="underline-offset-4 hover:underline">
                    <HeWithEn text={s.nameHe} />
                  </Link>
                </h2>
              </div>
              <p className="mt-1 text-sm text-ink-soft">
                <HeWithEn text={s.funderHe} />
              </p>
              <ScholarshipFaceChips scholarship={s} className="mt-3" />
              <p className="mt-2 text-sm">{s.whoItsForHe}</p>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
                {isVerificationStale(s.lastVerified) ? (
                  <span className="rounded-full bg-warn/10 px-2 py-0.5 text-warn">{STALE_VERIFICATION_LABEL_HE}</span>
                ) : null}
                {status.kind === "closed" ? (
                  <span className="rounded-full bg-gold/20 px-2 py-0.5 text-ink">{HE.buckets.closedCycle}</span>
                ) : null}
                {s.treatment === "selective" ? (
                  <span className="rounded-full bg-warn/10 px-2 py-0.5 text-warn">{HE.buckets.selective}</span>
                ) : null}
                <span>
                  {s.types.map(scholarshipTypeLabel).join(", ")} · {scopeLabelHe(s.scope)}
                </span>
              </p>
              {s.applyUrl ? (
                <ExternalLink className="mt-2 inline-block text-sm underline ltr-isolate" href={s.applyUrl}>
                  הגשה / מידע
                </ExternalLink>
              ) : null}
              <span className="mt-2 mr-3 inline-block">
                <WhatsAppShareLink scholarship={s} />
              </span>
              <VerificationNotes scholarship={s} amountTextHe={s.amounts.textHe} />
            </li>
          );
        })}
      </ul>

      {guide.length ? (
        <>
          <h2 className="mt-14 font-display text-3xl text-forest-deep">{HE.catalog.guideSection}</h2>
          <p className="mt-2 text-sm text-ink-soft">{HE.catalog.guideHint}</p>
          <ul className="mt-6 grid gap-4">
            {guide
              .filter((s) => {
                const t = q.trim();
                if (!t) return true;
                return s.nameHe.includes(t) || s.funderHe.includes(t) || s.whoItsForHe.includes(t);
              })
              .map((s) => {
                return (
                  <li key={s.id} id={s.id} className="scroll-mt-24 rounded-2xl border border-dashed border-line bg-paper-deep/40 p-5">
                    <div className="flex flex-wrap justify-between gap-2">
                      <h3 className="font-display text-xl text-forest-deep">
                        <Link href={scholarshipPagePath(s.id)} className="underline-offset-4 hover:underline">
                          <HeWithEn text={s.nameHe} />
                        </Link>
                      </h3>
                      <span className="rounded-full bg-paper-deep px-2 py-0.5 text-sm text-ink-soft">
                        {HE.buckets.guide}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink-soft">
                      <HeWithEn text={s.funderHe} />
                    </p>
                    <p className="mt-2 text-sm">{s.whoItsForHe}</p>
                    <ScholarshipFaceChips scholarship={s} className="mt-3" />
                    {s.applyUrl ? (
                      <ExternalLink className="mt-2 inline-block text-sm underline ltr-isolate" href={s.applyUrl}>
                        הגשה / מידע
                      </ExternalLink>
                    ) : null}
                    <VerificationNotes scholarship={s} amountTextHe={s.amounts.textHe} />
                  </li>
                );
              })}
          </ul>
        </>
      ) : null}

      <h2 className="mt-14 font-display text-3xl text-forest-deep">{HE.buckets.tips}</h2>
      <p className="mt-2 text-sm text-ink-soft">הפניות — לא מלגות.</p>
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
