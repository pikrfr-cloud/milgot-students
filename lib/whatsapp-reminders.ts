import { SCHOLARSHIPS } from "@/data/scholarships";
import { HE } from "./i18n/he";
import { groupMatches, matchAll } from "./matcher";
import { decodeSharedProfile, decodeSharedProfileFromUrl } from "./profile-share";
import type { Scholarship, StudentProfile } from "./types";

function normalizeCommand(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/** Catalog `deadline.date` only — full ISO day. Not opensAt, not prose. */
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export const JERUSALEM_TZ = "Asia/Jerusalem";

export type ReminderItem = {
  id: string;
  nameHe: string;
  deadlineDate: string;
};

export type ReminderSubscription = {
  from: string;
  items: ReminderItem[];
};

export function isCatalogIsoDate(value: string | undefined): value is string {
  return typeof value === "string" && ISO_DAY.test(value);
}

/**
 * Civil date in Asia/Jerusalem (YYYY-MM-DD).
 * Do not use the Worker isolate's UTC calendar day.
 */
export function jerusalemCalendarDate(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: JERUSALEM_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  if (!y || !m || !d) return "";
  return `${y}-${m}-${d}`;
}

/** Subtract calendar days from a catalog ISO date (UTC civil arithmetic). */
export function calendarDateMinusDays(isoDate: string, days: number): string | null {
  if (!isCatalogIsoDate(isoDate)) return null;
  const [year, month, day] = isoDate.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day));
  shifted.setUTCDate(shifted.getUTCDate() - days);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function reminderDayForDeadline(deadlineDate: string): string | null {
  return calendarDateMinusDays(deadlineDate, 7);
}

/**
 * True when `now` (instant) falls on deadline.date minus 7 Asia/Jerusalem calendar days.
 */
export function shouldSendReminder(opts: {
  deadlineDate: string | undefined;
  now: Date;
}): boolean {
  if (!isCatalogIsoDate(opts.deadlineDate)) return false;
  const reminderDay = reminderDayForDeadline(opts.deadlineDate);
  if (!reminderDay) return false;
  return jerusalemCalendarDate(opts.now) === reminderDay;
}

export function sentReminderKey(from: string, scholarshipId: string, deadlineDate: string): string {
  return `sent:${from}:${scholarshipId}:${deadlineDate}`;
}

export function subscriptionKey(from: string): string {
  return `sub:${from}`;
}

/** Matcher-eligible (מתאים) rows that have a known ISO `deadline.date`. */
export function reminderCandidatesFromProfile(
  profile: StudentProfile,
  asOf: Date = new Date(),
  catalog: Scholarship[] = SCHOLARSHIPS,
): ReminderItem[] {
  const matches = matchAll(catalog, profile, { asOf });
  const { eligible } = groupMatches(matches);
  const items: ReminderItem[] = [];
  for (const m of eligible) {
    const date = m.scholarship.deadline.date;
    if (!isCatalogIsoDate(date)) continue;
    items.push({
      id: m.scholarship.id,
      nameHe: m.scholarship.nameHe,
      deadlineDate: date,
    });
  }
  return items;
}

export function isReminderStopCommand(raw: string): boolean {
  const t = normalizeCommand(raw).toLowerCase();
  return t === "stop" || t === "הפסק";
}

/**
 * «תזכורת» alone, or a site-button message that includes that word
 * (plus a report URL).
 */
export function isReminderSubscribeCommand(raw: string): boolean {
  const t = normalizeCommand(raw);
  if (!t) return false;
  if (t === "תזכורת" || t.toLowerCase() === "reminder") return true;
  return /(?:^|[\s,.;:!?\n])תזכורת(?:$|[\s,.;:!?\n])/u.test(` ${t} `);
}

export function profileFromReminderBody(body: string): StudentProfile | null {
  const urls = body.match(/https?:\/\/[^\s<>"']+/gi) ?? [];
  for (const raw of urls) {
    const cleaned = raw.replace(/[).,]+$/g, "");
    const profile = decodeSharedProfileFromUrl(cleaned);
    if (profile) return profile;
  }
  const hash = /#p=([A-Za-z0-9_-]+)/.exec(body);
  if (hash?.[1]) {
    const profile = decodeSharedProfile(hash[1]);
    if (profile) return profile;
  }
  return null;
}

export function reminderMessageHe(nameHe: string, deadlineDate: string): string {
  return `תזכורת: ${nameHe} — המועד ${deadlineDate}.`;
}

export function parseSubscriptionJson(raw: string | null): ReminderSubscription | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const o = parsed as Record<string, unknown>;
    if (typeof o.from !== "string" || !o.from) return null;
    if (!Array.isArray(o.items)) return null;
    const items: ReminderItem[] = [];
    for (const row of o.items) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      if (typeof r.id !== "string" || typeof r.nameHe !== "string" || !isCatalogIsoDate(r.deadlineDate as string)) {
        continue;
      }
      items.push({
        id: r.id,
        nameHe: r.nameHe,
        deadlineDate: r.deadlineDate as string,
      });
    }
    return { from: o.from, items };
  } catch {
    return null;
  }
}

export const REMINDER_COPY = {
  needReportFirst: HE.whatsapp.reminderNeedReport,
  subscribed: HE.whatsapp.reminderSubscribed,
  noneDated: HE.whatsapp.reminderNoneDated,
  stopped: HE.whatsapp.reminderStopped,
  saveFailed: HE.whatsapp.reminderSaveFailed,
} as const;
