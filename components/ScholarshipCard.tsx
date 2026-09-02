"use client";

import Link from "next/link";
import { useState } from "react";
import type { ScholarshipMatch, SourceLevel, TrackingStatus } from "@/lib/types";
import { amountDisplay, formatDeadline, isVerificationStale, matchHeadline, publicDeadlineLabelHe, scopeLabelHe, shouldHideIcs, STALE_VERIFICATION_LABEL_HE } from "@/lib/format";
import { scholarshipTypeLabel } from "@/lib/labels";
import { INSTITUTIONS } from "@/lib/institutions";
import { bestSourceLevel, sourceLevelLabelHe } from "@/lib/sources";
import { profileFocusHref } from "@/lib/profile-fields";
import { downloadIcs } from "@/lib/ics";
import { trackingLabelHe } from "@/lib/tracking";
import { TRACKING_STATUSES } from "@/lib/types";
import { ExternalLink } from "@/components/ExternalLink";
import { HeWithEn } from "@/components/HeWithEn";
import { useTracking } from "@/components/TrackingProvider";
import { VerificationNotes } from "@/components/VerificationNotes";
import { WhatsAppShareLink } from "@/components/WhatsAppShareLink";
import { scholarshipPagePath } from "@/lib/catalog-routes";
import { HE } from "@/lib/i18n/he";

const bucketStyle: Record<string, string> = {
  eligible: "border-ok/30 bg-ok/5",
  closedCycle: "border-gold/40 bg-gold/10",
  needInfo: "border-info/30 bg-info/5",
  nearMiss: "border-warn/30 bg-warn/5",
  checkAtInstitution: "border-line bg-paper-deep/50",
  ineligible: "border-line bg-card",
};

const levelStyle: Record<SourceLevel, string> = {
  official_page: "bg-ok/10 text-ok",
  institution_site: "bg-info/10 text-info",
  indirect: "bg-warn/10 text-warn",
};

