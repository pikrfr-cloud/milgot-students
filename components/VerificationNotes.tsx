import { ExternalLink } from "@/components/ExternalLink";
import { isKitchenNoteHe } from "@/lib/catalog";
import { HE } from "@/lib/i18n/he";
import type { Scholarship } from "@/lib/types";

export function VerificationNotes({
  scholarship,
}: {
  scholarship: Scholarship;
  /** Ignored — kitchen amount paragraphs stay off the student card. */
  amountTextHe?: string;
  defaultOpen?: boolean;
}) {
  const urls = scholarship.sourceUrls.filter((url) => url.trim());
  const studentNote =
    scholarship.notesHe && !isKitchenNoteHe(scholarship.notesHe) ? scholarship.notesHe : null;

  if (!urls.length && !studentNote) return null;

  return (
    <details className="mt-4 rounded-xl border border-line bg-paper-deep/40 px-3 py-2">
      <summary className="cursor-pointer min-h-11 text-sm font-medium text-forest">
        {HE.catalog.verificationSummary}
      </summary>
      <div className="mt-3 space-y-3 text-sm text-ink-soft">
        {urls.length > 0 ? (
          <ul className="list-disc space-y-1 pr-5 break-all">
            {urls.map((url) => (
              <li key={url}>
                <ExternalLink className="underline underline-offset-4 ltr-isolate" href={url}>
                  לאתר הרשמי
                </ExternalLink>
              </li>
            ))}
          </ul>
        ) : null}
        {studentNote ? <p>{studentNote}</p> : null}
      </div>
    </details>
  );
}
