"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ScholarshipTracking, TrackingStatus } from "@/lib/types";
import { loadTracking, setTrackingStatus } from "@/lib/tracking";

type TrackingContextValue = {
  tracking: ScholarshipTracking;
  setStatus: (id: string, status: TrackingStatus | null) => void;
  ready: boolean;
};

const TrackingContext = createContext<TrackingContextValue | null>(null);

export function TrackingProvider({ children }: { children: ReactNode }) {
  const [tracking, setTracking] = useState<ScholarshipTracking>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client storage
    setTracking(loadTracking());
    setReady(true);
  }, []);

  const setStatus = useCallback((id: string, status: TrackingStatus | null) => {
    setTracking((prev) => setTrackingStatus(prev, id, status));
  }, []);

  const value = useMemo(() => ({ tracking, setStatus, ready }), [tracking, setStatus, ready]);

  return <TrackingContext.Provider value={value}>{children}</TrackingContext.Provider>;
}

export function useTracking(): TrackingContextValue {
  const ctx = useContext(TrackingContext);
  if (!ctx) {
    return {
      tracking: {},
      setStatus: () => {},
      ready: false,
    };
  }
  return ctx;
}
