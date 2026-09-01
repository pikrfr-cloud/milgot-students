import { Suspense } from "react";
import type { Metadata } from "next";
import { FastReport } from "@/components/FastReport";
import { HE } from "@/lib/i18n/he";

export const metadata: Metadata = {
  title: HE.nav.fastReport,
  description: "חמש שאלות ודוח חלקי מיד. הנתונים נשמרים במכשיר בלבד.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/profile/fast/" },
};

export default function FastReportPage() {
  return (
    <Suspense fallback={<p className="px-4 py-16 text-center text-ink-soft">{HE.profile.loading}</p>}>
      <FastReport />
    </Suspense>
  );
}
