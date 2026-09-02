import type { Metadata } from "next";
import Link from "next/link";
import { COUNTS, studentCountsLine } from "@/data/counts";
import { GroupChipRow } from "@/components/GroupChipRow";
import { UrgentNowStrip } from "@/components/UrgentNowStrip";
import { HE } from "@/lib/i18n/he";

export const metadata: Metadata = {
  title: `${HE.siteName} — ${HE.tagline}`,
  description: "ממלאים פעם אחת ומקבלים את המלגות שמתאימות — עם הסבר על כל אחת.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <div>
      <section className="pattern-band text-white">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
          <h1 className="font-display text-4xl sm:text-5xl leading-tight">
            ממלאים פעם אחת.
            <br />
            ומקבלים את המלגות שמתאימות.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/85 leading-relaxed">
            כמה שאלות קצרות. אחר כך תראו מה מתאים, מה חסר, ומה כמעט. {studentCountsLine(COUNTS)}.
          </p>
          <div className="mt-8">
            <Link
              href="/chat"
              className="inline-flex rounded-full bg-clay px-8 py-3.5 text-lg text-white font-medium hover:bg-clay-deep"
            >
              {HE.actions.chatIntake}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-8">
        <GroupChipRow />
      </section>

      <UrgentNowStrip />
    </div>
  );
}
