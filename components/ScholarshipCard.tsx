import Link from "next/link";
import type { ScholarshipMatch } from "@/lib/types";
import { formatAmount, formatDeadline, matchHeadline } from "@/lib/format";
import { scholarshipTypeLabel } from "@/lib/labels";
import { INSTITUTIONS } from "@/lib/institutions";

const bucketStyle: Record<string, string> = {
  eligible: "border-ok/30 bg-ok/5",
  needInfo: "border-info/30 bg-info/5",
  nearMiss: "border-warn/30 bg-warn/5",
  ineligible: "border-line bg-card",
};

export function ScholarshipCard({
  match,
  defaultOpen = false,
}: {
  match: ScholarshipMatch;
  defaultOpen?: boolean;
}) {
  const s = match.scholarship;
  const inst = s.institutionIds
    ?.map((id) => INSTITUTIONS.find((i) => i.id === id)?.nameHe)
    .filter(Boolean)
    .join(", ");

  return (
    <article className={`print-break rounded-2xl border p-5 ${bucketStyle[match.bucket]}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-forest-deep">{s.nameHe}</h3>
          <p className="mt-1 text-sm text-ink-soft">{s.funderHe}</p>
        </div>
        <p className="text-sm font-medium text-ink">{formatAmount(s.amounts)}</p>
      </div>
      <p className="mt-3 text-sm">{matchHeadline(match)}</p>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-ink-soft">מועד</dt>
          <dd>
            {formatDeadline(s.deadline)}
            {s.deadline.uncertain ? " · לא ודאי" : ""}
          </dd>
        </div>
        <div>
          <dt className="text-ink-soft">סוג</dt>
          <dd>{s.types.map(scholarshipTypeLabel).join(", ")}</dd>
        </div>
        {inst ? (
          <div className="sm:col-span-2">
            <dt className="text-ink-soft">מוסדות</dt>
            <dd>{inst}</dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-3 text-sm leading-relaxed">{s.whoItsForHe}</p>

      <details className="mt-4" open={defaultOpen}>
        <summary className="cursor-pointer text-sm font-medium text-forest">פירוט קריטריונים ומסמכים</summary>
        <div className="mt-3 space-y-3 text-sm">
          {match.passed.length > 0 && (
            <section>
              <h4 className="font-medium text-ok">למה זה מתאים</h4>
              <ul className="mt-1 list-disc pr-5 space-y-1">
                {match.passed.map((c) => (
                  <li key={c.id}>
                    <span className="font-medium">{c.labelHe}.</span> {c.detailHe}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {match.unknown.length > 0 && (
            <section>
              <h4 className="font-medium text-info">חסר לאישור</h4>
              <ul className="mt-1 list-disc pr-5 space-y-1">
                {match.unknown.map((c) => (
                  <li key={c.id}>
                    <span className="font-medium">{c.labelHe}.</span> {c.detailHe}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {match.failed.length > 0 && (
            <section>
              <h4 className="font-medium text-danger">הפער</h4>
              <ul className="mt-1 list-disc pr-5 space-y-1">
                {match.failed.map((c) => (
                  <li key={c.id}>
                    <span className="font-medium">{c.labelHe}.</span> {c.detailHe}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section>
            <h4 className="font-medium">מסמכים נדרשים</h4>
            <ul className="mt-1 list-disc pr-5">
              {s.documentsHe.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </section>
          <p>
            <span className="font-medium">איך מגישים: </span>
            {s.howToApplyHe}
          </p>
          {s.applyUrl ? (
            <p>
              <a className="underline underline-offset-4" href={s.applyUrl} target="_blank" rel="noreferrer">
                קישור להגשה / מידע
              </a>
            </p>
          ) : null}
          {s.notesHe ? <p className="text-ink-soft">{s.notesHe}</p> : null}
          {s.amounts.uncertain || s.deadline.uncertain ? (
            <p className="text-ink-soft">חלק מהפרטים מסומנים כלא ודאיים — יש לאמת במקור.</p>
          ) : null}
          <p className="text-xs text-ink-soft">אומת לאחרונה: {s.lastVerified}</p>
        </div>
      </details>
    </article>
  );
}

export function EmptyBucket() {
  return (
    <p className="rounded-2xl border border-dashed border-line p-6 text-ink-soft">
      אין מלגות בקטגוריה זו לפי הסינון הנוכחי.{" "}
      <Link href="/profile" className="underline underline-offset-4">
        לעדכון הפרופיל
      </Link>
    </p>
  );
}
