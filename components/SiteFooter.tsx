import Link from "next/link";
import { CATALOG_STATS } from "@/data/scholarships";
import { HE } from "@/lib/i18n/he";
import { ExternalLink } from "@/components/ExternalLink";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-forest-deep text-white mt-16">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 sm:grid-cols-3 text-sm">
        <div>
          <p className="font-display text-lg">{HE.siteName}</p>
          <p className="mt-2 text-white/75 leading-relaxed">
            {HE.legal.notOfficial}
          </p>
          <p className="mt-2 text-white/75 leading-relaxed">{HE.legal.contactGithub}</p>
          <ExternalLink
            className="mt-2 inline-block underline underline-offset-4 text-white/90 ltr-isolate"
            href={HE.legal.githubRepoUrl}
          >
            GitHub
          </ExternalLink>
        </div>
        <div>
          <p className="font-medium">פרטיות</p>
          <p className="mt-2 text-white/75 leading-relaxed">{HE.legal.localOnly}</p>
          <Link href="/privacy" className="mt-2 inline-block underline underline-offset-4 text-white/90">
            {HE.nav.privacy}
          </Link>
          <br />
          <Link href="/terms" className="mt-2 inline-block underline underline-offset-4 text-white/90">
            {HE.nav.terms}
          </Link>
        </div>
        <div>
          <p className="font-medium">{HE.nav.catalog}</p>
          <p className="mt-2 text-white/75">
            {CATALOG_STATS.total} מלגות להתאמה · {CATALOG_STATS.guide} במדריך · עודכן{" "}
            {CATALOG_STATS.lastVerifiedMonth}
          </p>
          <Link href="/catalog/updates/" className="mt-2 inline-block underline underline-offset-4 text-white/90">
            {HE.nav.updates}
          </Link>
          <br />
          <Link href="/about" className="mt-2 inline-block underline underline-offset-4 text-white/90">
            איך ההתאמה עובדת
          </Link>
          <br />
          <Link href="/accessibility" className="mt-2 inline-block underline underline-offset-4 text-white/90">
            {HE.nav.accessibility}
          </Link>
        </div>
      </div>
    </footer>
  );
}
