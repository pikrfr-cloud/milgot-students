"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SCHOLARSHIPS, TIPS } from "@/data/scholarships";
import { groupMatches, matchAll } from "@/lib/matcher";
import { loadProfile, profileIsEmpty } from "@/lib/profile-storage";
import type { ScholarshipMatch, ScholarshipScope, StudentProfile } from "@/lib/types";
import { amountSortValue, deadlineSortValue } from "@/lib/format";
import { CoverageNote } from "@/components/CoverageNote";
import { EmptyBucket, ScholarshipCard } from "@/components/ScholarshipCard";

type SortKey = "amount" | "deadline" | "name";

export function ResultsView() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [query, setQuery] = useState("");
  const [minAmount, setMinAmount] = useState(0);
  const [scope, setScope] = useState<"all" | ScholarshipScope>("all");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState<SortKey>("amount");
  const [showIneligible, setShowIneligible] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client storage
    setProfile(loadProfile());
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

  const grouped = useMemo(() => {
    if (!profile) return null;
    return groupMatches(matchAll(SCHOLARSHIPS, profile));
  }, [profile]);

  const tipMatches = useMemo(() => {
    if (!profile) return [];
    return matchAll(TIPS, profile).filter((m) => m.bucket === "eligible" || m.bucket === "needInfo");
  }, [profile]);

  function applyFilters(list: ScholarshipMatch[]) {
    let next = list;
    if (query.trim()) {
      const q = query.trim();
      next = next.filter(
        (m) => m.scholarship.nameHe.includes(q) || m.scholarship.funderHe.includes(q),
      );
    }
    if (minAmount > 0) {
      next = next.filter((m) => amountSortValue(m.scholarship.amounts) >= minAmount);
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
        const now = new Date();
        return deadlineSortValue(a.scholarship.deadline, now) - deadlineSortValue(b.scholarship.deadline, now);
      }
      return amountSortValue(b.scholarship.amounts) - amountSortValue(a.scholarship.amounts);
    });
    return next;
  }

  if (profile === null) {
    return <p className="px-4 py-16 text-center text-ink-soft">טוען את הפרופיל…</p>;
  }

  if (profileIsEmpty(profile)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-display text-3xl text-forest-deep">אין עדיין פרופיל</h1>
        <p className="mt-3 text-ink-soft">כדי לקבל דוח זכאות יש למלא את הפרטים פעם אחת.</p>
        <Link
          href="/profile"
          className="mt-6 inline-flex rounded-full bg-forest px-6 py-3 text-white"
        >
          למילוי הפרופיל
        </Link>
      </div>
    );
  }

  if (!grouped) return null;

  const eligible = applyFilters(grouped.eligible);
  const needInfo = applyFilters(grouped.needInfo);
  const nearMiss = applyFilters(grouped.nearMiss);
  const ineligible = applyFilters(grouped.ineligible);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-forest-deep">דוח הזכאות</h1>
          <p className="mt-2 text-ink-soft">
            {grouped.eligible.length} זכאים עכשיו · {grouped.needInfo.length} חסר פרט ·{" "}
            {grouped.nearMiss.length} כמעט זכאים · {grouped.ineligible.length} לא זכאים
          </p>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <Link href="/profile" className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm">
            לערוך פרופיל
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-11 items-center rounded-full bg-forest px-4 text-sm text-white"
          >
            שמור PDF
          </button>
        </div>
      </div>
      <CoverageNote className="mt-4" />

      <nav
        aria-label="מעבר בין קטגוריות הדוח"
        className="no-print mt-6 flex flex-wrap gap-2 rounded-2xl border border-line bg-card/95 p-3 md:sticky md:top-16 md:z-30 md:backdrop-blur-sm"
      >
        <a href="#eligible" className="inline-flex min-h-11 items-center rounded-full bg-ok/10 px-3 text-sm text-ok">
          זכאים עכשיו ({eligible.length})
        </a>
        <a href="#need-info" className="inline-flex min-h-11 items-center rounded-full bg-info/10 px-3 text-sm text-info">
          חסר פרט ({needInfo.length})
        </a>
        <a href="#near-miss" className="inline-flex min-h-11 items-center rounded-full bg-warn/10 px-3 text-sm text-warn">
          כמעט זכאים ({nearMiss.length})
        </a>
        <a href="#ineligible" className="inline-flex min-h-11 items-center rounded-full bg-paper-deep px-3 text-sm">
          לא זכאים ({ineligible.length})
        </a>
      </nav>

      <div className="no-print mt-4 grid gap-3 rounded-2xl border border-line bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
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
          <option value="amount">מיון לפי סכום</option>
          <option value="deadline">מיון לפי מועד</option>
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
          <option value="population">אוכלוסייה ייעודית</option>
          <option value="periphery">פריפריה</option>
          <option value="service">שירות / מילואים</option>
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
      </div>

      <section id="eligible" className="mt-10 scroll-mt-28">
        <h2 className="font-display text-2xl">זכאים עכשיו ({eligible.length})</h2>
        <p className="mt-1 text-sm text-ink-soft">כל הכללים המובְנים מתקיימים לפי הפרופיל.</p>
        <div className="mt-4 grid gap-4">
          {eligible.length ? eligible.map((m, i) => (
            <ScholarshipCard key={m.scholarship.id} match={m} defaultOpen={i === 0} />
          )) : <EmptyBucket />}
        </div>
      </section>

      <section id="need-info" className="mt-10 scroll-mt-28">
        <h2 className="font-display text-2xl">חסר פרט לאישור ({needInfo.length})</h2>
        <p className="mt-1 text-sm text-ink-soft">
          אף קריטריון לא נכשל, אבל שדה שדולג נדרש. מלאו אותו בפרופיל כדי לאשר.
        </p>
        <div className="mt-4 grid gap-4">
          {needInfo.length ? needInfo.map((m) => <ScholarshipCard key={m.scholarship.id} match={m} />) : <EmptyBucket />}
        </div>
      </section>

      <section id="near-miss" className="mt-10 scroll-mt-28">
        <h2 className="font-display text-2xl">כמעט זכאים ({nearMiss.length})</h2>
        <p className="mt-1 text-sm text-ink-soft">
          פער בקריטריונים שניתן לשנות (התנדבות, היקף לימודים, ממוצע, מילואים, מכינה). כישלון בזהות
          — מוסד, קהילה, מגדר, עיר, עולה, סוג שירות — מופיע תחת לא זכאים.
        </p>
        <div className="mt-4 grid gap-4">
          {nearMiss.length ? nearMiss.map((m) => <ScholarshipCard key={m.scholarship.id} match={m} />) : <EmptyBucket />}
        </div>
      </section>

      <section id="ineligible" className="mt-10 scroll-mt-28">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl">לא זכאים ({ineligible.length})</h2>
          <button
            type="button"
            className="no-print text-sm underline underline-offset-4"
            onClick={() => setShowIneligible((v) => !v)}
          >
            {showIneligible ? "הסתר" : "הצג את כל מה שנבדק"}
          </button>
        </div>
        <p className="mt-1 text-sm text-ink-soft">
          מוסתר כברירת מחדל. השלמות הדוח: אפשר לוודא שכל הקטלוג נשקל.
        </p>
        {showIneligible ? (
          <div className="mt-4 grid gap-4">
            {ineligible.length ? ineligible.map((m) => <ScholarshipCard key={m.scholarship.id} match={m} />) : <EmptyBucket />}
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink-soft no-print">לחצו «הצג» כדי לחפש גם כאן.</p>
        )}
      </section>

      {tipMatches.length > 0 ? (
        <section id="tips" className="mt-10 scroll-mt-28">
          <h2 className="font-display text-2xl">טיפים והפניות ({tipMatches.length})</h2>
          <p className="mt-1 text-sm text-ink-soft">
            אלה אינן מלגות בקטלוג — הפניות לדיקן, לזכויות או למעטפת. לא נספרות כמלגות.
          </p>
          <div className="mt-4 grid gap-4">
            {tipMatches.map((m) => (
              <ScholarshipCard key={m.scholarship.id} match={m} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
