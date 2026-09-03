import { filledWizardFieldCount } from "./profile-fields";
import { stripSharedProfileFromLocation } from "./profile-share";
import { clearProfile, profileIsEmpty } from "./profile-storage";
import { clearTracking } from "./tracking";
import type { StudentProfile } from "./types";
import { clearWaitlist } from "./waitlist";

/**
 * Wipe device answers the same way as DeleteMyDataButton, plus drop a `#p=`
 * share so the next chat hydrate cannot restore the old profile.
 * Must use `clearProfile()` — `saveProfile({})` will not overwrite a filled store.
 */
export function wipeStudentSession(): void {
  clearProfile();
  clearTracking();
  clearWaitlist();
  stripSharedProfileFromLocation();
}

export function showChatStartOver(profile: StudentProfile): boolean {
  return filledWizardFieldCount(profile) > 0 || !profileIsEmpty(profile);
}
