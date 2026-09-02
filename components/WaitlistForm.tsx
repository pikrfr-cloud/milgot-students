"use client";

import { HE } from "@/lib/i18n/he";

/** Honest notice only — no email collection until a mail server exists. */
export function WaitlistForm({ className = "" }: { className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-card p-5 ${className}`}>
      <h2 className="font-display text-xl text-forest-deep">{HE.waitlist.title}</h2>
      <p className="mt-2 text-sm text-ink-soft leading-relaxed">{HE.waitlist.body}</p>
    </section>
  );
}
