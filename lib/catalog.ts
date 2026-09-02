import type { Scholarship } from "./types";

/** Prior-year ILS kept because תשפ״ז was unpublished — does not count toward the amount+date gate. */
export const TASHPAV_UNPUBLISHED_HE = "סכום תשפ״ו; טרם פורסם לתשפ״ז";

/** Dean / authority shells — shown under «מדריך», not counted as matchable scholarships. */
export function isGuideRecord(s: Scholarship): boolean {
  return s.treatment === "checkAtInstitution" || s.treatment === "checkAtAuthority";
}

export function isMatchableScholarship(s: Scholarship): boolean {
  return !isGuideRecord(s);
}

/** Lexicographic max of `lastVerified` (`YYYY-MM` or `YYYY-MM-DD`). */
export function maxLastVerified(records: { lastVerified: string }[]): string {
  return records.reduce((max, s) => (s.lastVerified > max ? s.lastVerified : max), "");
}

export function applyUrlDuplicateGroups(list: Scholarship[]): Map<string, Scholarship[]> {
  const byUrl = new Map<string, Scholarship[]>();
  for (const s of list) {
    const url = s.applyUrl?.trim();
    if (!url) continue;
    const arr = byUrl.get(url) ?? [];
    arr.push(s);
    byUrl.set(url, arr);
  }
  for (const [url, arr] of byUrl) {
    if (arr.length < 2) byUrl.delete(url);
  }
  return byUrl;
}

export function duplicatePeers(s: Scholarship, list: Scholarship[] = []): Scholarship[] {
  if (!s.applyUrl) return [];
  return list.filter((o) => o.id !== s.id && o.applyUrl === s.applyUrl);
}

export function duplicateNoteHe(s: Scholarship, peers: Scholarship[]): string | null {
  if (!peers.length) return null;
  const names = peers.map((p) => p.nameHe).join(" · ");
  return `כפילות: אותו קישור הגשה כמו «${names}». הרשומות נשארו נפרדות — לא נמחקו.`;
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export function hasNumericIls(s: Scholarship): boolean {
  const min = s.amounts.minIls;
  const max = s.amounts.maxIls;
  return (typeof min === "number" && min > 0) || (typeof max === "number" && max > 0);
}

export function hasTashpavUnpublishedAmount(s: Scholarship): boolean {
  return s.amounts.textHe.includes(TASHPAV_UNPUBLISHED_HE);
}

/** Concrete calendar day on `date` or `opensAt` in the תשפ״ז application window (2026, or late-2025 open). */
export function concreteTashpazDeadlineDates(s: Scholarship): string[] {
  if (s.deadline.kind === "varies") return [];
  const out: string[] = [];
  for (const raw of [s.deadline.date, s.deadline.opensAt]) {
    if (!raw || !ISO_DAY.test(raw)) continue;
    const year = Number(raw.slice(0, 4));
    const month = Number(raw.slice(5, 7));
    const inTashpaz =
      year === 2026 || (year === 2025 && month >= 11) || (year === 2027 && month <= 3);
    if (inTashpaz) out.push(raw);
  }
  return out;
}

export type AmountDateGateReason =
  | "yes"
  | "guide"
  | "tip"
  | "no-numeric-ils"
  | "amount-uncertain"
  | "tashpav-unpublished"
  | "deadline-varies"
  | "deadline-uncertain"
  | "no-concrete-2026-date"
  | "applyurl-duplicate";

export function amountDateGateReason(
  s: Scholarship,
  list: Scholarship[] = [],
  countedApplyUrls?: Set<string>,
): AmountDateGateReason {
  if (s.kind === "tip") return "tip";
  if (isGuideRecord(s)) return "guide";
  if (!hasNumericIls(s)) return "no-numeric-ils";
  if (s.amounts.uncertain) return "amount-uncertain";
  if (hasTashpavUnpublishedAmount(s)) return "tashpav-unpublished";
  if (s.deadline.kind === "varies") return "deadline-varies";
  if (s.deadline.uncertain) return "deadline-uncertain";
  if (concreteTashpazDeadlineDates(s).length === 0) return "no-concrete-2026-date";
  const url = s.applyUrl?.trim();
  if (url && countedApplyUrls) {
    if (countedApplyUrls.has(url)) return "applyurl-duplicate";
  } else if (url) {
    const peers = list.filter((o) => o.id !== s.id && o.applyUrl === url);
    const earlierClone = peers.some((p) => list.indexOf(p) < list.indexOf(s));
    if (earlierClone) return "applyurl-duplicate";
  }
  return "yes";
}

/** Matchable record with numeric ILS and a dated תשפ״ז deadline — the product gate. */
export function countsTowardAmountDateGate(
  s: Scholarship,
  list: Scholarship[] = [],
  countedApplyUrls?: Set<string>,
): boolean {
  return amountDateGateReason(s, list, countedApplyUrls) === "yes";
}

export function matchableWithAmountAndDate(list: Scholarship[]): Scholarship[] {
  const countedUrls = new Set<string>();
  const out: Scholarship[] = [];
  for (const s of list) {
    if (!countsTowardAmountDateGate(s, list, countedUrls)) continue;
    out.push(s);
    const url = s.applyUrl?.trim();
    if (url) countedUrls.add(url);
  }
  return out;
}
