import { Suspense } from "react";
import type { Metadata } from "next";
import { ProfileWizard } from "@/components/ProfileWizard";
import { HE } from "@/lib/i18n/he";

export const metadata: Metadata = {
  title: HE.nav.profile,
  description: "מילוי הפרטים. נשמר במכשיר בלבד.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/profile/" },
};

export default function ProfilePage() {
  return (
    <Suspense fallback={<p className="px-4 py-16 text-center text-ink-soft">{HE.profile.loading}</p>}>
      <ProfileWizard />
    </Suspense>
  );
}
