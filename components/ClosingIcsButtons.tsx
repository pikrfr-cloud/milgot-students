"use client";

import type { Scholarship } from "@/lib/types";
import { downloadCombinedIcs, downloadIcs } from "@/lib/ics";
import { HE } from "@/lib/i18n/he";

export function AddToCalendarButton({
  scholarship,
  className = "",
}: {
  scholarship: Scholarship;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`min-h-11 rounded-full border border-line px-3 text-sm ${className}`}
      onClick={() => downloadIcs(scholarship)}
    >
      {HE.actions.addToCalendarFull}
    </button>
  );
}

export function DownloadMonthIcsButton({
  scholarships,
  className = "",
}: {
  scholarships: Scholarship[];
  className?: string;
}) {
  if (!scholarships.length) return null;
  return (
    <button
      type="button"
      className={`min-h-11 rounded-full border border-line px-4 text-sm ${className}`}
      onClick={() => downloadCombinedIcs(scholarships, "milgot-closing.ics")}
    >
      {HE.actions.downloadMonthIcs}
    </button>
  );
}
