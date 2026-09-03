"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SCHOLARSHIPS, TIPS } from "@/data/scholarships";
import { uniqueMatchableByApplyUrl } from "@/lib/catalog";
import { ProfileLoadingFallback } from "@/components/ProfileLoadingFallback";
import { loadProfileHydratingShare } from "@/lib/profile-share";
import { groupMatches, matchAll } from "@/lib/matcher";
import { missingFieldUnlocks, mostUrgentOpen } from "@/lib/match-insights";
import {
  NO_DOUBLE_COUNT_CAVEAT_HE,
  matchingNowHeadlineHe,
  potentialHeadlineHe,
  potentialOpenAmount,
  upcomingCloseDates,
  unifiedDocuments,
} from "@/lib/report-conversion";
import { FAST_REPORT_FIELDS, WIZARD_FIELDS, profileFocusHref } from "@/lib/profile-fields";
import { profileIsEmpty } from "@/lib/profile-storage";
import type { ScholarshipMatch, ScholarshipScope, StudentProfile } from "@/lib/types";
import { amountSortValue, deadlineSortValue, deadlineStatus, formatDeadline, shouldHideIcs } from "@/lib/format";
import { fieldLabelHe } from "@/lib/labels";
import { AmountLegend } from "@/components/AmountLegend";
import { CopyReportLink } from "@/components/CopyReportLink";
import { CoverageNote } from "@/components/CoverageNote";
import { CatalogAgeBanner } from "@/components/CatalogAgeBanner";
import { EmptyBucket, ScholarshipCard } from "@/components/ScholarshipCard";
import { useTracking } from "@/components/TrackingProvider";
import { downloadCombinedIcs, downloadIcs } from "@/lib/ics";
import { HE } from "@/lib/i18n/he";

type SortKey = "amount" | "deadline" | "name";

const MATCH_CATALOG = uniqueMatchableByApplyUrl(SCHOLARSHIPS);

function passesAmountFilter(match: ScholarshipMatch, minAmount: number): boolean {
  if (minAmount <= 0) return true;
  const v = amountSortValue(match.scholarship.amounts);
  if (v == null) return true;
  return v >= minAmount;
}

