import type { Metadata } from "next";
import Link from "next/link";
import { CATALOG_STATS } from "@/data/scholarships";
import { CoverageNote } from "@/components/CoverageNote";
import { HE } from "@/lib/i18n/he";

export const metadata: Metadata = {
  title: `${HE.siteName} — ${HE.tagline}`,
  description:
    "ממלאים פרופיל פעם אחת ומקבלים דוח מול הקטלוג: מי עומד בתנאי הסף, מה חסר לאישור, ומה כמעט מתאים. האתר לא מגיש בקשות בשמכם.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <div>
      <section className="pattern-band text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <p className="text-gold text-sm tracking-wide">לסטודנטיות ולסטודנטים בישראל · בלי התחברות</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl sm:text-5xl leading-tight">
            ממלאים פעם אחת.
            <br />
            את המלגות שבקטלוג — עם הסבר על כל אחת.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/85 leading-relaxed">
            מנוע התאמה לפי כללים — לא לפי מילות מפתח. לכל מלגה בקטלוג תראו למה אתם מתאימים, מה חסר
            לאישור, ומה כמעט מתאים. האתר לא מגיש בקשות בשמכם — ההגשה תמיד באתר המלגה.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/profile"
              className="rounded-full bg-clay px-6 py-3 text-white font-medium hover:bg-clay-deep"
            >
              להתחיל את הפרופיל
            </Link>
            <Link
              href="/catalog"
              className="rounded-full border border-white/30 px-6 py-3 text-white hover:bg-white/10"
            >
              לעיין בקטלוג ({CATALOG_STATS.total})
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 grid gap-6 md:grid-cols-3">
        {[
          {
            title: "שלם, לא משוער",
            body: "כל מלגה מקודדת ככללי זכאות מובְנים. התוצאה מחולקת למי שעומד בתנאי הסף, חסר פרט, כמעט זכאים, בדיקה במוסד, ולא זכאים.",
          },
          {
            title: "אפשר לדלג",
            body: "שדה לא ידוע לא פוסל מלגה. אם חסר פרט קריטי — המלגה עוברת ל«חסר פרט לאישור», לא נעלמת.",
          },
          {
            title: "הנתונים אצלכם",
            body: "הפרופיל נשמר במכשיר בלבד. לא שולחים מידע אישי לשרתים של צד שלישי.",
          },
        ].map((c) => (
          <article key={c.title} className="rounded-2xl border border-line bg-card p-6 shadow-[0_8px_30px_rgba(28,24,20,0.04)]">
            <h2 className="font-display text-2xl text-forest-deep">{c.title}</h2>
            <p className="mt-3 text-ink-soft leading-relaxed">{c.body}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-3xl bg-paper-deep p-8 sm:p-10">
          <h2 className="font-display text-3xl text-forest-deep">איך זה עובד</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              " ממלאים טופס מודרך: מוסד, תואר, מגורים, שירות, מצב כלכלי וקהילה — רק מה שרלוונטי, עם אפשרות לדלג.",
              "המערכת בודקת כל מלגה בקטלוג מול הכללים שלה, קריטריון־קריטריון.",
              "מתקבל דוח להדפסה: למה מתאימים, מה חסר, ומה הפער במלגות כמעט־זכאות.",
            ].map((t, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest text-white text-sm">
                  {i + 1}
                </span>
                <p className="text-ink leading-relaxed">{t}</p>
              </li>
            ))}
          </ol>
          <CoverageNote className="mt-8" />
          <Link
            href="/profile"
            className="mt-6 inline-flex rounded-full bg-forest px-6 py-3 text-white hover:bg-forest-deep"
          >
            מילוי הפרופיל
          </Link>
        </div>
      </section>
    </div>
  );
}
