import { INSTITUTIONS } from "./institutions";
import { parseStudentProfile } from "./profile-schema";
import { isProfileFieldFilled } from "./profile-fields";
import { loadProfile, saveProfile } from "./profile-storage";
import { absoluteUrl } from "./site";
import type { ProfileField, StudentProfile } from "./types";

/** Hash / query key. Prefer `#p=` so GitHub Pages never sees the payload. */
export const SHARED_PROFILE_PARAM = "p";

/**
 * Every StudentProfile key that may be shared.
 * Unknown extras (schemaVersion, envelope wrappers, garbage) are dropped.
 */
const KNOWN_PROFILE_KEYS = [
  "institution",
  "campus",
  "degreeLevel",
  "yearOfStudy",
  "faculty",
  "fieldOfStudy",
  "average",
  "studyLoad",
  "weeklyHours",
  "cityOfResidence",
  "hometown",
  "peripheryResidence",
  "peripheryHometown",
  "nationalPriorityResidence",
  "neighborhood",
  "bagrutAverage",
  "psychometric",
  "sechem",
  "householdSize",
  "householdIncomeBand",
  "age",
  "gender",
  "familyFlags",
  "employmentHours",
  "volunteerHoursPerYear",
  "hasPerach",
  "willingToVolunteer",
  "outstanding",
  "service",
  "combatRole",
  "yearsSinceDischarge",
  "reservistDaysLastYear",
  "loneSoldier",
  "sectors",
  "isOleh",
  "yearsInIsrael",
  "hasDisability",
  "disabilityRecognizedBy",
  "incomeBand",
  "socialBenefits",
  "firstGeneration",
  "completedMechina",
] as const satisfies readonly ProfileField[];

function isShareableValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value) && value.length === 0) return false;
  if (typeof value === "string" && value === "") return false;
  return true;
}

/** Filled known fields only — omit null, undefined, empty arrays, empty strings. */
export function compactStudentProfile(profile: StudentProfile): StudentProfile {
  const out: StudentProfile = {};
  for (const key of KNOWN_PROFILE_KEYS) {
    const value = profile[key];
    if (!isShareableValue(value)) continue;
    (out as Record<string, unknown>)[key] = value;
  }
  return out;
}

export function sharedProfileIsEmpty(profile: StudentProfile): boolean {
  return KNOWN_PROFILE_KEYS.every((key) => !isProfileFieldFilled(profile, key));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(payload: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(payload)) return null;
  try {
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const bin = atob(padded + pad);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

/** Base64url of JSON of the filled profile. Null when there is nothing to share. */
export function encodeSharedProfile(profile: StudentProfile): string | null {
  const compact = compactStudentProfile(profile);
  if (sharedProfileIsEmpty(compact)) return null;
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(compact)));
}

/**
 * Inverse of encodeSharedProfile. Rejects garbage, empty objects, and
 * payloads that do not survive parseStudentProfile.
 */
export function decodeSharedProfile(payload: string): StudentProfile | null {
  if (typeof payload !== "string") return null;
  const trimmed = payload.trim();
  if (!trimmed || trimmed.length > 8000) return null;
  let raw = trimmed;
  try {
    raw = decodeURIComponent(trimmed);
  } catch {
    raw = trimmed;
  }
  const bytes = base64UrlToBytes(raw);
  if (!bytes || bytes.length === 0) return null;
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
  const parsed = parseStudentProfile(parsedJson);
  if (!parsed) return null;
  const compact = compactStudentProfile(parsed);
  if (sharedProfileIsEmpty(compact)) return null;
  return compact;
}

export type LocationBits = Pick<Location, "hash" | "search">;

export function extractSharedProfilePayload(loc: LocationBits): string | null {
  const hashRaw = loc.hash.startsWith("#") ? loc.hash.slice(1) : loc.hash;
  if (hashRaw.startsWith(`${SHARED_PROFILE_PARAM}=`)) {
    return hashRaw.slice(SHARED_PROFILE_PARAM.length + 1);
  }
  const search = loc.search.startsWith("?") ? loc.search.slice(1) : loc.search;
  return new URLSearchParams(search).get(SHARED_PROFILE_PARAM);
}

