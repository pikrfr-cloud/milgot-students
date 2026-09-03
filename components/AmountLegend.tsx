import { HE } from "@/lib/i18n/he";

function LegendChip({
  id,
  label,
  tip,
  chipClassName,
}: {
  id: string;
  label: string;
  tip: string;
  chipClassName: string;
}) {
  const tipId = `${id}-tip`;
  return (
    <button
      type="button"
      className={`legend-chip ${chipClassName}`}
      aria-describedby={tipId}
    >
      {label}
      <span id={tipId} role="tooltip" className="legend-tooltip">
        {tip}
      </span>
    </button>
  );
}

export function AmountLegend({ className = "" }: { className?: string }) {
  return (
    <div className={`text-xs text-ink-soft ${className}`} aria-label={HE.catalog.amountLegend}>
      <LegendChip
        id="amount-legend-approved"
        label={HE.catalog.amountApproved}
        tip={HE.catalog.amountApprovedTip}
        chipClassName="rounded-full bg-ok/10 px-2 py-0.5 text-ok"
      />
      <span className="mx-1.5" aria-hidden="true">
        ·
      </span>
      <LegendChip
        id="amount-legend-estimate"
        label={HE.catalog.amountEstimate}
        tip={HE.catalog.amountEstimateTip}
        chipClassName="rounded-full bg-gold/20 px-2 py-0.5 text-ink"
      />
      <span className="mx-1.5" aria-hidden="true">
        ·
      </span>
      <LegendChip
        id="amount-legend-unpublished"
        label={HE.catalog.amountUnpublished}
        tip={HE.catalog.amountUnpublishedTip}
        chipClassName="rounded-full bg-paper-deep px-2 py-0.5"
      />
    </div>
  );
}
