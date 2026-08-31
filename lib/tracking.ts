import type { ScholarshipTracking, TrackingStatus } from "./types";

export const TRACKING_STORAGE_KEY = "milgot-tracking-v1";

export type { TrackingStatus };

const STATUSES: TrackingStatus[] = ["in_progress", "submitted", "accepted"];

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
  window.localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(map));
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

export { STATUSES as TRACKING_STATUSES };
