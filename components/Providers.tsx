"use client";

import { TrackingProvider } from "@/components/TrackingProvider";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <TrackingProvider>{children}</TrackingProvider>;
}
