"use client";

import type { ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";
import { ExternalLink } from "@/components/ExternalLink";

/** Apply URL with optional privacy-safe `apply_click` when analytics is on. */
export function ApplyLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <ExternalLink className={className} href={href} onClick={() => trackEvent("apply_click")}>
      {children}
    </ExternalLink>
  );
}
