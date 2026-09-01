import { TRACKING_STATUSES, type ScholarshipTracking, type TrackingStatus } from "./types";

export const TRACKING_STORAGE_KEY = "milgot-tracking-v1";

export type { TrackingStatus };

export function loadTracking(): ScholarshipTracking {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(TRACKING_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ScholarshipTracking;
  } catch {
    return {};
  }
}

export function saveTracking(map: ScholarshipTracking): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // quota / private mode — ignore
  }
}

export function clearTracking(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TRACKING_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function setTrackingStatus(
  map: ScholarshipTracking,
  id: string,
  status: TrackingStatus | null,
): ScholarshipTracking {
  const next = { ...map };
  if (!status) {
    delete next[id];
  } else {
    next[id] = { status, updatedAt: new Date().toISOString() };
  }
  saveTracking(next);
  return next;
}

export function trackingLabelHe(status: TrackingStatus): string {
  switch (status) {
    case "in_progress":
      return "בטיפול";
    case "submitted":
      return "הוגש";
    case "accepted":
      return "התקבל";
  }
}

export { TRACKING_STATUSES };
