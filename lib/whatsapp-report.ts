import { SCHOLARSHIPS } from "@/data/scholarships";
import { requiresVolunteering } from "./card-chips";
import { chatReportCounts, type ChatReportCounts } from "./chat-intake";
import { amountDisplay, formatHebrewLongDate, formatIls } from "./format";
import { HE } from "./i18n/he";
import { formatProfileValueHe, profileFieldLabel } from "./labels";
import { groupMatches, matchAll } from "./matcher";
import { sharedResultsUrl } from "./profile-share";
import { absoluteUrl } from "./site";
import type {
  Amount,
  CriterionResult,
  Deadline,
  ProfileField,
  Scholarship,
  ScholarshipMatch,
  StudentProfile,
} from "./types";

export const WHATSAPP_CHAT_URL = absoluteUrl("/chat/");
export const WHATSAPP_RESULTS_URL = absoluteUrl("/results/");
export const WHATSAPP_TOP_MATCH_LIMIT = 4;
/** Twilio WhatsApp rejects a single concatenated body over 1600 (error 21617). */
export const WHATSAPP_MESSAGE_MAX_CHARS = 1500;
/** Per outbound WhatsApp message — not a total-report cap. */
export const WHATSAPP_REPORT_MAX_CHARS = WHATSAPP_MESSAGE_MAX_CHARS;

export const ELIGIBLE_EXAMPLE_LIMIT = 4;
export const NEED_INFO_EXAMPLE_LIMIT = 3;
export const NEAR_MISS_EXAMPLE_LIMIT = 3;
export const INSTITUTION_EXAMPLE_LIMIT = 2;
export const CLOSED_EXAMPLE_LIMIT = 2;

/**
 * Failures the student could still change this cycle.
 * Mirrors matcher mutable predicates — identity / year / city / service stay out.
 */
export const MUTABLE_NEAR_MISS_FIELDS = new Set<ProfileField>([
  "average",
  "studyLoad",
  "weeklyHours",
  "employmentHours",
  "volunteerHoursPerYear",
  "hasPerach",
  "willingToVolunteer",
  "outstanding",
  "householdSize",
  "householdIncomeBand",
  "incomeBand",
  "socialBenefits",
]);

const WHY_FIELD_PRIORITY: ProfileField[] = [
  "willingToVolunteer",
  "volunteerHoursPerYear",
  "hasPerach",
  "degreeLevel",
  "fieldOfStudy",
  "average",
  "institution",
  "studyLoad",
  "yearOfStudy",
  "service",
];

const NEAR_MISS_REASON_PRIORITY: ProfileField[] = [
  "willingToVolunteer",
  "volunteerHoursPerYear",
  "hasPerach",
  "average",
  "studyLoad",
  "weeklyHours",
  "employmentHours",
  "outstanding",
  "householdIncomeBand",
  "incomeBand",
  "householdSize",
  "socialBenefits",
];

export type WhatsAppReportMatch = {
  id: string;
  nameHe: string;
  amountHe?: string;
  deadlineHe?: string;
  bucket: ScholarshipMatch["bucket"];
};

