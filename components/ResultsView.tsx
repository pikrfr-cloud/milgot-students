"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SCHOLARSHIPS } from "@/data/scholarships";
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
    const stored = loadProfile();
    setTimeout(() => setProfile(stored), 0);
  }, []);

  const grouped = useMemo(() => {
    if (!profile) return null;
    return groupMatches(matchAll(SCHOLARSHIPS, profile));
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
        return deadlineSortValue(a.scholarship.deadline) - deadlineSortValue(b.scholarship.deadline);
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
          <Link href="/profile" className="rounded-full border border-line px-4 py-2 text-sm">
            לערוך פרופיל
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full bg-forest px-4 py-2 text-sm text-white"
          >
            הדפסה / PDF
          </button>
        </div>
      </div>
      <CoverageNote className="mt-4" />

      <div className="no-print mt-6 grid gap-3 rounded-2xl border border-line bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
        <input
          className="rounded-xl border border-line px-3 py-2"
          placeholder="חיפוש לפי שם או קרן"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="rounded-xl border border-line px-3 py-2" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          <option value="amount">מיון לפי סכום</option>
          <option value="deadline">מיון לפי מועד</option>
          <option value="name">מיון לפי שם</option>
        </select>
        <select className="rounded-xl border border-line px-3 py-2" value={scope} onChange={(e) => setScope(e.target.value as typeof scope)}>
          <option value="all">כל ההיקפים</option>
          <option value="national">ארצי</option>
          <option value="institution">מוסדי</option>
          <option value="municipal">עירוני</option>
          <option value="regional">אזורי</option>
        </select>
        <select className="rounded-xl border border-line px-3 py-2" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">כל הסוגים</option>
          <option value="need">סיוע כלכלי</option>
          <option value="merit">הצטיינות</option>
          <option value="volunteering">התנדבות</option>
          <option value="population">אוכלוסייה ייעודית</option>
          <option value="periphery">פריפריה</option>
          <option value="service">שירות / מילואים</option>
        </select>
        <select
          className="rounded-xl border border-line px-3 py-2"
          value={minAmount}
          onChange={(e) => setMinAmount(Number(e.target.value))}
        >
          <option value={0}>כל הסכומים</option>
          <option value={5000}>מ־5,000 ₪</option>
          <option value={10000}>מ־10,000 ₪</option>
          <option value={20000}>מ־20,000 ₪</option>
        </select>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl">זכאים עכשיו ({eligible.length})</h2>
        <p className="mt-1 text-sm text-ink-soft">כל הכללים המובְנים מתקיימים לפי הפרופיל.</p>
        <div className="mt-4 grid gap-4">
          {eligible.length ? eligible.map((m) => <ScholarshipCard key={m.scholarship.id} match={m} defaultOpen />) : <EmptyBucket />}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">חסר פרט לאישור ({needInfo.length})</h2>
        <p className="mt-1 text-sm text-ink-soft">
          אף קריטריון לא נכשל, אבל שדה שדולג נדרש. מלאו אותו בפרופיל כדי לאשר.
        </p>
        <div className="mt-4 grid gap-4">
          {needInfo.length ? needInfo.map((m) => <ScholarshipCard key={m.scholarship.id} match={m} />) : <EmptyBucket />}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">כמעט זכאים ({nearMiss.length})</h2>
        <p className="mt-1 text-sm text-ink-soft">פער של קריטריון אחד או שניים — כדי ששום דבר לא יישכח.</p>
        <div className="mt-4 grid gap-4">
          {nearMiss.length ? nearMiss.map((m) => <ScholarshipCard key={m.scholarship.id} match={m} />) : <EmptyBucket />}
        </div>
      </section>

      <section className="mt-10">
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
    </div>
  );
}