export function ScholarshipCard({
  match,
  defaultOpen = false,
  compact = false,
}: {
  match: ScholarshipMatch;
  defaultOpen?: boolean;
  compact?: boolean;
}) {
  const s = match.scholarship;
  const shownAmount = amountDisplay(s.amounts);
  const inst = s.institutionIds
    ?.map((id) => INSTITUTIONS.find((i) => i.id === id)?.nameHe)
    .filter(Boolean)
    .join(", ");
  const level = s.sourceLevel ?? bestSourceLevel(s.sourceUrls);
  const { tracking, setStatus } = useTracking();
  const [expanded, setExpanded] = useState(defaultOpen);
  const tracked = tracking[s.id]?.status ?? null;

  const unknownFields = [
    ...new Map(match.unknown.filter((c) => c.field).map((c) => [c.field, c])).values(),
  ];
  const hideIcs = shouldHideIcs(s.deadline);
  const unknownNotes = match.unknown.filter((c) => !c.field && !c.group);

  if (compact && match.bucket === "ineligible") {
    return (
      <article className="print-ineligible-line rounded-xl border border-line px-3 py-2 text-sm">
        <span className="font-medium">{s.nameHe}</span>
        <span className="text-ink-soft"> — {matchHeadline(match)}</span>
      </article>
    );
  }

  const details = (
    <>
      <p className="mt-3 text-sm leading-relaxed">{s.whoItsForHe}</p>
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
          <span className="text-ink-soft">{HE.buckets.myList}</span>
          <select
            className="min-h-11 rounded-xl border border-line bg-card px-2"
            aria-label={`סטטוס הגשה עבור ${s.nameHe}`}
            value={tracked ?? ""}
            onChange={(e) => {
              const value = (e.target.value || null) as TrackingStatus | null;
              setStatus(s.id, value);
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
        {!hideIcs ? (
          <button
            type="button"
            className="min-h-11 rounded-full border border-line px-3 text-sm"
            onClick={() => downloadIcs(s)}
          >
            {HE.actions.addToCalendar}
          </button>
        ) : null}
        <WhatsAppShareLink scholarship={s} />
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
          {match.unknown.filter((c) => c.field).length > 0 && (
            <section>
              <h4 className="font-medium text-info">חסר לאישור</h4>
              <ul className="mt-1 list-disc pr-5 space-y-1">
                {match.unknown
                  .filter((c) => c.field)
                  .map((c) => (
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
          {unknownNotes.length > 0 && (
            <section>
              <h4 className="font-medium text-ink-soft">
                {match.bucket === "checkAtInstitution" ? HE.buckets.checkAtInstitutionLong : "לתשומת לב"}
              </h4>
              <ul className="mt-1 list-disc pr-5 space-y-1">
                {unknownNotes.map((c) => (
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
              <ExternalLink className="underline underline-offset-4 ltr-isolate" href={s.applyUrl}>
                קישור להגשה / מידע
              </ExternalLink>
            </p>
          ) : null}
          {s.amounts.uncertain || s.deadline.uncertain ? (
            <p className="text-ink-soft">חלק מהפרטים מסומנים כלא ודאיים — יש לאמת במקור.</p>
          ) : null}
        </div>
      </details>
      <VerificationNotes scholarship={s} amountTextHe={s.amounts.textHe} />
    </>
  );

  return (
    <article
      id={s.id}
      className={`print-break scroll-mt-28 rounded-2xl border p-5 ${bucketStyle[match.bucket] ?? bucketStyle.ineligible}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-forest-deep">
            <Link href={scholarshipPagePath(s.id)} className="underline-offset-4 hover:underline">
              <HeWithEn text={s.nameHe} />
            </Link>
          </h3>
          <p className="mt-1 text-sm text-ink-soft">
            <HeWithEn text={s.funderHe} />
          </p>
        </div>
        <div className="text-end">
          <p className="text-sm font-medium text-ink">{shownAmount.headlineHe}</p>
          {shownAmount.noteHe ? (
            <p className="mt-0.5 text-xs text-ink-soft">{shownAmount.noteHe}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
        {match.bucket === "closedCycle" ? (
          <span className="rounded-full bg-gold/20 px-2 py-0.5 text-ink">{HE.buckets.closedCycleLong}</span>
        ) : null}
        {match.bucket === "checkAtInstitution" ? (
          <span className="rounded-full bg-paper-deep px-2 py-0.5 text-ink-soft">
            {HE.buckets.checkAtInstitutionLong}
          </span>
        ) : null}
        {s.treatment === "selective" ? (
          <span className="rounded-full bg-warn/10 px-2 py-0.5 text-warn">{HE.buckets.selective}</span>
        ) : null}
        <span className={`rounded-full px-2 py-0.5 ${level === "official_page" ? levelStyle.official_page : level === "institution_site" ? levelStyle.institution_site : levelStyle.indirect}`}>
          {sourceLevelLabelHe(level)}
        </span>
        {isVerificationStale(s.lastVerified) ? (
          <span className="rounded-full bg-warn/10 px-2 py-0.5 text-warn">{STALE_VERIFICATION_LABEL_HE}</span>
        ) : null}
        <span className="rounded-full bg-paper-deep px-2 py-0.5 text-ink-soft">
          {publicDeadlineLabelHe(s.deadline, s.lastVerified)}
        </span>
        {s.deadline.windowHe ? (
          <span className="rounded-full bg-paper-deep px-2 py-0.5 text-ink-soft">{s.deadline.windowHe}</span>
        ) : null}
        <span className="rounded-full bg-paper-deep px-2 py-0.5 text-ink-soft sm:hidden">
          {s.types.map(scholarshipTypeLabel).join(" · ")}
        </span>
      </div>
      <p className="mt-3 text-sm">{matchHeadline(match)}</p>
      {match.mutexNoteHe ? (
        <p className="mt-2 rounded-xl border border-warn/30 bg-warn/10 px-3 py-2 text-sm text-ink">
          {match.mutexNoteHe}
        </p>
      ) : null}
      <dl className="mt-4 hidden gap-2 text-sm sm:grid sm:grid-cols-2">
        <div>
          <dt className="text-ink-soft">מועד</dt>
          <dd>
            {publicDeadlineLabelHe(s.deadline, s.lastVerified)}
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
            <dd>
              <HeWithEn text={inst} />
            </dd>
          </div>
        ) : null}
      </dl>

      <button
        type="button"
        className="no-print mt-3 min-h-11 text-sm font-medium text-forest underline underline-offset-4 sm:hidden"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? HE.actions.hideDetails : HE.actions.showDetails}
      </button>
      <div className={expanded ? "block" : "hidden sm:block print:block"}>{details}</div>
    </article>
  );
}

export function EmptyBucket() {
  return (
    <p className="rounded-2xl border border-dashed border-line p-6 text-ink-soft">
      אין מלגות בקטגוריה זו לפי הסינון הנוכחי.{" "}
      <Link href="/chat" className="underline underline-offset-4">
        {HE.actions.chatIntake}
      </Link>
    </p>
  );
}
