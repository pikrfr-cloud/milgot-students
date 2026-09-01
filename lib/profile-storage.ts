import type { StudentProfile } from "./types";
import { parseStudentProfile } from "./profile-schema";

export const PROFILE_STORAGE_KEY = "milgot-profile-v1";

export const emptyProfile: StudentProfile = {};

export function loadProfile(): StudentProfile {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as unknown;
    return parseStudentProfile(data) ?? {};
  } catch {
    return {};
  }
}

export function saveProfile(profile: StudentProfile): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
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
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), profile }, null, 2);
}

export function parseImportedProfile(raw: string): StudentProfile | null {
  try {
    const data = JSON.parse(raw) as { profile?: unknown } | unknown;
    if (data && typeof data === "object" && "profile" in (data as object)) {
      return parseStudentProfile((data as { profile: unknown }).profile);
    }
    return parseStudentProfile(data);
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
