import Link from "next/link";
import { COUNTS, studentCountsLine } from "@/data/counts";
import { HE } from "@/lib/i18n/he";
import { IssuesLink } from "@/components/IssuesLink";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-forest-deep text-white mt-16">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm">
        <p className="text-white/80 leading-relaxed">{HE.legal.notOfficial}</p>
        <p className="mt-3 text-white/70">
          {studentCountsLine(COUNTS)}
          {" · "}
          <Link href="/catalog" className="underline underline-offset-4 text-white/90">
            {HE.nav.catalog}
          </Link>
          {" · "}
          <Link href="/privacy" className="underline underline-offset-4 text-white/90">
            {HE.nav.privacy}
          </Link>
          {" · "}
          <Link href="/accessibility" className="underline underline-offset-4 text-white/90">
            {HE.nav.accessibility}
          </Link>
        </p>
        <p className="mt-3 text-white/70">
          {HE.legal.contactIssues} <IssuesLink className="text-white/90">כתבו לנו</IssuesLink>
        </p>
      </div>
    </footer>
  );
}