export function readSharedProfileFromLocation(loc: LocationBits): StudentProfile | null {
  const raw = extractSharedProfilePayload(loc);
  if (!raw) return null;
  return decodeSharedProfile(raw);
}

/**
 * Landing / chat pre-filter: existing `#p=` plus simple `?institution=` / `?city=`.
 * Empty or unknown values are ignored — they must not wipe a filled profile.
 */
export function readChatSeedFromLocation(loc: LocationBits): StudentProfile | null {
  const shared = readSharedProfileFromLocation(loc) ?? {};
  const search = loc.search.startsWith("?") ? loc.search.slice(1) : loc.search;
  const params = new URLSearchParams(search);
  const seed: StudentProfile = { ...shared };

  const institution = params.get("institution")?.trim();
  if (institution && INSTITUTIONS.some((i) => i.id === institution)) {
    seed.institution = institution;
  }

  const cityRaw = params.get("city");
  if (cityRaw) {
    let city = cityRaw.trim();
    try {
      city = decodeURIComponent(city).trim();
    } catch {
      city = cityRaw.trim();
    }
    if (city) seed.cityOfResidence = city;
  }

  const compact = compactStudentProfile(seed);
  return sharedProfileIsEmpty(compact) ? null : compact;
}

/** Overlay a URL seed onto stored answers. Empty seed leaves stored untouched. */
export function mergeUrlSeedWithStored(
  stored: StudentProfile,
  fromUrl: StudentProfile | null,
): StudentProfile {
  if (!fromUrl || sharedProfileIsEmpty(fromUrl)) return stored;
  return { ...stored, ...fromUrl };
}

export function decodeSharedProfileFromUrl(url: string): StudentProfile | null {
  try {
    const parsed = new URL(url);
    return readSharedProfileFromLocation({ hash: parsed.hash, search: parsed.search });
  } catch {
    return null;
  }
}

export function sharedResultsUrl(profile: StudentProfile): string {
  const base = absoluteUrl("/results/");
  const encoded = encodeSharedProfile(profile);
  return encoded ? `${base}#${SHARED_PROFILE_PARAM}=${encoded}` : base;
}

type HistoryWindow = Pick<Window, "location" | "history">;

function resolveWindow(win?: HistoryWindow): HistoryWindow | null {
  if (win) return win;
  if (typeof window === "undefined") return null;
  return window;
}

/** Drop `#p=` / `?p=` / landing `?institution=` / `?city=` without a navigation. */
export function stripSharedProfileFromLocation(win?: HistoryWindow): void {
  const w = resolveWindow(win);
  if (!w) return;
  const url = new URL(w.location.href);
  url.searchParams.delete(SHARED_PROFILE_PARAM);
  url.searchParams.delete("institution");
  url.searchParams.delete("city");
  const hashRaw = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
  if (hashRaw.startsWith(`${SHARED_PROFILE_PARAM}=`)) {
    url.hash = "";
  }
  const next = `${url.pathname}${url.search}${url.hash}`;
  const current = `${w.location.pathname}${w.location.search}${w.location.hash}`;
  if (next === current) return;
  w.history.replaceState(w.history.state, "", next);
}

/**
 * If the hash/query is a valid seed, merge it onto the stored profile then strip.
 * Invalid or empty payloads are ignored and do not wipe a filled profile.
 */
export function hydrateSharedProfileFromLocation(win?: HistoryWindow): StudentProfile | null {
  const w = resolveWindow(win);
  if (!w) return null;
  const fromUrl = readChatSeedFromLocation(w.location);
  if (!fromUrl) return null;
  const merged = mergeUrlSeedWithStored(loadProfile(), fromUrl);
  saveProfile(merged);
  stripSharedProfileFromLocation(w);
  return merged;
}

/** Client mount helper: hydrate a shared URL, then load as usual. */
export function loadProfileHydratingShare(win?: HistoryWindow): StudentProfile {
  hydrateSharedProfileFromLocation(win);
  return loadProfile();
}