export type WhatsAppReport = {
  /** All chunks joined — for assertions. Not sent as one Twilio body. */
  text: string;
  /** Sequential WhatsApp bodies, each under {@link WHATSAPP_MESSAGE_MAX_CHARS}. */
  messages: string[];
  counts: ChatReportCounts;
  top: WhatsAppReportMatch[];
  profile: StudentProfile;
  resultsUrl: string;
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

/** Published numeric headline («עד 10,000 ₪») when the catalog has a number. */
export function publishedAmountHe(amount: Amount | undefined): string | undefined {
  if (!compactAmountHe(amount)) return undefined;
  return amountDisplay(amount as Amount).headlineHe;
}

/** Dated catalog `deadline.date` only. */
export function compactDeadlineHe(deadline: Deadline | undefined): string | undefined {
  if (!deadline?.date) return undefined;
  return deadline.date;
}

/** Student-facing date from a real `deadline.date`. */
export function formatCatalogDeadlineHe(deadline: Deadline | undefined): string | undefined {
  const iso = compactDeadlineHe(deadline);
  if (!iso) return undefined;
  return formatHebrewLongDate(iso);
}

export function volunteerTagHe(scholarship: Scholarship): string {
  return requiresVolunteering(scholarship) ? HE.whatsapp.volunteerRequired : HE.whatsapp.volunteerNotRequired;
}

export function reportResultsUrl(profile: StudentProfile): string {
  const url = sharedResultsUrl(profile);
  return url || WHATSAPP_RESULTS_URL;
}

function leafPassed(match: ScholarshipMatch): CriterionResult[] {
  return match.passed.filter((c) => !c.group && c.status === "pass");
}

function leafFailed(match: ScholarshipMatch): CriterionResult[] {
  return match.failed.filter((c) => !c.group && c.status === "fail");
}

function leafUnknown(match: ScholarshipMatch): CriterionResult[] {
  return match.unknown.filter((c) => !c.group && c.status === "unknown");
}

function pickPreferred(
  rows: CriterionResult[],
  priority: readonly ProfileField[],
): CriterionResult | undefined {
  for (const field of priority) {
    const hit = rows.find((c) => c.field === field);
    if (hit) return hit;
  }
  return rows.find((c) => !!c.field);
}

function naturalPassedWhy(field: ProfileField, profile: StudentProfile): string | undefined {
  const valueHe = formatProfileValueHe(field, profile[field]);
  switch (field) {
    case "willingToVolunteer":
      return profile.willingToVolunteer === true ? "סימנתם שנוח לכם להתנדב" : undefined;
    case "hasPerach":
      return profile.hasPerach === true ? "סימנתם השתתפות בפר״ח" : undefined;
    case "volunteerHoursPerYear":
      return "סימנתם שעות התנדבות";
    case "degreeLevel":
      return valueHe && valueHe !== "דולג / לא צוין" ? `סימנתם ${valueHe}` : undefined;
    case "fieldOfStudy":
      return valueHe && valueHe !== "דולג / לא צוין" ? `סימנתם ${valueHe}` : undefined;
    case "institution":
      return valueHe && valueHe !== "דולג / לא צוין" ? `סימנתם ${valueHe}` : undefined;
    case "average":
      return "הממוצע שמילאתם עומד בסף";
    case "studyLoad":
      return "היקף הלימודים שמילאתם מתאים";
    case "yearOfStudy":
      return valueHe && valueHe !== "דולג / לא צוין" ? `סימנתם ${valueHe}` : undefined;
    case "service":
      return valueHe && valueHe !== "דולג / לא צוין" ? `לפי ${valueHe}` : undefined;
    default:
      return undefined;
  }
}

/** One short «למה» from a passed structured criterion. Never invent. */
export function eligibleWhyHe(match: ScholarshipMatch, profile: StudentProfile): string {
  const picked = pickPreferred(leafPassed(match), WHY_FIELD_PRIORITY);
  if (!picked?.field) return HE.whatsapp.eligibleWhyFallback;
  return naturalPassedWhy(picked.field, profile) ?? HE.whatsapp.eligibleWhyFallback;
}

export function needInfoMissingHe(match: ScholarshipMatch): string {
  const named = leafUnknown(match).find((c) => !!c.field);
  if (!named?.field) return HE.whatsapp.needInfoMissingFallback;
  return `חסר ${profileFieldLabel(named.field)}`;
}

/**
 * True only when every failed leaf is a mutable, changeable criterion.
 * Immutable failures in a nearMiss row are dropped (matcher should not emit them).
 */
export function isMutableNearMiss(match: ScholarshipMatch): boolean {
  if (match.bucket !== "nearMiss") return false;
  if (match.eval.immutableFailCount > 0) return false;
  const failed = leafFailed(match);
  if (failed.length === 0) return false;
  return failed.every((c) => !!c.field && MUTABLE_NEAR_MISS_FIELDS.has(c.field));
}

function naturalMutableFailHe(criterion: CriterionResult): string {
  const field = criterion.field;
  if (field === "average") {
    return criterion.labelHe.length <= 40 ? criterion.labelHe : "הממוצע שמילאתם נמוך מהסף";
  }
  if (field === "willingToVolunteer") return "דורשת נכונות להתנדב";
  if (field === "volunteerHoursPerYear") return "דורשת שעות התנדבות";
  if (field === "hasPerach") return "דורשת השתתפות בפר״ח";
  if (field === "studyLoad") return "דורשת היקף לימודים מלא";
  if (field === "weeklyHours") return "דורשת היקף שעות לימוד";
  if (field === "employmentHours") return "יש מגבלה על שעות עבודה";
  if (field === "outstanding") return "דורשת פעילות בולטת";
  if (field === "householdIncomeBand" || field === "incomeBand" || field === "householdSize") {
    return "תלוי במצב הכלכלי שמילאתם";
  }
  if (field === "socialBenefits") return "תלוי בגמלאות שמילאתם";
  if (field) return `אפשר לבדוק את ${profileFieldLabel(field)}`;
  return HE.whatsapp.needInfoMissingFallback;
}

export function nearMissReasonHe(match: ScholarshipMatch): string | undefined {
  if (!isMutableNearMiss(match)) return undefined;
  const picked = pickPreferred(leafFailed(match), NEAR_MISS_REASON_PRIORITY);
  if (!picked) return undefined;
  return naturalMutableFailHe(picked);
}

function boldHe(text: string): string {
  return `*${text}*`;
}

function sectionHeading(emoji: string, title: string, count: number): string {
  return `${emoji} ${boldHe(`${title} — ${count}`)}`;
}

function compactMatchLine(match: ScholarshipMatch): WhatsAppReportMatch {
  return {
    id: match.scholarship.id,
    nameHe: match.scholarship.nameHe,
    amountHe: publishedAmountHe(match.scholarship.amounts) ?? compactAmountHe(match.scholarship.amounts),
    deadlineHe: formatCatalogDeadlineHe(match.scholarship.deadline),
    bucket: match.bucket,
  };
}

export function formatEligibleBlock(
  match: ScholarshipMatch,
  profile: StudentProfile,
  index: number,
): string {
  const name = match.scholarship.nameHe;
  const bits: string[] = [];
  const amountHe = publishedAmountHe(match.scholarship.amounts);
  if (amountHe) bits.push(amountHe);
  bits.push(volunteerTagHe(match.scholarship));
  const lines = [`${index}. ${boldHe(name)}`, bits.join(" · ")];
  lines.push(`${HE.whatsapp.whyPrefix}: ${eligibleWhyHe(match, profile)}`);
  const deadlineHe = formatCatalogDeadlineHe(match.scholarship.deadline);
  if (deadlineHe) lines.push(`${HE.whatsapp.deadlinePrefix}: ${deadlineHe}`);
  return lines.join("\n");
}

export function formatNeedInfoExample(match: ScholarshipMatch): string {
  return `• ${boldHe(match.scholarship.nameHe)} — ${needInfoMissingHe(match)}`;
}

export function formatNearMissExample(match: ScholarshipMatch): string | undefined {
  const reason = nearMissReasonHe(match);
  if (!reason) return undefined;
  return `• ${boldHe(match.scholarship.nameHe)} — ${reason}`;
}

export function formatInstitutionExample(match: ScholarshipMatch): string {
  return `• ${boldHe(match.scholarship.nameHe)} — צריך לבדוק במוסד או ברשות`;
}

export function formatClosedExample(match: ScholarshipMatch): string | undefined {
  const deadlineHe = formatCatalogDeadlineHe(match.scholarship.deadline);
  if (!deadlineHe) return undefined;
  return `• ${boldHe(match.scholarship.nameHe)} — המועד ${deadlineHe} כבר עבר`;
}

function ineligibleClosingHe(count: number): string {
  return HE.whatsapp.ineligibleClosing.replace("{n}", String(count));
}

type ExampleLimits = {
  eligible: number;
  needInfo: number;
  nearMiss: number;
  checkAtInstitution: number;
  closedCycle: number;
};

const DEFAULT_LIMITS: ExampleLimits = {
  eligible: ELIGIBLE_EXAMPLE_LIMIT,
  needInfo: NEED_INFO_EXAMPLE_LIMIT,
  nearMiss: NEAR_MISS_EXAMPLE_LIMIT,
  checkAtInstitution: INSTITUTION_EXAMPLE_LIMIT,
  closedCycle: CLOSED_EXAMPLE_LIMIT,
};

type BuiltSections = {
  eligible: string[];
  needInfo: string[];
  nearMiss: string[];
  checkAtInstitution: string[];
  closedCycle: string[];
};

function take<T>(rows: T[], n: number): T[] {
  return n <= 0 ? [] : rows.slice(0, n);
}

function joinReportLines(lines: string[]): string {
  return lines.filter((l) => l !== undefined).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function fitChunkByDroppingExamples(head: string[], examples: string[], tail: string[] = []): string {
  const maxChars = WHATSAPP_MESSAGE_MAX_CHARS;
  for (let n = examples.length; n >= 0; n -= 1) {
    const text = joinReportLines([...head, ...examples.slice(0, n), ...tail]);
    if (text.length <= maxChars) return text;
  }
  return joinReportLines([...head, ...tail]);
}

function needInfoExampleLines(examples: string[]): string[] {
  if (examples.length === 1) return [`לדוגמה: ${examples[0]!.replace(/^• /, "")}`];
  return examples;
}

function renderEligibleChunk(args: {
  eligibleCount: number;
  sections: BuiltSections;
  limits: ExampleLimits;
}): string {
  const head = [HE.whatsapp.reportTitle, ""];
  if (args.eligibleCount <= 0) {
    head.push(HE.whatsapp.reportNoneEligible);
    return joinReportLines(head);
  }
  head.push(sectionHeading("✅", HE.whatsapp.eligibleNow, args.eligibleCount));
  head.push(HE.whatsapp.eligibleIntro);
  head.push("");
  return fitChunkByDroppingExamples(head, take(args.sections.eligible, args.limits.eligible));
}

function renderBucketChunk(args: {
  emoji: string;
  title: string;
  count: number;
  intro: string;
  examples: string[];
}): string | undefined {
  if (args.count <= 0) return undefined;
  const head = [sectionHeading(args.emoji, args.title, args.count), args.intro];
  return fitChunkByDroppingExamples(head, args.examples);
}

function renderFooterChunks(args: {
  resultsUrl: string;
  ineligibleCount: number;
  includeIneligibleNote: boolean;
}): string[] {
  const link = joinReportLines([`🔗 ${boldHe(HE.whatsapp.fullReportHeading)}`, args.resultsUrl]);
  const afterLines = [HE.whatsapp.disclaimer];
  if (args.ineligibleCount > 0 && args.includeIneligibleNote) {
    afterLines.push(ineligibleClosingHe(args.ineligibleCount));
  }
  afterLines.push("");
  afterLines.push(HE.whatsapp.continueAfterReport);
  const after = joinReportLines(afterLines);
  const combined = joinReportLines([link, "", after]);
  if (combined.length <= WHATSAPP_MESSAGE_MAX_CHARS) return [combined];
  return [link, after].filter((t) => t.length > 0);
}

/**
 * Counselor report as sequential WhatsApp bodies.
 * Natural splits: intro+✅, 🟡, 🟠, 🏫, 📅, then 🔗 URL + disclaimer.
 * Each chunk is strictly under {@link WHATSAPP_MESSAGE_MAX_CHARS}.
 */
export function splitWhatsAppReportMessages(args: {
  eligibleCount: number;
  needInfoCount: number;
  nearMissCount: number;
  institutionCount: number;
  closedCount: number;
  ineligibleCount: number;
  sections: BuiltSections;
  resultsUrl: string;
}): string[] {
  const limits = cloneLimits(DEFAULT_LIMITS);
  const chunks: string[] = [];

  chunks.push(renderEligibleChunk({ ...args, limits }));

  if (args.needInfoCount > 0) {
    const examples = needInfoExampleLines(take(args.sections.needInfo, limits.needInfo));
    const chunk = renderBucketChunk({
      emoji: "🟡",
      title: HE.whatsapp.needInfoOne,
      count: args.needInfoCount,
      intro: HE.whatsapp.needInfoIntro,
      examples,
    });
    if (chunk) chunks.push(chunk);
  }

  if (args.nearMissCount > 0) {
    const chunk = renderBucketChunk({
      emoji: "🟠",
      title: HE.buckets.nearMiss,
      count: args.nearMissCount,
      intro: HE.whatsapp.nearMissIntro,
      examples: take(args.sections.nearMiss, limits.nearMiss),
    });
    if (chunk) chunks.push(chunk);
  }

  if (args.institutionCount > 0) {
    const chunk = renderBucketChunk({
      emoji: "🏫",
      title: HE.whatsapp.checkInstitution,
      count: args.institutionCount,
      intro: HE.whatsapp.checkInstitutionIntro,
      examples: take(args.sections.checkAtInstitution, limits.checkAtInstitution),
    });
    if (chunk) chunks.push(chunk);
  }

  if (args.closedCount > 0) {
    const chunk = renderBucketChunk({
      emoji: "📅",
      title: HE.buckets.closedCycle,
      count: args.closedCount,
      intro: HE.whatsapp.closedCycleIntro,
      examples: take(args.sections.closedCycle, limits.closedCycle),
    });
    if (chunk) chunks.push(chunk);
  }

  chunks.push(
    ...renderFooterChunks({
      resultsUrl: args.resultsUrl,
      ineligibleCount: args.ineligibleCount,
      includeIneligibleNote: args.ineligibleCount > 0,
    }),
  );

  return chunks.filter((c) => c.length > 0);
}

function cloneLimits(limits: ExampleLimits): ExampleLimits {
  return { ...limits };
}

export type WhatsAppReportOptions = {
  asOf?: Date;
  /** Injected for tests — defaults to the site matcher + catalog. */
  matchAllFn?: typeof matchAll;
};

function prepareSections(
  grouped: ReturnType<typeof groupMatches>,
  profile: StudentProfile,
): BuiltSections {
  const eligible = grouped.eligible.map((m, i) => formatEligibleBlock(m, profile, i + 1));
  const namedNeedInfo = grouped.needInfo.filter((m) => leafUnknown(m).some((c) => !!c.field));
  const unnamedNeedInfo = grouped.needInfo.filter((m) => !leafUnknown(m).some((c) => !!c.field));
  const needInfo = [...namedNeedInfo, ...unnamedNeedInfo].map(formatNeedInfoExample);
  const nearMiss = grouped.nearMiss
    .filter(isMutableNearMiss)
    .map(formatNearMissExample)
    .filter((row): row is string => !!row);
  const checkAtInstitution = grouped.checkAtInstitution.map(formatInstitutionExample);
  const closedCycle = grouped.closedCycle
    .map(formatClosedExample)
    .filter((row): row is string => !!row);

  return { eligible, needInfo, nearMiss, checkAtInstitution, closedCycle };
}

/**
 * Counselor-style Hebrew WhatsApp summary.
 * Uses the same matchAll + groupMatches as the site. Does not invent matches.
 */
export function buildWhatsAppReport(
  profile: StudentProfile,
  options: WhatsAppReportOptions = {},
): WhatsAppReport {
  const asOf = options.asOf ?? new Date();
  const runMatchAll = options.matchAllFn ?? matchAll;
  const matches = runMatchAll(SCHOLARSHIPS, profile, { asOf });
  const grouped = groupMatches(matches);
  const counts = chatReportCounts(profile, asOf);
  const resultsUrl = reportResultsUrl(profile);
  const sections = prepareSections(grouped, profile);
  const top = grouped.eligible.slice(0, WHATSAPP_TOP_MATCH_LIMIT).map(compactMatchLine);

  const messages = splitWhatsAppReportMessages({
    eligibleCount: grouped.eligible.length,
    needInfoCount: grouped.needInfo.length,
    nearMissCount: grouped.nearMiss.length,
    institutionCount: grouped.checkAtInstitution.length,
    closedCount: grouped.closedCycle.length,
    ineligibleCount: grouped.ineligible.length,
    sections,
    resultsUrl,
  });
  const text = messages.join("\n\n");

  return { text, messages, counts, top, profile, resultsUrl };
}
