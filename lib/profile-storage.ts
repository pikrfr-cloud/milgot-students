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

export function profileIsEmpty(profile: StudentProfile): boolean {
  return Object.values(profile).every(
    (v) => v === null || v === undefined || (Array.isArray(v) && v.length === 0),
  );
}
