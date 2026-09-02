import { ExternalLink } from "@/components/ExternalLink";
import { SCHOLARSHIPS } from "@/data/scholarships";
import { duplicateNoteHe, duplicatePeers, hasSecondaryDeadlineSource } from "@/lib/catalog";
import { HE } from "@/lib/i18n/he";
import type { Scholarship } from "@/lib/types";

export function VerificationNotes({
  scholarship,
  amountTextHe,
  defaultOpen = false,
}: {
  scholarship: Scholarship;
  /** Kitchen amount paragraph when the card already shows a number-first headline. */
  amountTextHe?: string;
  defaultOpen?: boolean;
}) {
  const s = scholarship;
  const dup = duplicateNoteHe(s, duplicatePeers(s, SCHOLARSHIPS));
  const secondary = hasSecondaryDeadlineSource(s);
  const longAmount =
    amountTextHe && amountTextHe.trim() && amountTextHe.trim() !== s.amounts.textHe
      ? null
      : amountTextHe && amountTextHe.length > 40
        ? amountTextHe
        : s.amounts.textHe.length > 40
          ? s.amounts.textHe
          : null;

  if (!s.sourceUrls.length && !s.notesHe && !dup && !secondary && !longAmount) {
    return null;
  }

  return (
    <details className="mt-4 rounded-xl border border-line bg-paper-deep/40 px-3 py-2" open={defaultOpen}>
      <summary className="cursor-pointer min-h-11 text-sm font-medium text-forest">
        {HE.catalog.verificationSummary}
      </summary>
      <div className="mt-3 space-y-3 text-sm text-ink-soft">
        {s.sourceUrls.length > 0 ? (
          <ul className="list-disc space-y-1 pr-5 break-all">
            {s.sourceUrls.map((url) => (
              <li key={url}>
                <ExternalLink className="underline underline-offset-4 ltr-isolate" href={url}>
                  {url}
                </ExternalLink>
              </li>
            ))}
          </ul>
        ) : null}
        {longAmount ? <p>{longAmount}</p> : null}
        {s.notesHe ? <p>{s.notesHe}</p> : null}
        {dup ? <p>{dup}</p> : null}
        {secondary ? <p>{HE.catalog.secondaryDeadline}</p> : null}
        <p className="text-xs">אומת לאחרונה: {s.lastVerified}</p>
      </div>
    </details>
  );
}
