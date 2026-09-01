import type { Metadata } from "next";
import Link from "next/link";
import { HE } from "@/lib/i18n/he";

export const metadata: Metadata = {
  title: HE.errors.notFoundTitle,
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="font-display text-3xl text-forest-deep">{HE.errors.notFoundTitle}</h1>
      <p className="mt-3 text-ink-soft">{HE.errors.notFoundBody}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="inline-flex min-h-11 items-center rounded-full bg-forest px-6 text-white">
          {HE.actions.toHome}
        </Link>
        <Link href="/catalog" className="inline-flex min-h-11 items-center rounded-full border border-line px-6">
          {HE.nav.catalog}
        </Link>
      </div>
    </div>
  );
}
