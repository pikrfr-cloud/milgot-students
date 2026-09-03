import type { Metadata } from "next";
import Link from "next/link";
import { HE } from "@/lib/i18n/he";
import { LEGAL_UPDATED_HE } from "@/data/scholarships";
import { DeleteMyDataButton } from "@/components/DeleteMyDataButton";
import { IssuesLink } from "@/components/IssuesLink";

export const metadata: Metadata = {
  title: "פרטיות",
  description: "התשובות נשארות במכשיר. אפשר למחוק בכל עת.",
  alternates: { canonical: "/privacy/" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 leading-relaxed">
      <h1 className="font-display text-4xl text-forest-deep">מדיניות פרטיות</h1>
      <p className="mt-2 text-sm text-ink-soft">עודכן: {LEGAL_UPDATED_HE}</p>
      <p className="mt-6">
        אין חשבון. התשובות נשארות במכשיר שלכם.
      </p>
      <h2 className="mt-8 font-display text-2xl">מה נשמר</h2>
      <p className="mt-3">{HE.legal.localOnly} לא שולחים אותן לשום מקום.</p>
      <h2 className="mt-8 font-display text-2xl">זכות מחיקה</h2>
      <p className="mt-3">{HE.legal.deletionRight}</p>
      <div className="mt-4">
        <DeleteMyDataButton />
      </div>
      <h2 className="mt-8 font-display text-2xl">יצירת קשר</h2>
      <p className="mt-3">
        {HE.legal.contactIssues} <IssuesLink />
      </p>
      <p className="mt-6">
        <Link href="/terms" className="underline underline-offset-4">
          תנאי שימוש
        </Link>
      </p>
    </div>
  );
}
