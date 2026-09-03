import type { StudentProfile } from "./types";
import { parseStudentProfile } from "./profile-schema";

export const PROFILE_STORAGE_KEY = "milgot-profile-v1";
/** Envelope version in localStorage. Bump when adding fields; migrate instead of wiping. */
export const PROFILE_SCHEMA_VERSION = 2;

export const emptyProfile: StudentProfile = {};

export type StoredProfileEnvelope = {
  schemaVersion: number;
  profile: StudentProfile;
};

function looksLikeEnvelope(data: unknown): data is { profile: unknown } {
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  return "profile" in o && ("schemaVersion" in o || "version" in o || "exportedAt" in o);
}

/**
 * Load a stored profile without wiping unknown/new fields.
 * v1 was a raw StudentProfile JSON; v2+ is `{ schemaVersion, profile }`.
 */
export function migrateStoredProfile(data: unknown): StudentProfile {
  if (data == null) return {};
  if (looksLikeEnvelope(data)) {
    return parseStudentProfile(data.profile) ?? {};
  }
  return parseStudentProfile(data) ?? {};
}

export function serializeProfile(profile: StudentProfile): StoredProfileEnvelope {
  return { schemaVersion: PROFILE_SCHEMA_VERSION, profile };
}

export function loadProfile(): StudentProfile {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return {};
    return migrateStoredProfile(JSON.parse(raw) as unknown);
  } catch {
    return {};
  }
}

/** Never overwrite a filled stored profile with an empty hydrate/reset write. */
export function shouldWriteStoredProfile(next: StudentProfile, existing: StudentProfile): boolean {
  if (profileIsEmpty(next) && !profileIsEmpty(existing)) return false;
  return true;
}

export function saveProfile(profile: StudentProfile): void {
  if (typeof window === "undefined") return;
  try {
    const existing = loadProfile();
    if (!shouldWriteStoredProfile(profile, existing)) return;
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(serializeProfile(profile)));
  } catch {
    // quota / private mode
  }
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function exportProfileJson(profile: StudentProfile): string {
  return JSON.stringify(
    {
      schemaVersion: PROFILE_SCHEMA_VERSION,
      version: PROFILE_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      profile,
    },
    null,
    2,
  );
}

export function parseImportedProfile(raw: string): StudentProfile | null {
  try {
    return migrateStoredProfile(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function profileIsEmpty(profile: StudentProfile): boolean {
  return Object.values(profile).every(
    (v) => v === null || v === undefined || (Array.isArray(v) && v.length === 0),
  );
}

function triggerBlobDownload(body: string, filename: string, mime: string): void {
  const blob = new Blob([body], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function downloadProfileJson(profile: StudentProfile): void {
  triggerBlobDownload(
    exportProfileJson(profile),
    "milgot-profile.json",
    "application/json;charset=utf-8",
  );
}
