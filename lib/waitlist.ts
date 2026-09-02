export const WAITLIST_STORAGE_KEY = "milgot-waitlist-v1";

export type WaitlistEntry = {
  email: string;
  consent: boolean;
  savedAt: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isPlausibleEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function parseWaitlist(data: unknown): WaitlistEntry | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (typeof o.email !== "string" || typeof o.consent !== "boolean" || typeof o.savedAt !== "string") {
    return null;
  }
  if (!o.consent || !isPlausibleEmail(o.email)) return null;
  return { email: o.email.trim(), consent: true, savedAt: o.savedAt };
}

export function loadWaitlist(): WaitlistEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(WAITLIST_STORAGE_KEY);
    if (!raw) return null;
    return parseWaitlist(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function saveWaitlist(email: string, consent: boolean): WaitlistEntry | null {
  if (typeof window === "undefined") return null;
  if (!consent || !isPlausibleEmail(email)) return null;
  const entry: WaitlistEntry = {
    email: email.trim(),
    consent: true,
    savedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // quota / private mode
  }
  return entry;
}

export function clearWaitlist(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(WAITLIST_STORAGE_KEY);
  } catch {
    // ignore
  }
}
