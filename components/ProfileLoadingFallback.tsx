"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HE } from "@/lib/i18n/he";

const STUCK_MS = 5_000;

export function ProfileLoadingFallback() {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setStuck(true), STUCK_MS);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <p className="text-ink-soft">{HE.profile.loading}</p>
      {stuck ? (
        <div className="mt-6 space-y-3">
          <p className="text-sm leading-relaxed text-ink">{HE.profile.loadingStuck}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/catalog"
              className="inline-flex min-h-11 items-center rounded-full bg-forest px-5 text-white"
            >
              {HE.actions.toCatalog}
            </Link>
            <Link
              href="/profile/fast"
              className="inline-flex min-h-11 items-center rounded-full border border-line px-5"
            >
              {HE.actions.fastReport}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function JsRequiredNote() {
  return (
    <noscript>
      <div className="mx-auto max-w-xl px-4 py-10 text-center">
        <p className="leading-relaxed">{HE.profile.jsRequired}</p>
        <p className="mt-4">
          <Link href="/catalog" className="underline underline-offset-4">
            {HE.actions.toCatalog}
          </Link>
          {" · "}
          <Link href="/profile/fast" className="underline underline-offset-4">
            {HE.actions.fastReport}
          </Link>
        </p>
      </div>
    </noscript>
  );
}
