import type { Amount, Deadline, Scholarship } from "./types";

/** Prior-year ILS kept because תשפ״ז was unpublished — does not count toward the amount+date gate. */
export const TASHPAV_UNPUBLISHED_HE = "סכום תשפ״ו; טרם פורסם לתשפ״ז";

/** Dean / authority shells — shown under «מדריך», not counted as matchable scholarships. */
export function isGuideRecord(s: Scholarship): boolean {
  return s.treatment === "checkAtInstitution" || s.treatment === "checkAtAuthority";
}

export function isMatchableScholarship(s: Scholarship): boolean {
  return !isGuideRecord(s);
}

/**
 * Headline «מלגות להתאמה»: unique by applyUrl among matchable rows.
 * Duplicate records stay in the catalog list; only the count collapses.
 * Rows without applyUrl each count as themselves.
 */
/** Same apply link even when one record uses `www.` or a trailing slash. */
export function canonicalApplyUrl(url: string): string {
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    const path = parsed.pathname.replace(/\/+$/, "") || "/";
    return `${parsed.protocol}//${host}${path}${parsed.search}`;
  } catch {
    return trimmed;
  }
}

export function uniqueMatchableByApplyUrl(list: Scholarship[]): Scholarship[] {
  const seen = new Set<string>();
  const out: Scholarship[] = [];
  for (const s of list) {
    if (!isMatchableScholarship(s)) continue;
    const url = s.applyUrl?.trim();
    if (url) {
      const key = canonicalApplyUrl(url);
      if (seen.has(key)) continue;
      seen.add(key);
    }
    out.push(s);
  }
  return out;
}

export function uniqueMatchableCount(list: Scholarship[]): number {
  return uniqueMatchableByApplyUrl(list).length;
}

/** Secondary line when the list has more rows than unique applyUrl. */
export function uniqueApplyUrlNoteHe(rows: number, unique: number): string | null {
  if (rows <= unique) return null;
  return `${rows} רשומות בקטלוג, ${unique} ייחודיות לפי קישור הגשה`;
}

export function hasSecondaryDeadlineSource(s: Scholarship): boolean {
  return s.deadlineSource === "secondary";
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
    const key = canonicalApplyUrl(url);
    const arr = byUrl.get(key) ?? [];
    arr.push(s);
    byUrl.set(key, arr);
  }
  for (const [url, arr] of byUrl) {
    if (arr.length < 2) byUrl.delete(url);
  }
  return byUrl;
}

export function duplicatePeers(s: Scholarship, list: Scholarship[] = []): Scholarship[] {
  if (!s.applyUrl) return [];
  const key = canonicalApplyUrl(s.applyUrl);
  return list.filter((o) => o.id !== s.id && o.applyUrl && canonicalApplyUrl(o.applyUrl) === key);
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

const DEAN_HOST = /^(dean|dekanat|studean|deanstudents)\./i;
const DEAN_SEGMENT = /^(dean|dean-of-students|dean-students|deanstudents|dekanat|studean|feinberg|graduate|welcome)$/i;

/**
 * Institution / dean homepage used as the apply link — not a specific scholarship page.
 * Deep paths like `/financial-aid/special-scholarships` are not roots.
 */
export function isDeanRootApplyUrl(url: string | undefined): boolean {
  if (!url?.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    const path = parsed.pathname.replace(/\/+$/, "") || "/";
    const segments = path === "/" ? [] : path.split("/").filter(Boolean);
    const deanHost = DEAN_HOST.test(host);
    const institutionHome = /\.(ac|muni)\.il$/i.test(host);
    if (segments.length === 0) return deanHost || institutionHome;
    if (segments.length === 1 && DEAN_SEGMENT.test(decodeURIComponent(segments[0]))) {
      return deanHost || institutionHome;
    }
    return false;
  } catch {
    return false;
  }
}

/** Published rolling windows are not «unpublished». */
export function isUnpublishedDeadline(deadline: Deadline): boolean {
  if (deadline.kind === "rolling") return false;
  if (deadline.kind === "varies") return true;
  if (deadline.date) return false;
  return true;
}

/** No number, or a range / «משתנה» — not a single published ₪ figure. */
export function isVariableAmount(amount: Amount): boolean {
  const min = amount.minIls;
  const max = amount.maxIls;
  const hasMin = typeof min === "number" && min > 0;
  const hasMax = typeof max === "number" && max > 0;
  if (!hasMin && !hasMax) return true;
  if (hasMin && hasMax && min === max) return false;
  return !!amount.uncertain || (hasMin && hasMax && min !== max);
}

/**
 * Dean-homepage applyUrl + unpublished date + variable amount → מדריך.
 * Does not override an explicit treatment.
 */
export function shouldAutoClassifyAsGuide(s: Pick<Scholarship, "applyUrl" | "deadline" | "amounts" | "treatment">): boolean {
  if (s.treatment) return false;
  return isDeanRootApplyUrl(s.applyUrl) && isUnpublishedDeadline(s.deadline) && isVariableAmount(s.amounts);
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
