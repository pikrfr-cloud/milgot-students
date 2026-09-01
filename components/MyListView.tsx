"use client";

import { useMemo } from "react";
import Link from "next/link";
import { SCHOLARSHIPS, getScholarshipById } from "@/data/scholarships";
import { deadlineStatus, formatDeadline, formatIls, shouldHideIcs } from "@/lib/format";
import { TRACKING_STATUSES, type TrackingStatus } from "@/lib/types";
import { trackingLabelHe } from "@/lib/tracking";
import { downloadCombinedIcs, downloadIcs } from "@/lib/ics";
import { useTracking } from "@/components/TrackingProvider";
import { scholarshipPagePath } from "@/lib/catalog-routes";
import { HE } from "@/lib/i18n/he";

export function MyListView() {
  const { tracking, setStatus, setDocuments, setAcceptedAmount, ready } = useTracking();
  const asOf = useMemo(() => new Date(), []);

  if (!ready) {
    return <p className="px-4 py-16 text-center text-ink-soft">{HE.profile.loading}</p>;
  }

  const rows = Object.entries(tracking)
    .map(([id, entry]) => {
      const scholarship = getScholarshipById(id) ?? SCHOLARSHIPS.find((s) => s.id === id);
      if (!scholarship) return null;
      return { scholarship, entry };
    })
    .filter((row): row is NonNullable<typeof row> => row != null)
    .sort((a, b) => {
      const da = a.scholarship.deadline.date ?? "9999";
      const db = b.scholarship.deadline.date ?? "9999";
      return da.localeCompare(db);
    });

  const acceptedSum = rows.reduce((sum, row) => {
    if (row.entry.status !== "accepted") return sum;
    const n = row.entry.acceptedAmountIls;
    return n != null && n > 0 ? sum + n : sum;
  }, 0);

  const icsList = rows
    .map((r) => r.scholarship)
    .filter((s) => !shouldHideIcs(s.deadline, asOf));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl text-forest-deep">{HE.nav.myList}</h1>
      <p className="mt-2 text-ink-soft leading-relaxed">
        כלי עבודה אישי במכשיר זה: מועד, סטטוס הגשה, ומסמכים שסומנו. אין סיכום ציבורי של «משתמשינו גייסו».
      </p>
      {rows.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-line p-6 text-ink-soft">
          אין מלגות במעקב. סמנו סטטוס בכרטיס בדוח או בקטלוג.{" "}
          <Link href="/results/" className="underline underline-offset-4">
            {HE.nav.results}
          </Link>
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {icsList.length ? (
              <button
                type="button"
                className="min-h-11 rounded-full border border-line px-4 text-sm"
                onClick={() => downloadCombinedIcs(icsList)}
              >
                {HE.actions.exportMyListIcs}
              </button>
            ) : null}
            {acceptedSum > 0 ? (
              <p className="self-center text-sm text-ink-soft">
                סכום שהזנתם תחת «התקבל» במכשיר זה בלבד: {formatIls(acceptedSum)}
              </p>
            ) : null}
          </div>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-card">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="border-b border-line bg-paper-deep text-right">
                  <th className="p-3 font-medium">מלגה</th>
                  <th className="p-3 font-medium">מועד סגירה</th>
                  <th className="p-3 font-medium">סטטוס</th>
                  <th className="p-3 font-medium">מסמכים</th>
                  <th className="p-3 font-medium">סכום שהתקבל</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ scholarship, entry }) => {
                  const due = deadlineStatus(scholarship.deadline, asOf);
                  const checked = new Set(entry.documentsChecked ?? []);
                  return (
                    <tr key={scholarship.id} className="border-b border-line/70 align-top">
                      <td className="p-3">
                        <Link
                          href={scholarshipPagePath(scholarship.id)}
                          className="font-medium text-forest underline underline-offset-4"
                        >
                          {scholarship.nameHe}
                        </Link>
                        <p className="mt-1 text-xs text-ink-soft">{scholarship.funderHe}</p>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div>{due.labelHe}</div>
                        <div className="text-ink-soft">{formatDeadline(scholarship.deadline)}</div>
                        {!shouldHideIcs(scholarship.deadline, asOf) ? (
                          <button
                            type="button"
                            className="mt-1 text-xs underline underline-offset-4"
                            onClick={() => downloadIcs(scholarship)}
                          >
                            {HE.actions.addToCalendar}
                          </button>
                        ) : null}
                      </td>
                      <td className="p-3">
                        <select
                          className="min-h-11 rounded-xl border border-line px-2"
                          aria-label={`סטטוס עבור ${scholarship.nameHe}`}
                          value={entry.status}
                          onChange={(e) =>
                            setStatus(scholarship.id, e.target.value as TrackingStatus)
                          }
                        >
                          {TRACKING_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {trackingLabelHe(st)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="mt-1 block text-xs text-ink-soft underline underline-offset-4"
                          onClick={() => setStatus(scholarship.id, null)}
                        >
                          הסרה מהרשימה
                        </button>
                      </td>
                      <td className="p-3">
                        <ul className="space-y-1">
                          {scholarship.documentsHe.map((doc) => (
                            <li key={doc}>
                              <label className="flex min-h-11 items-start gap-2">
                                <input
                                  type="checkbox"
                                  className="mt-1 h-5 w-5"
                                  checked={checked.has(doc)}
                                  onChange={(e) => {
                                    const next = new Set(checked);
                                    if (e.target.checked) next.add(doc);
                                    else next.delete(doc);
                                    setDocuments(scholarship.id, [...next]);
                                  }}
                                />
                                <span>{doc}</span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="p-3">
                        {entry.status === "accepted" ? (
                          <label className="block text-xs text-ink-soft">
                            סכום ₪ (במכשיר זה)
                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              className="mt-1 min-h-11 w-full rounded-xl border border-line px-2"
                              value={entry.acceptedAmountIls ?? ""}
                              onChange={(e) =>
                                setAcceptedAmount(
                                  scholarship.id,
                                  e.target.value === "" ? null : Number(e.target.value),
                                )
                              }
                            />
                          </label>
                        ) : (
                          <span className="text-ink-soft">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
