"use client";

import { useEffect, useState } from "react";
import { HE } from "@/lib/i18n/he";
import { isPlausibleEmail, loadWaitlist, saveWaitlist, type WaitlistEntry } from "@/lib/waitlist";

export function WaitlistForm({ className = "" }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [saved, setSaved] = useState<WaitlistEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client storage
    setSaved(loadWaitlist());
  }, []);

  return (
    <form
      className={`rounded-2xl border border-line bg-card p-5 ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        const next = saveWaitlist(email, consent);
        if (!next) {
          setError(HE.waitlist.invalid);
          return;
        }
        setError(null);
        setSaved(next);
      }}
    >
      <h2 className="font-display text-xl text-forest-deep">{HE.waitlist.title}</h2>
      <p className="mt-2 text-sm text-ink-soft leading-relaxed">{HE.waitlist.body}</p>
      {saved ? (
        <div className="mt-4 rounded-xl border border-ok/30 bg-ok/5 p-4" role="status">
          <p className="text-sm text-ok">{HE.waitlist.saved}</p>
          <p className="mt-1 text-sm">{HE.waitlist.already.replace("{email}", saved.email)}</p>
          <p className="mt-2 text-xs text-ink-soft">{HE.waitlist.humanTodo}</p>
        </div>
      ) : (
        <>
          <label className="mt-4 block text-sm font-medium">
            {HE.waitlist.email}
            <input
              type="email"
              autoComplete="email"
              dir="ltr"
              className="mt-1 min-h-11 w-full rounded-xl border border-line bg-card px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="mt-3 flex min-h-11 items-start gap-2 text-sm leading-relaxed">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 shrink-0"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
            />
            <span>{HE.waitlist.consent}</span>
          </label>
          <button type="submit" className="mt-4 min-h-11 rounded-full bg-forest px-5 text-sm text-white">
            {HE.waitlist.save}
          </button>
          {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
          <p className="mt-3 text-xs text-ink-soft">{HE.waitlist.humanTodo}</p>
        </>
      )}
      {!isPlausibleEmail(email) && email.length > 3 ? (
        <p className="sr-only">{HE.waitlist.invalid}</p>
      ) : null}
    </form>
  );
}
