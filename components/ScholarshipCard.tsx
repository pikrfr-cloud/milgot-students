"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ScholarshipMatch, TrackingStatus } from "@/lib/types";
import { deadlineStatus, formatAmount, formatDeadline, matchHeadline, scopeLabelHe } from "@/lib/format";
import { scholarshipTypeLabel } from "@/lib/labels";
import { INSTITUTIONS } from "@/lib/institutions";
import { hasOfficialSource } from "@/lib/sources";
import { profileFocusHref } from "@/lib/profile-fields";
import { downloadIcs } from "@/lib/ics";
import { loadTracking, setTrackingStatus, trackingLabelHe } from "@/lib/tracking";
import { TRACKING_STATUSES } from "@/lib/types";

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
  const official = s.officialSource ?? hasOfficialSource(s.sourceUrls);
  const [tracking, setTracking] = useState<TrackingStatus | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client storage
    setTracking(loadTracking()[s.id]?.status ?? null);
  }, [s.id]);

  const unknownFields = [
    ...new Map(
      match.unknown.filter((c) => c.field).map((c) => [c.field, c]),
    ).values(),
  ];

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
      <p className="mt-2 text-xs">
        {official ? (
          <span className="rounded-full bg-ok/10 px-2 py-0.5 text-ok">מקור רשמי</span>
        ) : (
          <span className="rounded-full bg-warn/10 px-2 py-0.5 text-warn">אין מקור רשמי מאומת</span>
        )}
      </p>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-ink-soft">מועד</dt>
          <dd>
            {deadlineStatus(s.deadline).labelHe}
            {" · "}
            {formatDeadline(s.deadline)}
            {s.deadline.uncertain ? " · לא ודאי" : ""}
          </dd>
        </div>
        <div>
          <dt className="text-ink-soft">סוג</dt>
          <dd>
            {s.types.map(scholarshipTypeLabel).join(", ")} · {scopeLabelHe(s.scope)}
          </dd>
        </div>
        {inst ? (
          <div className="sm:col-span-2">
            <dt className="text-ink-soft">מוסדות</dt>
            <dd>{inst}</dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-3 text-sm leading-relaxed">{s.whoItsForHe}</p>
      {s.sourceUrls.length > 0 ? (
        <p className="mt-2 text-xs text-ink-soft">
          מקורות:{" "}
          {s.sourceUrls.map((url, i) => (
            <span key={url}>
              {i > 0 ? " · " : null}
              <a className="underline underline-offset-2 break-all" href={url} target="_blank" rel="noreferrer">
                {new URL(url).hostname.replace(/^www\./, "")}
              </a>
            </span>
          ))}
        </p>
      ) : null}

      {match.bucket === "needInfo" && unknownFields.length > 0 ? (
        <div className="no-print mt-3 flex flex-wrap gap-2">
          {unknownFields.map((c) =>
            c.field ? (
              <Link
                key={c.id}
                href={profileFocusHref(c.field)}
                className="inline-flex min-h-11 items-center rounded-full border border-info/40 bg-info/10 px-3 text-sm text-info"
              >
                למילוי: {c.labelHe}
              </Link>
            ) : null,
          )}
        </div>
      ) : null}

      <div className="no-print mt-4 flex flex-wrap items-center gap-2">
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <span className="text-ink-soft">הרשימה שלי</span>
          <select
            className="min-h-11 rounded-xl border border-line bg-card px-2"
            aria-label={`סטטוס הגשה עבור ${s.nameHe}`}
            value={tracking ?? ""}
            onChange={(e) => {
              const value = (e.target.value || null) as TrackingStatus | null;
              setTracking(value);
              setTrackingStatus(loadTracking(), s.id, value);
            }}
          >
            <option value="">לא במעקב</option>
            {TRACKING_STATUSES.map((st) => (
              <option key={st} value={st}>
                {trackingLabelHe(st)}
              </option>
            ))}
          </select>
        </label>
        {s.deadline.date ? (
          <button
            type="button"
            className="min-h-11 rounded-full border border-line px-3 text-sm"
            onClick={() => downloadIcs(s)}
          >
            הוספה ליומן (ICS)
          </button>
        ) : null}
      </div>

      <details className="mt-4" open={defaultOpen}>
        <summary className="cursor-pointer min-h-11 text-sm font-medium text-forest">
          פירוט קריטריונים ומסמכים
        </summary>
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
                    <span className="font-medium">{c.labelHe}.</span> {c.detailHe}{" "}
                    {c.field ? (
                      <Link href={profileFocusHref(c.field)} className="no-print underline underline-offset-4">
                        לעריכת השדה
                      </Link>
                    ) : null}
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
          {s.sourceUrls.length > 0 ? (
            <section>
              <h4 className="font-medium">מקורות רשמיים</h4>
              <ul className="mt-1 list-disc pr-5 break-all">
                {s.sourceUrls.map((url) => (
                  <li key={url}>
                    <a className="underline underline-offset-4" href={url} target="_blank" rel="noreferrer">
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
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
