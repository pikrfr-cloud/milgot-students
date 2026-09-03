import type { Deadline, Scholarship } from "./types";

function icsEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function dateStamp(isoDate: string): string {
  return isoDate.replace(/-/g, "");
}

function utcStamp(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  const s = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${day}T${h}${min}${s}Z`;
}

function addOneDay(isoDate: string): string {
  const ms = Date.parse(`${isoDate}T12:00:00Z`);
  const next = new Date(ms + 86_400_000);
  return next.toISOString().slice(0, 10);
}

/** RFC 5545: fold lines at 75 octets; continuations start with a space. */
export function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const chars = [...line];
  const out: string[] = [];
  let current = "";
  for (const ch of chars) {
    const trial = current + ch;
    if (encoder.encode(trial).length > 75) {
      out.push(current);
      current = ` ${ch}`;
    } else {
      current = trial;
    }
  }
  if (current) out.push(current);
  return out.join("\r\n");
}

export function deadlineToIcs(
  scholarship: Scholarship,
  deadline: Deadline,
  now: Date = new Date(),
): string | null {
  if (!deadline.date) return null;
  const stamp = dateStamp(deadline.date);
  const end = dateStamp(addOneDay(deadline.date));
  const uid = `${scholarship.id}-${stamp}@milgot-students`;
  const summary = icsEscape(`מועד הגשה: ${scholarship.nameHe}`);
  const desc = icsEscape(
    [scholarship.funderHe, deadline.textHe, scholarship.applyUrl ?? ""].filter(Boolean).join("\n"),
  );
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//milgot-students//he",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART;VALUE=DATE:${stamp}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${desc}`,
    scholarship.applyUrl ? `URL:${scholarship.applyUrl}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter((line) => line !== "")
    .map(foldIcsLine);
  return `${lines.join("\r\n")}\r\n`;
}

export function scholarshipsToIcs(scholarships: Scholarship[], now: Date = new Date()): string | null {
  const events = scholarships.filter((s) => s.deadline.date);
  if (!events.length) return null;
  const inner: string[] = [];
  for (const s of events) {
    const body = deadlineToIcs(s, s.deadline, now);
    if (!body) continue;
    const start = body.indexOf("BEGIN:VEVENT");
    const end = body.indexOf("END:VEVENT");
    if (start < 0 || end < 0) continue;
    inner.push(body.slice(start, end + "END:VEVENT".length));
  }
  if (!inner.length) return null;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//milgot-students//he",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...inner,
    "END:VCALENDAR",
  ].flatMap((block) => block.split(/\r?\n/)).filter((l) => l !== "");
  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}

function triggerDownload(body: string, filename: string): void {
  const blob = new Blob([body], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function downloadIcs(scholarship: Scholarship): void {
  const body = deadlineToIcs(scholarship, scholarship.deadline);
  if (!body) return;
  triggerDownload(body, `${scholarship.id}-deadline.ics`);
}

export function downloadCombinedIcs(
  scholarships: Scholarship[],
  filename = "milgot-my-list.ics",
): void {
  const body = scholarshipsToIcs(scholarships);
  if (!body) return;
  triggerDownload(body, filename);
}
