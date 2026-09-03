import { faceChips } from "@/lib/card-chips";
import type { Scholarship } from "@/lib/types";

const amountStyle = {
  approved: "bg-ok/10 text-ok",
  estimate: "bg-gold/20 text-ink",
  unpublished: "bg-paper-deep text-ink-soft",
} as const;

export function ScholarshipFaceChips({
  scholarship,
  className = "",
}: {
  scholarship: Scholarship;
  className?: string;
}) {
  const chips = faceChips(scholarship);
  return (
    <ul className={`flex flex-wrap gap-1.5 text-xs ${className}`} aria-label="סכום, מועד והתנדבות">
      <li className={`rounded-full px-2 py-0.5 ${amountStyle[chips.amountConfidence]}`}>
        {chips.amountHe}
        {chips.amountConfidence === "estimate" ? " · צפי" : null}
      </li>
      <li className="rounded-full bg-paper-deep px-2 py-0.5 text-ink-soft">{chips.deadlineHe}</li>
      <li
        className={`rounded-full px-2 py-0.5 ${
          chips.requiresVolunteering ? "bg-warn/10 text-warn" : "bg-paper-deep text-ink-soft"
        }`}
      >
        {chips.volunteeringHe}
      </li>
    </ul>
  );
}
