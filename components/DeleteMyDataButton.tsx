"use client";

import { useRouter } from "next/navigation";
import { HE } from "@/lib/i18n/he";
import { clearProfile } from "@/lib/profile-storage";
import { clearTracking } from "@/lib/tracking";

export function DeleteMyDataButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="min-h-11 rounded-full border border-danger/40 px-5 text-sm text-danger"
      onClick={() => {
        if (!window.confirm(HE.profile.deleteConfirm)) return;
        clearProfile();
        clearTracking();
        router.push("/");
      }}
    >
      {HE.actions.deleteAll}
    </button>
  );
}
