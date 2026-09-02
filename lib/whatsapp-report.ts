import { SCHOLARSHIPS } from "@/data/scholarships";
import { chatReportCounts, type ChatReportCounts } from "./chat-intake";
import { formatIls } from "./format";
import { HE } from "./i18n/he";
import { groupMatches, matchAll } from "./matcher";
import { sharedResultsUrl } from "./profile-share";
import { absoluteUrl } from "./site";
import type { Amount, Deadline, ScholarshipMatch, StudentProfile } from "./types";

/** Full results page — the compact report links here with a shared profile hash. */
export const WHATSAPP_RESULTS_URL = absoluteUrl("/results/");
export const WHATSAPP_TOP_MATCH_LIMIT = 5;

export type WhatsAppReportMatch = {
  id: string;
  nameHe: string;
  amountHe?: string;
  deadlineHe?: string;
  bucket: ScholarshipMatch["bucket"];
};

export type WhatsAppReport = {
  text: string;
  counts: ChatReportCounts;
  top: WhatsAppReportMatch[];
  profile: StudentProfile;
};

/** Numeric ₪ from the catalog only — never invent a figure from prose. */
export function compactAmountHe(amount: Amount | undefined): string | undefined {
  if (!amount) return undefined;
  const min = amount.minIls;
  const max = amount.maxIls;
  const hasMin = typeof min === "number" && min > 0;
  const hasMax = typeof max === "number" && max > 0;
  if (hasMin && hasMax && min !== max) return `${formatIls(min)}–${formatIls(max)}`;
  if (hasMax) return formatIls(max as number);
  if (hasMin) return formatIls(min as number);
  return undefined;
}

/** Dated catalog fields only. Long window prose stays on the full site report. */
export function compactDeadlineHe(deadline: Deadline | undefined): string | undefined {
  if (!deadline) return undefined;
  if (deadline.date) return deadline.date;
  if (deadline.opensAt) return deadline.opensAt;
  return undefined;
}

function compactMatchLine(match: ScholarshipMatch): WhatsAppReportMatch {
  return {
    id: match.scholarship.id,
    nameHe: match.scholarship.nameHe,
    amountHe: compactAmountHe(match.scholarship.amounts),
    deadlineHe: compactDeadlineHe(match.scholarship.deadline),
    bucket: match.bucket,
  };
}

function formatLine(item: WhatsAppReportMatch): string {
  const bits = [item.nameHe];
  if (item.amountHe) bits.push(item.amountHe);
  if (item.deadlineHe) bits.push(item.deadlineHe);
  return `• ${bits.join(" — ")}`;
}

function pickTopMatches(matches: ScholarshipMatch[]): ScholarshipMatch[] {
  const grouped = groupMatches(matches);
  const ranked = [...grouped.eligible, ...grouped.needInfo, ...grouped.nearMiss];
  return ranked.slice(0, WHATSAPP_TOP_MATCH_LIMIT);
}

export type WhatsAppReportOptions = {
  asOf?: Date;
  /** Injected for tests — defaults to the site matcher + catalog. */
  matchAllFn?: typeof matchAll;
};

/**
 * Compact Hebrew summary. Uses the same matchAll + catalog as the site.
 * Does not claim a fund decision — only catalog-threshold buckets.
 */
export function buildWhatsAppReport(
  profile: StudentProfile,
  options: WhatsAppReportOptions = {},
): WhatsAppReport {
  const asOf = options.asOf ?? new Date();
  const runMatchAll = options.matchAllFn ?? matchAll;
  const matches = runMatchAll(SCHOLARSHIPS, profile, { asOf });
  const counts = chatReportCounts(profile, asOf);
  const top = pickTopMatches(matches).map(compactMatchLine);

  const lines = [
    HE.whatsapp.reportTitle,
    "",
    `${HE.buckets.eligible}: ${counts.eligible}`,
    `${HE.buckets.needInfo}: ${counts.needInfo}`,
    `${HE.buckets.nearMiss}: ${counts.nearMiss}`,
    `${HE.buckets.guide}: ${counts.guide}`,
    `${HE.buckets.ineligible}: ${counts.ineligible}`,
  ];
  if (counts.closedCycle > 0) {
    lines.push(`${HE.buckets.closedCycle}: ${counts.closedCycle}`);
  }

  lines.push("");
  if (counts.eligible === 0) {
    lines.push(HE.whatsapp.reportNoneEligible);
  }
  if (top.length) {
    lines.push(HE.whatsapp.topMatches);
    for (const item of top) {
      lines.push(formatLine(item));
    }
  }

  lines.push("");
  lines.push(HE.chat.reportHint);
  lines.push("");
  lines.push(HE.whatsapp.fullReportLink);
  lines.push(sharedResultsUrl(profile));
  lines.push(HE.whatsapp.fullReportHint);
  lines.push("");
  lines.push(HE.whatsapp.disclaimer);
  lines.push(HE.whatsapp.continueAfterReport);

  return { text: lines.join("\n"), counts, top, profile };
}
