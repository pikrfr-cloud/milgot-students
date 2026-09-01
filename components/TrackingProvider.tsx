"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ScholarshipTracking, TrackingStatus } from "@/lib/types";
import {
  loadTracking,
  setTrackingAcceptedAmount,
  setTrackingDocuments,
  setTrackingStatus,
} from "@/lib/tracking";

type TrackingContextValue = {
  tracking: ScholarshipTracking;
  setStatus: (id: string, status: TrackingStatus | null) => void;
  setDocuments: (id: string, documentsChecked: string[]) => void;
  setAcceptedAmount: (id: string, amount: number | null) => void;
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

  const setDocuments = useCallback((id: string, documentsChecked: string[]) => {
    setTracking((prev) => setTrackingDocuments(prev, id, documentsChecked));
  }, []);

  const setAcceptedAmount = useCallback((id: string, amount: number | null) => {
    setTracking((prev) => setTrackingAcceptedAmount(prev, id, amount));
  }, []);

  const value = useMemo(
    () => ({ tracking, setStatus, setDocuments, setAcceptedAmount, ready }),
    [tracking, setStatus, setDocuments, setAcceptedAmount, ready],
  );

  return <TrackingContext.Provider value={value}>{children}</TrackingContext.Provider>;
}

export function useTracking(): TrackingContextValue {
  const ctx = useContext(TrackingContext);
  if (!ctx) {
    return {
      tracking: {},
      setStatus: () => {},
      setDocuments: () => {},
      setAcceptedAmount: () => {},
      ready: false,
    };
  }
  return ctx;
}
