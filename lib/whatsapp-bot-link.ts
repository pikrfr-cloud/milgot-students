import { encodeSharedProfile, sharedResultsUrl } from "./profile-share";
import type { StudentProfile } from "./types";

/** Public bot number for wa.me. Empty on GitHub Pages so the button is hidden. */
export function publicWhatsAppBotNumber(): string {
  return (process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER ?? "").trim().replace(/\s+/g, "");
}

export function whatsappReminderPrefill(profile: StudentProfile): string | null {
  if (!encodeSharedProfile(profile)) return null;
  return `תזכורת\n${sharedResultsUrl(profile)}`;
}

/**
 * wa.me link to the configured bot with תזכורת + the same report URL as CopyReportLink.
 * Null when the env number is empty/whitespace or the profile is not shareable.
 */
export function whatsappReminderHref(profile: StudentProfile): string | null {
  const number = publicWhatsAppBotNumber();
  if (!number) return null;
  const text = whatsappReminderPrefill(profile);
  if (!text) return null;
  const pathNumber = number.replace(/^\+/, "").replace(/^whatsapp:/i, "");
  if (!pathNumber) return null;
  return `https://wa.me/${pathNumber}?text=${encodeURIComponent(text)}`;
}
