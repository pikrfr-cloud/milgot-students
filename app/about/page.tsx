import { CoverageNote } from "@/components/CoverageNote";
import { ExternalLink } from "@/components/ExternalLink";
import { COUNTS, studentCountsLine } from "@/data/counts";
import Link from "next/link";
import type { Metadata } from "next";
import { formatHebrewLongDate, hebrewMonthYear } from "@/lib/format";
import { HE } from "@/lib/i18n/he";
import { IssuesLink } from "@/components/IssuesLink";
import {
  REPORT_ERROR_BODY_HE,
  REPORT_ERROR_LABEL,
  REPORT_ERROR_TEMPLATE,
  REPORT_ERROR_TITLE_HE,
} from "@/lib/github-issues";

export const metadata: Metadata = {
  title: HE.nav.about,
  description: "איך בודקים את המלגות. בלי חשבון.",
  alternates: { canonical: "/about/" },
};

export default function AboutPage() {
  const verifiedHe =
    formatHebrewLongDate(COUNTS.lastVerifiedMonth) ||
    hebrewMonthYear(COUNTS.lastVerifiedMonth) ||
    "לא ודאי";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 leading-relaxed">
      <h1 className="font-display text-4xl text-forest-deep">{HE.nav.about}</h1>
      <p className="mt-4">
        ממלאים כמה שאלות. האתר בודק מול {studentCountsLine(COUNTS)} ומראה מה מתאים, מה חסר, ומה
        כמעט. ההגשה תמיד באתר המלגה.
      </p>
      <p className="mt-3">אין חשבון. מה שעונים נשאר במכשיר שלכם.</p>

      <h2 className="mt-10 font-display text-2xl text-forest-deep">איך בודקים את המלגות</h2>
      <p className="mt-3">
        כל מלגה בקטלוג נבדקה מול מקור רשמי — דף של הקרן, המוסד או הרשות. לא ממציאים סכום או מועד.
        אם חסר פרט, כתוב «לא ודאי».
      </p>
      <p className="mt-3">
        {studentCountsLine(COUNTS)}. תאריך הבדיקה האחרון בקטלוג: {verifiedHe}.
      </p>
      <p className="mt-3">
        הקוד פתוח בגיטהאב, כדי שאפשר לבדוק מה נכנס לקטלוג:{" "}
        <ExternalLink className="underline underline-offset-4 ltr-isolate" href={HE.legal.githubRepoUrl}>
          {HE.legal.githubRepoUrl.replace("https://", "")}
        </ExternalLink>
      </p>

      <h2 className="mt-10 font-display text-2xl text-forest-deep">מצאתם טעות?</h2>
      <p className="mt-3">
        אפשר לפתוח דיווח בגיטהאב. הטופס כבר ממולא חלקית — רק תארו מה לא נכון. בלי שם, תמונה או
        פרטי תשלום.
      </p>
      <p className="mt-3">
        <IssuesLink
          template={REPORT_ERROR_TEMPLATE}
          title={REPORT_ERROR_TITLE_HE}
          body={REPORT_ERROR_BODY_HE}
          labels={REPORT_ERROR_LABEL}
        >
          דווחו על טעות
        </IssuesLink>
      </p>

      <CoverageNote className="mt-8" />
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
