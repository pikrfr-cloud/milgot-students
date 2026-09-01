"use client";

import { HE } from "@/lib/i18n/he";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="font-display text-3xl text-forest-deep">{HE.errors.title}</h1>
      <p className="mt-3 text-ink-soft">{HE.errors.body}</p>
      <button
        type="button"
        className="mt-6 min-h-11 rounded-full bg-forest px-6 text-white"
        onClick={() => reset()}
      >
        {HE.actions.tryAgain}
      </button>
    </div>
  );
}
