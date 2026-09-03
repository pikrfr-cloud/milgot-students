import type { Metadata } from "next";
import Link from "next/link";
import { MATCHABLE_SCHOLARSHIPS } from "@/data/scholarships";
import { AddToCalendarButton, DownloadMonthIcsButton } from "@/components/ClosingIcsButtons";
import { WhatsAppShareLink } from "@/components/WhatsAppShareLink";
import { uniqueMatchableByApplyUrl } from "@/lib/catalog";
import { scholarshipsClosingSoon } from "@/lib/closing";
import { amountHeadlineHe, formatHebrewLongDate, hebrewMonthYear, israelYmd } from "@/lib/format";
import { volunteeringChipHe } from "@/lib/card-chips";
import { scholarshipPagePath } from "@/lib/catalog-routes";
import { absoluteUrl } from "@/lib/site";
import { HE } from "@/lib/i18n/he";

function closingTitle(asOf: Date): string {
  const monthYear = hebrewMonthYear(israelYmd(asOf)) ?? "לא ודאי";
  return `מלגות שנסגרות ב-${monthYear} — רשימה מעודכנת`;
}

export function generateMetadata(): Metadata {
  const asOf = new Date();
  const title = closingTitle(asOf);
  return {
    title: { absolute: title },
    description: "מלגות עם תאריך סגירה ידוע ב־30 הימים הקרובים. בלי ניחושים.",
    alternates: { canonical: "/closing/" },
    openGraph: {
      title,
      description: "מלגות עם תאריך סגירה ידוע ב־30 הימים הקרובים.",
      url: absoluteUrl("/closing/"),
      locale: "he_IL",
    },
  };
}

export default function ClosingPage() {
  const asOf = new Date();
  const items = scholarshipsClosingSoon(
    uniqueMatchableByApplyUrl(MATCHABLE_SCHOLARSHIPS),
    asOf,
  );
  const title = closingTitle(asOf);
  const shareText = `${title} ${absoluteUrl("/closing/")}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl text-forest-deep">{HE.nav.closing}</h1>
      <p className="mt-3 text-ink-soft leading-relaxed">
        כאן רק מלגות עם תאריך סגירה ידוע ב־30 הימים הקרובים. בלי ניחושים.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <DownloadMonthIcsButton scholarships={items} />
        <WhatsAppShareLink text={shareText} />
      </div>
      {items.length ? (
        <ul className="mt-8 space-y-4">
          {items.map((s) => (
            <li key={s.id} className="rounded-2xl border border-line bg-card p-4">
              <Link
                href={scholarshipPagePath(s.id)}
                className="font-display text-xl text-forest-deep underline-offset-4 hover:underline"
              >
                {s.nameHe}
              </Link>
              <p className="mt-2 text-sm text-ink-soft">
                {amountHeadlineHe(s.amounts)}
                {" · "}
                {volunteeringChipHe(s)}
                {" · "}
                {s.deadline.date ? formatHebrewLongDate(s.deadline.date) : "לא ודאי"}
              </p>
              <div className="mt-3">
                <AddToCalendarButton scholarship={s} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 rounded-2xl border border-dashed border-line p-6 text-ink-soft">
          אין כרגע מלגות עם תאריך סגירה ידוע ב־30 הימים הקרובים.
        </p>
      )}
    </div>
  );
}
