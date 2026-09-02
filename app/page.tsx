import type { Metadata } from "next";
import Link from "next/link";
import { COUNTS, studentCountsLine } from "@/data/counts";
import { CoverageNote } from "@/components/CoverageNote";
import { IssuesLink } from "@/components/IssuesLink";
import { UrgentNowStrip } from "@/components/UrgentNowStrip";
import { HE } from "@/lib/i18n/he";

export const metadata: Metadata = {
  title: `${HE.siteName} — ${HE.tagline}`,
  description:
    "ממלאים פעם אחת ומקבלים את המלגות שבקטלוג — עם הסבר על כל אחת. האתר לא מגיש בקשות בשמכם.",
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
            ומקבלים את המלגות שבקטלוג — עם הסבר על כל אחת.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/85 leading-relaxed">
            כמה שאלות קצרות, ואז דוח מול הקטלוג: מה מתאים, מה חסר, ומה כמעט מתאים. ההגשה תמיד באתר
            המלגה — לא כאן.
          </p>
          <p className="mt-4 text-sm text-white/70">{studentCountsLine(COUNTS)}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/chat"
              className="rounded-full bg-clay px-7 py-3.5 text-lg text-white font-medium hover:bg-clay-deep"
            >
              {HE.actions.chatIntake}
            </Link>
            <Link href="/catalog" className="text-white/80 underline underline-offset-4 hover:text-white">
              {HE.actions.toCatalog}
            </Link>
          </div>
        </div>
      </section>

      <UrgentNowStrip />

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-3xl bg-paper-deep p-8 sm:p-10">
          <h2 className="font-display text-3xl text-forest-deep">איך זה עובד</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              "עונים בשיחה קצרה — רק מה שרלוונטי, עם אפשרות לדלג.",
              "האתר בודק כל מלגה בקטלוג מול מה שמילאתם.",
              "מתקבל דוח: למה מתאימים, מה חסר, ומה הפער.",
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
          <p className="mt-6 text-sm text-ink-soft">
            {HE.legal.contactIssues} <IssuesLink />
          </p>
        </div>
      </section>
    </div>
  );
}
