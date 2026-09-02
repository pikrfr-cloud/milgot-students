import type { Scholarship } from "./types";

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
