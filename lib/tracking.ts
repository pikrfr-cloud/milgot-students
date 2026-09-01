import { TRACKING_STATUSES, type ScholarshipTracking, type TrackingEntry, type TrackingStatus } from "./types";

export const TRACKING_STORAGE_KEY = "milgot-tracking-v1";

export type { TrackingStatus };

function isTrackingStatus(value: unknown): value is TrackingStatus {
  return typeof value === "string" && (TRACKING_STATUSES as readonly string[]).includes(value);
}

export function parseTracking(data: unknown): ScholarshipTracking {
  if (!data || typeof data !== "object") return {};
  const out: ScholarshipTracking = {};
  for (const [id, raw] of Object.entries(data as Record<string, unknown>)) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;
    if (!isTrackingStatus(o.status) || typeof o.updatedAt !== "string") continue;
    const entry: TrackingEntry = { status: o.status, updatedAt: o.updatedAt };
    if (Array.isArray(o.documentsChecked)) {
      entry.documentsChecked = o.documentsChecked.filter((d): d is string => typeof d === "string");
    }
    if (typeof o.acceptedAmountIls === "number" && Number.isFinite(o.acceptedAmountIls)) {
      entry.acceptedAmountIls = o.acceptedAmountIls;
    } else if (o.acceptedAmountIls === null) {
      entry.acceptedAmountIls = null;
    }
    out[id] = entry;
  }
  return out;
}

export function loadTracking(): ScholarshipTracking {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(TRACKING_STORAGE_KEY);
    if (!raw) return {};
    return parseTracking(JSON.parse(raw) as unknown);
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
    const prev = map[id];
    next[id] = {
      status,
      updatedAt: new Date().toISOString(),
      documentsChecked: prev?.documentsChecked,
      acceptedAmountIls: prev?.acceptedAmountIls,
    };
  }
  saveTracking(next);
  return next;
}

export function setTrackingDocuments(
  map: ScholarshipTracking,
  id: string,
  documentsChecked: string[],
): ScholarshipTracking {
  const prev = map[id];
  if (!prev) return map;
  const next = {
    ...map,
    [id]: { ...prev, documentsChecked, updatedAt: new Date().toISOString() },
  };
  saveTracking(next);
  return next;
}

export function setTrackingAcceptedAmount(
  map: ScholarshipTracking,
  id: string,
  acceptedAmountIls: number | null,
): ScholarshipTracking {
  const prev = map[id];
  if (!prev) return map;
  const next = {
    ...map,
    [id]: { ...prev, acceptedAmountIls, updatedAt: new Date().toISOString() },
  };
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
