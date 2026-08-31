import type { Deadline, Scholarship } from "./types";

function icsEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function dateStamp(isoDate: string): string {
  return isoDate.replace(/-/g, "");
}

export function deadlineToIcs(scholarship: Scholarship, deadline: Deadline): string | null {
  if (!deadline.date) return null;
  const stamp = dateStamp(deadline.date);
  const uid = `${scholarship.id}-${stamp}@milgot-students`;
  const summary = icsEscape(`מועד הגשה: ${scholarship.nameHe}`);
  const desc = icsEscape(
    [scholarship.funderHe, deadline.textHe, scholarship.applyUrl ?? ""].filter(Boolean).join("\n"),
  );
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//milgot-students//he",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}T000000Z`,
    `DTSTART;VALUE=DATE:${stamp}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${desc}`,
    scholarship.applyUrl ? `URL:${scholarship.applyUrl}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ]
    .filter((line) => line !== "")
    .join("\r\n");
}

export function downloadIcs(scholarship: Scholarship): void {
  const body = deadlineToIcs(scholarship, scholarship.deadline);
  if (!body) return;
  const blob = new Blob([body], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${scholarship.id}-deadline.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
