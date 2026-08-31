import { Suspense } from "react";
import { ProfileWizard } from "@/components/ProfileWizard";

export default function ProfilePage() {
  return (
    <Suspense fallback={<p className="px-4 py-16 text-center text-ink-soft">טוען את הפרופיל…</p>}>
      <ProfileWizard />
    </Suspense>
  );
}
