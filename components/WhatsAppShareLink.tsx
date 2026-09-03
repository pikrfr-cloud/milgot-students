import type { Scholarship } from "@/lib/types";
import { whatsappScholarshipShareText, whatsappShareHref } from "@/lib/format";
import { HE } from "@/lib/i18n/he";
import { ExternalLink } from "@/components/ExternalLink";

export function WhatsAppShareLink({
  scholarship,
  text,
  className = "",
}: {
  scholarship?: Scholarship;
  text?: string;
  className?: string;
}) {
  const shareText =
    text ??
    (scholarship
      ? whatsappScholarshipShareText({
          nameHe: scholarship.nameHe,
          amounts: scholarship.amounts,
          deadline: scholarship.deadline,
        })
      : "");
  if (!shareText) return null;
  return (
    <ExternalLink
      className={`inline-flex min-h-11 items-center text-sm underline underline-offset-4 ${className}`}
      href={whatsappShareHref(shareText)}
    >
      {HE.actions.shareWhatsapp}
    </ExternalLink>
  );
}
