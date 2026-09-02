import type { Scholarship } from "@/lib/types";
import { whatsappScholarshipShareText, whatsappShareHref } from "@/lib/format";
import { HE } from "@/lib/i18n/he";
import { ExternalLink } from "@/components/ExternalLink";

export function WhatsAppShareLink({
  scholarship,
  className = "",
}: {
  scholarship: Scholarship;
  className?: string;
}) {
  const text = whatsappScholarshipShareText({
    nameHe: scholarship.nameHe,
    amounts: scholarship.amounts,
    deadline: scholarship.deadline,
  });
  return (
    <ExternalLink
      className={`inline-flex min-h-11 items-center text-sm underline underline-offset-4 ${className}`}
      href={whatsappShareHref(text)}
    >
      {HE.actions.shareWhatsapp}
    </ExternalLink>
  );
}
