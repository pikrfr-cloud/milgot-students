import type { Metadata } from "next";
import Link from "next/link";
import { COUNTS } from "@/data/counts";
import { ExternalLink } from "@/components/ExternalLink";
import { GroupChipRow } from "@/components/GroupChipRow";
import { UrgentNowStrip } from "@/components/UrgentNowStrip";
import { hebrewMonthYear } from "@/lib/format";
import { HE } from "@/lib/i18n/he";

export const metadata: Metadata = {
  title: `${HE.siteName} — ${HE.tagline}`,
  description: "ממלאים פעם אחת ומקבלים את המלגות שמתאימות — עם הסבר על כל אחת.",
  alternates: { canonical: "/" },
};

const HOME_H1 = "בלי מנוי. בלי חשבון. רק מלגות שבאמת מתאימות לכם, עם הסבר למה.";

export default function HomePage() {
  const monthHe = hebrewMonthYear(COUNTS.lastVerifiedMonth) ?? "לא ודאי";

  return (
    <div>
      <section className="pattern-band text-white">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
          <h1 className="font-display text-4xl sm:text-5xl leading-tight">{HOME_H1}</h1>
          <div className="mt-8">
            <Link
              href="/chat"
              className="inline-flex rounded-full bg-clay px-8 py-3.5 text-lg text-white font-medium hover:bg-clay-deep"
            >
              {HE.actions.chatIntake}
            </Link>
          </div>
          <p className="mt-5 max-w-xl text-white/85 leading-relaxed">
            {COUNTS.matchable} מלגות · כל אחת אומתה מול המקור הרשמי · עודכן {monthHe} ·{" "}
            <ExternalLink
              href={HE.legal.githubRepoUrl}
              className="underline underline-offset-4 text-white/90"
            >
              הקוד פתוח
            </ExternalLink>
          </p>
          <ul className="mt-5 max-w-xl list-disc space-y-1 pr-5 text-white/85 leading-relaxed">
            <li>מה מתאים</li>
            <li>מה חסר לאישור</li>
            <li>כמעט מתאים ומה הפער</li>
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-8">
        <GroupChipRow />
      </section>

      <UrgentNowStrip />
    </div>
  );
}
