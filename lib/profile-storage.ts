import type { StudentProfile } from "./types";

export const PROFILE_STORAGE_KEY = "milgot-profile-v1";

export const emptyProfile: StudentProfile = {};

export function loadProfile(): StudentProfile {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StudentProfile;
  } catch {
    return {};
  }
}

export function saveProfile(profile: StudentProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PROFILE_STORAGE_KEY);
}

export function exportProfileJson(profile: StudentProfile): string {
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), profile }, null, 2);
}

export function parseImportedProfile(raw: string): StudentProfile | null {
  try {
    const data = JSON.parse(raw) as { profile?: StudentProfile } | StudentProfile;
    if (data && typeof data === "object" && "profile" in data && data.profile) {
      return data.profile as StudentProfile;
    }
    if (data && typeof data === "object") return data as StudentProfile;
    return null;
  } catch {
    return null;
  }
}

export function profileIsEmpty(profile: StudentProfile): boolean {
  return Object.values(profile).every(
    (v) => v === null || v === undefined || (Array.isArray(v) && v.length === 0),
  );
}

export function downloadProfileJson(profile: StudentProfile): void {
  const blob = new Blob([exportProfileJson(profile)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "milgot-profile.json";
  a.click();
  URL.revokeObjectURL(url);
}
