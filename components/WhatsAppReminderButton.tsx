import { HE } from "@/lib/i18n/he";
import { whatsappReminderHref } from "@/lib/whatsapp-bot-link";
import type { StudentProfile } from "@/lib/types";

/** Opens the WhatsApp bot with תזכורת + this report’s share URL. Not a friend-share link. */
export function WhatsAppReminderButton({ profile }: { profile: StudentProfile }) {
  const href = whatsappReminderHref(profile);
  if (!href) return null;
  return (
    <a
      className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {HE.actions.whatsappReminder}
    </a>
  );
}
