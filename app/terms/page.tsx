import type { Metadata } from "next";
import Link from "next/link";
import { HE } from "@/lib/i18n/he";

export const metadata: Metadata = {
  title: "תנאי שימוש",
  description: "הדוח אינו החלטת זכאות רשמית. הנתונים נשארים במכשיר.",
  alternates: { canonical: "/terms/" },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 leading-relaxed">
      <h1 className="font-display text-4xl text-forest-deep">תנאי שימוש</h1>
      <p className="mt-2 text-sm text-ink-soft">עודכן: 1 בספטמבר 2026</p>
      <p className="mt-6">
        השימוש באתר הוא באחריות המשתמש. {HE.legal.notOfficial}
      </p>
      <p className="mt-3">
        הקטלוג מבוסס על מקורות פומביים שאומתו במועד המצוין בכל רשומה. סכומים ומועדים עלולים להשתנות,
        וחלקם מסומנים כלא ודאיים במכוון.
      </p>
      <p className="mt-3">{HE.legal.localOnly}</p>
      <p className="mt-3">{HE.legal.deletionRight}</p>
      <h2 className="mt-8 font-display text-2xl">זהות המפעיל</h2>
      <p className="mt-3">{HE.legal.identityUnpublished}</p>
      <p className="mt-6">
        <Link href="/privacy" className="underline underline-offset-4">
          מדיניות פרטיות
        </Link>
      </p>
    </div>
  );
}
