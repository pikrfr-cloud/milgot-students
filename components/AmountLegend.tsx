import { HE } from "@/lib/i18n/he";

export function AmountLegend({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-ink-soft ${className}`} aria-label={HE.catalog.amountLegend}>
      <span className="rounded-full bg-ok/10 px-2 py-0.5 text-ok">{HE.catalog.amountApproved}</span>
      <span className="mx-1.5">·</span>
      <span className="rounded-full bg-gold/20 px-2 py-0.5 text-ink">{HE.catalog.amountEstimate}</span>
      <span className="mx-1.5">·</span>
      <span className="rounded-full bg-paper-deep px-2 py-0.5">{HE.catalog.amountUnpublished}</span>
    </p>
  );
}