export function ResultsView() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [query, setQuery] = useState("");
  const [minAmount, setMinAmount] = useState(0);
  const [scope, setScope] = useState<"all" | ScholarshipScope>("all");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState<SortKey>("deadline");
  const [showIneligible, setShowIneligible] = useState(false);
  const { tracking } = useTracking();
  const asOf = useMemo(() => new Date(), []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client storage
    setProfile(loadProfileHydratingShare());
  }, []);

  useEffect(() => {
    const openAll = () => {
      document.querySelectorAll("details").forEach((el) => {
        el.setAttribute("open", "");
      });
    };
    window.addEventListener("beforeprint", openAll);
    return () => window.removeEventListener("beforeprint", openAll);
  }, []);

  const allMatches = useMemo(() => {
    if (!profile) return [];
    return matchAll(MATCH_CATALOG, profile, { asOf });
  }, [profile, asOf]);

  const grouped = useMemo(() => {
    if (!profile) return null;
    return groupMatches(allMatches);
  }, [profile, allMatches]);

  const tipMatches = useMemo(() => {
    if (!profile) return [];
    return matchAll(TIPS, profile, { asOf }).filter(
      (m) => m.bucket === "eligible" || m.bucket === "needInfo",
    );
  }, [profile, asOf]);

  const applyFilters = useMemo(() => {
    return (list: ScholarshipMatch[]) => {
      let next = list;
      if (query.trim()) {
        const q = query.trim();
        next = next.filter(
          (m) => m.scholarship.nameHe.includes(q) || m.scholarship.funderHe.includes(q),
        );
      }
      if (minAmount > 0) {
        next = next.filter((m) => passesAmountFilter(m, minAmount));
      }
      if (scope !== "all") {
        next = next.filter((m) => m.scholarship.scope === scope);
      }
      if (type !== "all") {
        next = next.filter((m) => m.scholarship.types.includes(type as never));
      }
      next = [...next].sort((a, b) => {
        if (sort === "name") return a.scholarship.nameHe.localeCompare(b.scholarship.nameHe, "he");
        if (sort === "deadline") {
          return (
            deadlineSortValue(a.scholarship.deadline, asOf) -
            deadlineSortValue(b.scholarship.deadline, asOf)
          );
        }
        const av = amountSortValue(a.scholarship.amounts) ?? -1;
        const bv = amountSortValue(b.scholarship.amounts) ?? -1;
        return bv - av;
      });
      return next;
    };
  }, [query, minAmount, scope, type, sort, asOf]);

  if (profile === null) {
    return <ProfileLoadingFallback />;
  }

  if (profileIsEmpty(profile)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-display text-3xl text-forest-deep">{HE.profile.emptyTitle}</h1>
        <p className="mt-3 text-ink-soft">{HE.profile.emptyBody}</p>
        <div className="mt-6">
          <Link
            href="/chat"
            className="inline-flex min-h-11 items-center rounded-full bg-clay px-6 py-3 text-white"
          >
            {HE.actions.chatIntake}
          </Link>
        </div>
      </div>
    );
  }

  if (!grouped) return null;

  const eligible = applyFilters(grouped.eligible);
  const closedCycle = applyFilters(grouped.closedCycle);
  const needInfo = applyFilters(grouped.needInfo);
  const nearMiss = applyFilters(grouped.nearMiss);
  const checkAtInstitution = applyFilters(grouped.checkAtInstitution);
  const ineligible = applyFilters(grouped.ineligible);
  const filtersOn = Boolean(query.trim()) || minAmount > 0 || scope !== "all" || type !== "all";

  const myListIds = new Set(Object.keys(tracking));
  const myList = applyFilters(
    [
      ...grouped.eligible,
      ...grouped.closedCycle,
      ...grouped.needInfo,
      ...grouped.nearMiss,
      ...grouped.checkAtInstitution,
      ...grouped.ineligible,
    ].filter((m) => myListIds.has(m.scholarship.id)),
  );

  const visibleActionable = [...eligible, ...needInfo, ...nearMiss];
  const urgent = mostUrgentOpen(visibleActionable, asOf, 3);
  const unlocks = missingFieldUnlocks(allMatches);
  const topUnlock = unlocks[0];
  const potential = potentialOpenAmount(allMatches, asOf);
  const timeline = upcomingCloseDates(allMatches, asOf);
  const docs = unifiedDocuments(allMatches);
  const remainingUnlocks = unlocks.filter(({ field }) => !FAST_REPORT_FIELDS.includes(field));
  const fastFieldsFilled = FAST_REPORT_FIELDS.some((f) => {
    const v = profile[f];
    return !(v === null || v === undefined || (Array.isArray(v) && v.length === 0));
  });
  const remainingWizard = WIZARD_FIELDS.filter((f) => {
    const v = profile[f];
    return v === null || v === undefined || (Array.isArray(v) && v.length === 0);
  });
  const isPartialProfile = remainingWizard.length > 0;

  const filterControls = (
    <>
      <input
        className="min-h-11 rounded-xl border border-line px-3 py-2"
        placeholder="חיפוש לפי שם או קרן"
        aria-label="חיפוש מלגות לפי שם או קרן"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (e.target.value.trim()) setShowIneligible(true);
        }}
      />
      <select
        className="min-h-11 rounded-xl border border-line px-3 py-2"
        value={sort}
        aria-label="מיון תוצאות"
        onChange={(e) => setSort(e.target.value as SortKey)}
      >
        <option value="deadline">מיון לפי מועד</option>
        <option value="amount">מיון לפי סכום</option>
        <option value="name">מיון לפי שם</option>
      </select>
      <select
        className="min-h-11 rounded-xl border border-line px-3 py-2"
        value={scope}
        aria-label="סינון לפי היקף"
        onChange={(e) => setScope(e.target.value as typeof scope)}
      >
        <option value="all">כל ההיקפים</option>
        <option value="national">ארצי</option>
        <option value="institution">מוסדי</option>
        <option value="municipal">עירוני</option>
        <option value="regional">אזורי</option>
      </select>
      <select
        className="min-h-11 rounded-xl border border-line px-3 py-2"
        value={type}
        aria-label="סינון לפי סוג מלגה"
        onChange={(e) => setType(e.target.value)}
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
        className="min-h-11 rounded-xl border border-line px-3 py-2"
        value={minAmount}
        aria-label="סינון לפי סכום מינימלי"
        onChange={(e) => setMinAmount(Number(e.target.value))}
      >
        <option value={0}>כל הסכומים</option>
        <option value={5000}>מ־5,000 ₪</option>
        <option value={10000}>מ־10,000 ₪</option>
        <option value={20000}>מ־20,000 ₪</option>
      </select>
    </>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-forest-deep">{HE.results.title}</h1>
          <p className="mt-2 text-ink-soft" aria-live="polite">
            {eligible.length} {HE.buckets.eligible} · {needInfo.length} {HE.chat.needInfoHuman} · {nearMiss.length}{" "}
            {HE.buckets.nearMiss} · {checkAtInstitution.length} {HE.buckets.guide} ·{" "}
            {closedCycle.length} {HE.buckets.closedCycle} · {ineligible.length} {HE.buckets.ineligible}
            {filtersOn ? HE.results.afterFilter : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <Link href="/profile" className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm">
            {HE.results.editProfile}
          </Link>
          <CopyReportLink profile={profile} />
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-11 items-center rounded-full bg-forest px-4 text-sm text-white"
          >
            {HE.actions.print}
          </button>
        </div>
      </div>
      <AmountLegend className="mt-3 no-print" />
      <p className="mt-2 text-xs text-ink-soft no-print">{HE.results.iphonePrint}</p>

      <section className="mt-6 rounded-2xl border border-forest/20 bg-forest/5 p-5" aria-label="מלגות שמתאימות">
        <p className="font-display text-2xl text-forest-deep">{matchingNowHeadlineHe(eligible.length)}</p>
        <p className="mt-2 text-sm text-ink-soft leading-relaxed">{potentialHeadlineHe(potential)}</p>
        <p className="mt-2 text-sm text-ink-soft leading-relaxed">{NO_DOUBLE_COUNT_CAVEAT_HE}</p>
        {potential.missingAmountCount > 0 ? (
          <p className="mt-2 text-sm text-ink-soft">
            {HE.results.missingAmounts.replace("{n}", String(potential.missingAmountCount))}
          </p>
        ) : null}
      </section>

      {isPartialProfile ? (
        <section className="no-print mt-6 rounded-2xl border border-info/30 bg-info/5 p-5">
          <h2 className="font-display text-xl text-forest-deep">{HE.results.completeToUnlock}</h2>
          <p className="mt-2 text-sm text-ink-soft">
            {fastFieldsFilled ? HE.results.fastPartial : "אפשר להמשיך באשף המלא כדי לפתוח עוד התאמות."}
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {(remainingUnlocks.length ? remainingUnlocks : unlocks).slice(0, 8).map(({ field, count }) => (
              <li key={field}>
                <Link href={profileFocusHref(field)} className="text-forest underline underline-offset-4">
                  {HE.results.fillFieldUnlock
                    .replace("{field}", fieldLabelHe(field))
                    .replace("{n}", String(count))}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/profile/"
            className="mt-4 inline-flex min-h-11 items-center rounded-full bg-forest px-4 text-sm text-white"
          >
            {HE.actions.completeProfile}
          </Link>
        </section>
      ) : null}

      <section className="mt-6 rounded-2xl border border-line bg-card p-5" aria-label="מועדי סגירה">
        <h2 className="font-display text-xl text-forest-deep">{HE.results.timelineTitle}</h2>
        {timeline.length ? (
          <ol className="mt-3 space-y-2 text-sm">
            {timeline.map((m) => (
              <li key={m.scholarship.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <a href={`#${m.scholarship.id}`} className="font-medium text-forest underline underline-offset-4">
                    {m.scholarship.nameHe}
                  </a>
                  <span className="text-ink-soft">
                    {" — "}
                    {m.scholarship.deadline.date} · {formatDeadline(m.scholarship.deadline)}
                  </span>
                </span>
                {!shouldHideIcs(m.scholarship.deadline, asOf) ? (
                  <button
                    type="button"
                    className="no-print min-h-11 rounded-full border border-line px-3 text-sm"
                    onClick={() => downloadIcs(m.scholarship)}
                  >
                    {HE.actions.addToCalendar}
                  </button>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-ink-soft">{HE.results.timelineNone}</p>
        )}
      </section>

      {docs.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-line bg-card p-5">
          <h2 className="font-display text-xl text-forest-deep">{HE.results.documentsTitle}</h2>
          <p className="mt-1 text-sm text-ink-soft">{HE.results.documentsHint}</p>
          <ul className="mt-3 space-y-1 text-sm">
            {docs.slice(0, 20).map((d) => (
              <li key={d.documentHe}>
                <span className="font-medium">{d.documentHe}</span>
                <span className="text-ink-soft"> — {d.count} מלגות</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="no-print mt-6 rounded-2xl border border-line bg-card p-5" aria-label="סיכום פעולה">
        <h2 className="font-display text-xl text-forest-deep">{HE.results.urgentTitle}</h2>
        {urgent.length ? (
          <ol className="mt-3 space-y-2 text-sm">
            {urgent.map((m) => {
              const status = deadlineStatus(m.scholarship.deadline, asOf);
              return (
                <li key={m.scholarship.id}>
                  <a href={`#${m.scholarship.id}`} className="font-medium text-forest underline underline-offset-4">
                    {m.scholarship.nameHe}
                  </a>
                  <span className="text-ink-soft">
                    {" — "}
                    {status.labelHe}
                    {m.scholarship.deadline.date ? ` · ${m.scholarship.deadline.date}` : ""}
                  </span>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-ink-soft">{HE.results.urgentNone}</p>
        )}
        {topUnlock ? (
          <p className="mt-4 text-sm">
            <Link href={profileFocusHref(topUnlock.field)} className="font-medium text-forest underline underline-offset-4">
              {HE.results.fillFieldUnlock
                .replace("{field}", fieldLabelHe(topUnlock.field))
                .replace("{n}", String(topUnlock.count))}
            </Link>
          </p>
        ) : null}
      </section>

      <table className="print-summary mt-6 hidden w-full text-sm print:table">
        <caption className="mb-2 text-right font-medium">{HE.results.printSummary}</caption>
        <thead>
          <tr>
            <th className="border-b p-2 text-right">קטגוריה</th>
            <th className="border-b p-2 text-right">מספר</th>
          </tr>
        </thead>
        <tbody>
          {[
            [HE.buckets.eligible, eligible.length],
            [HE.buckets.needInfo, needInfo.length],
            [HE.buckets.nearMiss, nearMiss.length],
            [HE.buckets.guideLong, checkAtInstitution.length],
            [HE.buckets.closedCycleLong, closedCycle.length],
            [HE.buckets.ineligible, ineligible.length],
          ].map(([label, n]) => (
            <tr key={String(label)}>
              <td className="border-b p-2">{label}</td>
              <td className="border-b p-2">{n}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <nav
        aria-label="מעבר בין קטגוריות הדוח"
        className="no-print mt-6 flex flex-wrap gap-2 rounded-2xl border border-line bg-card p-3"
      >
        <a href="#near-miss" className="inline-flex min-h-11 items-center rounded-full bg-warn/15 px-3 text-sm font-medium text-warn">
          {HE.buckets.nearMiss} ({nearMiss.length})
        </a>
        <a href="#eligible" className="inline-flex min-h-11 items-center rounded-full bg-ok/10 px-3 text-sm text-ok">
          {HE.buckets.eligible} ({eligible.length})
        </a>
        <a href="#need-info" className="inline-flex min-h-11 items-center rounded-full bg-info/10 px-3 text-sm text-info">
          חסר פרט ({needInfo.length})
        </a>
        <a href="#check-at-institution" className="inline-flex min-h-11 items-center rounded-full bg-paper-deep px-3 text-sm text-ink-soft">
          {HE.buckets.guide} ({checkAtInstitution.length})
        </a>
        <a href="#closed-cycle" className="inline-flex min-h-11 items-center rounded-full bg-gold/20 px-3 text-sm">
          {HE.buckets.closedCycle} ({closedCycle.length})
        </a>
        <a href="#my-list" className="inline-flex min-h-11 items-center rounded-full bg-forest/10 px-3 text-sm">
          {HE.buckets.myList} ({myList.length})
        </a>
        <a href="#ineligible" className="inline-flex min-h-11 items-center rounded-full bg-paper-deep px-3 text-sm">
          {HE.buckets.ineligible} ({ineligible.length})
        </a>
      </nav>

      <details className="no-print mt-4 rounded-2xl border border-line bg-card p-4 max-sm:block sm:hidden">
        <summary className="min-h-11 cursor-pointer text-sm font-medium">{HE.actions.showFilters}</summary>
        <div className="mt-3 grid gap-3">{filterControls}</div>
      </details>
      <div className="no-print mt-4 hidden gap-3 rounded-2xl border border-line bg-card p-4 sm:grid sm:grid-cols-2 lg:grid-cols-5">
        {filterControls}
      </div>

      <section id="near-miss" className="mt-10 scroll-mt-28 rounded-3xl border-2 border-warn/40 bg-warn/5 p-5">
        <h2 className="font-display text-2xl">
          {HE.buckets.nearMiss} ({nearMiss.length})
        </h2>
        <p className="mt-1 text-sm text-ink-soft">{HE.results.nearMissFeatured}</p>
        <div className="mt-4 grid gap-4">
          {nearMiss.length ? nearMiss.map((m) => <ScholarshipCard key={m.scholarship.id} match={m} defaultOpen />) : <EmptyBucket />}
        </div>
      </section>

      <section id="eligible" className="mt-10 scroll-mt-28">
        <h2 className="font-display text-2xl">
          {HE.buckets.eligible} ({eligible.length})
        </h2>
        <p className="mt-1 text-sm text-ink-soft">{HE.buckets.eligibleHint}</p>
        <div className="mt-4 grid gap-4">
          {eligible.length ? eligible.map((m, i) => (
            <ScholarshipCard key={m.scholarship.id} match={m} defaultOpen={i === 0} />
          )) : <EmptyBucket />}
        </div>
      </section>

      <section id="need-info" className="mt-10 scroll-mt-28">
        <h2 className="font-display text-2xl">
          {HE.buckets.needInfo} ({needInfo.length})
        </h2>
        <p className="mt-1 text-sm text-ink-soft">חסר תשובה אחת כדי לדעת אם מתאים.</p>
        <div className="mt-4 grid gap-4">
          {needInfo.length ? needInfo.map((m) => <ScholarshipCard key={m.scholarship.id} match={m} />) : <EmptyBucket />}
        </div>
      </section>

      <section id="check-at-institution" className="mt-10 scroll-mt-28">
        <h2 className="font-display text-2xl text-ink-soft">
          {HE.buckets.guideLong} ({checkAtInstitution.length})
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          {HE.catalog.guideHint}
        </p>
        <div className="mt-4 grid gap-4 opacity-90">
          {checkAtInstitution.length ? checkAtInstitution.map((m) => (
            <ScholarshipCard key={m.scholarship.id} match={m} />
          )) : <EmptyBucket />}
        </div>
      </section>

      <section id="closed-cycle" className="mt-10 scroll-mt-28">
        <h2 className="font-display text-2xl">
          {HE.buckets.closedCycleLong} ({closedCycle.length})
        </h2>
        <p className="mt-1 text-sm text-ink-soft">התאריך עבר. אפשר לנסות במחזור הבא.</p>
        <div className="mt-4 grid gap-4">
          {closedCycle.length ? closedCycle.map((m) => (
            <ScholarshipCard key={m.scholarship.id} match={m} />
          )) : <EmptyBucket />}
        </div>
      </section>

      <section id="my-list" className="mt-10 scroll-mt-28">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl">
            {HE.buckets.myList} ({myList.length})
          </h2>
          {myList.some((m) => !shouldHideIcs(m.scholarship.deadline, asOf)) ? (
            <button
              type="button"
              className="no-print min-h-11 rounded-full border border-line px-4 text-sm"
              onClick={() =>
                downloadCombinedIcs(
                  myList.filter((m) => !shouldHideIcs(m.scholarship.deadline, asOf)).map((m) => m.scholarship),
                )
              }
            >
              {HE.actions.exportMyListIcs}
            </button>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-ink-soft">מלגות ששמרתם.</p>
        <div className="mt-4 grid gap-4">
          {myList.length ? myList.map((m) => <ScholarshipCard key={m.scholarship.id} match={m} />) : <EmptyBucket />}
        </div>
      </section>

      <section id="ineligible" className="mt-10 scroll-mt-28 print-ineligible">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl">
            {HE.buckets.ineligible} ({ineligible.length})
          </h2>
          <button
            type="button"
            className="no-print text-sm underline underline-offset-4"
            onClick={() => setShowIneligible((v) => !v)}
          >
            {showIneligible ? HE.actions.hide : HE.actions.showIneligible}
          </button>
        </div>
        <p className="mt-1 text-sm text-ink-soft">מוסתר כדי שלא יבלבל. אפשר לפתוח.</p>
        {showIneligible ? (
          <div className="mt-4 grid gap-4 no-print">
            {ineligible.length ? ineligible.map((m) => <ScholarshipCard key={m.scholarship.id} match={m} />) : <EmptyBucket />}
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink-soft no-print">לחצו «הצג» כדי לחפש גם כאן.</p>
        )}
        <div className="mt-4 hidden print:grid gap-1">
          {ineligible.map((m) => (
            <ScholarshipCard key={m.scholarship.id} match={m} compact />
          ))}
        </div>
      </section>

      {tipMatches.length > 0 ? (
        <section id="tips" className="mt-10 scroll-mt-28">
          <h2 className="font-display text-2xl">
            {HE.buckets.tips} ({tipMatches.length})
          </h2>
          <p className="mt-1 text-sm text-ink-soft">הפניות — לא מלגות.</p>
          <div className="mt-4 grid gap-4">
            {tipMatches.map((m) => (
              <ScholarshipCard key={m.scholarship.id} match={m} />
            ))}
          </div>
        </section>
      ) : null}

      <CatalogAgeBanner className="mt-12" />
      <CoverageNote className="mt-4" />
    </div>
  );
}
