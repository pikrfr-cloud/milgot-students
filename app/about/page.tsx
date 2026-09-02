import { CoverageNote } from "@/components/CoverageNote";
import { COUNTS, studentCountsLine } from "@/data/counts";
import Link from "next/link";
import type { Metadata } from "next";
import { HE } from "@/lib/i18n/he";
import { IssuesLink } from "@/components/IssuesLink";

export const metadata: Metadata = {
  title: HE.nav.about,
  description: "איך האתר עוזר למצוא מלגות. בלי חשבון.",
  alternates: { canonical: "/about/" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 leading-relaxed">
      <h1 className="font-display text-4xl text-forest-deep">{HE.nav.about}</h1>
      <p className="mt-4">
        ממלאים כמה שאלות. האתר בודק מול {studentCountsLine(COUNTS)} ומראה מה מתאים, מה חסר, ומה
        כמעט. ההגשה תמיד באתר המלגה.
      </p>
      <p className="mt-3">אין חשבון. מה שעונים נשאר במכשיר שלכם.</p>
      <CoverageNote className="mt-4" />
      <p className="mt-6">
        {HE.legal.contactIssues} <IssuesLink />
      </p>
      <p className="mt-4">
        <Link href="/accessibility" className="underline underline-offset-4">
          {HE.nav.accessibility}
        </Link>
      </p>
    </div>
  );
}
