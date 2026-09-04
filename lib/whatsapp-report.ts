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
export const WHATSAPP_TOP_MATCH_LIMIT = 3;
/** Twilio WhatsApp rejects a single concatenated body over 1600 (error 21617). */
export const WHATSAPP_MESSAGE_MAX_CHARS = 1500;
/** Per outbound WhatsApp message — not a total-report cap. */
export const WHATSAPP_REPORT_MAX_CHARS = WHATSAPP_MESSAGE_MAX_CHARS;
/**
 * Default end-of-flow is 2 messages (summary + URL). A later «פרטים» / «כמעט»
 * may add one extra. Never more than 3 TwiML nouns in one reply.
 */
export const WHATSAPP_MAX_OUTBOUND_MESSAGES = 3;
/** If Twilio concatenates every `<Message>` body, stay under error 21617. */
export const WHATSAPP_COMBINED_BODY_MAX = 1500;

export const ELIGIBLE_EXAMPLE_LIMIT = 3;
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
    case "histadrutMember":
      return profile.histadrutMember === true ? "סימנתם חברות בנעמת / בהסתדרות" : undefined;
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

const VOLUNTEER_NEAR_MISS_FIELDS = new Set<ProfileField>([
  "willingToVolunteer",
  "volunteerHoursPerYear",
  "hasPerach",
]);

/**
 * Near-miss whose only failures are volunteering, and the student already said no.
 * Count these as «לא מתאים» in the short WhatsApp summary — not as «כמעט».
 */
export function isVolunteerRefusalNearMiss(
  match: ScholarshipMatch,
  profile: StudentProfile,
): boolean {
  if (profile.willingToVolunteer !== false) return false;
  if (!isMutableNearMiss(match)) return false;
  const failed = leafFailed(match);
  if (failed.length === 0) return false;
  return failed.every((c) => !!c.field && VOLUNTEER_NEAR_MISS_FIELDS.has(c.field));
}

export function nearMissReasonHe(
  match: ScholarshipMatch,
  profile?: StudentProfile,
): string | undefined {
  if (profile && isVolunteerRefusalNearMiss(match, profile)) {
    return HE.whatsapp.volunteerNotFit;
  }
  if (!isMutableNearMiss(match)) return undefined;
  const picked = pickPreferred(leafFailed(match), NEAR_MISS_REASON_PRIORITY);
  if (!picked) return undefined;
  return naturalMutableFailHe(picked);
}

export type CounselorBucketCounts = {
  eligible: number;
  needInfo: number;
  nearMiss: number;
  ineligible: number;
  volunteerRefusal: number;
};

/** Short-summary counts: volunteer-only refusals move from כמעט → לא מתאים. */
export function counselorBucketCounts(
  grouped: ReturnType<typeof groupMatches>,
  profile: StudentProfile,
): CounselorBucketCounts {
  const volunteerRefusal = grouped.nearMiss.filter((m) =>
    isVolunteerRefusalNearMiss(m, profile),
  ).length;
  return {
    eligible: grouped.eligible.length,
    needInfo: grouped.needInfo.length,
    nearMiss: Math.max(0, grouped.nearMiss.length - volunteerRefusal),
    ineligible: grouped.ineligible.length + volunteerRefusal,
    volunteerRefusal,
  };
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

export function formatNearMissExample(
  match: ScholarshipMatch,
  profile?: StudentProfile,
): string | undefined {
  if (profile && isVolunteerRefusalNearMiss(match, profile)) return undefined;
  const reason = nearMissReasonHe(match, profile);
  if (!reason) return undefined;
  return `• ${boldHe(match.scholarship.nameHe)} — ${reason}`;
}

export function formatCounselorEligibleLine(match: ScholarshipMatch, index: number): string {
  const bits: string[] = [];
  const amountHe = publishedAmountHe(match.scholarship.amounts) ?? compactAmountHe(match.scholarship.amounts);
  if (amountHe) bits.push(amountHe);
  const deadlineHe = formatCatalogDeadlineHe(match.scholarship.deadline);
  if (deadlineHe) bits.push(deadlineHe);
  const suffix = bits.length ? ` — ${bits.join(" · ")}` : "";
  return `${index}. ${boldHe(match.scholarship.nameHe)}${suffix}`;
}

export function formatBucketCountLine(counts: CounselorBucketCounts): string {
  return HE.whatsapp.bucketCountLine
    .replace("{need}", String(counts.needInfo))
    .replace("{near}", String(counts.nearMiss))
    .replace("{no}", String(counts.ineligible));
}

export function formatInstitutionExample(match: ScholarshipMatch): string {
  return `• ${boldHe(match.scholarship.nameHe)} — צריך לבדוק במוסד או ברשות`;
}

export function formatClosedExample(match: ScholarshipMatch): string | undefined {
  const deadlineHe = formatCatalogDeadlineHe(match.scholarship.deadline);
  if (!deadlineHe) return undefined;
  return `• ${boldHe(match.scholarship.nameHe)} — המועד ${deadlineHe} כבר עבר`;
}

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

function renderCounselorSummary(args: {
  eligibleCount: number;
  counts: CounselorBucketCounts;
  eligibleLines: string[];
}): string {
  const head = [HE.whatsapp.reportTitle, ""];
  if (args.eligibleCount <= 0) {
    head.push(HE.whatsapp.reportNoneEligible);
  } else {
    head.push(sectionHeading("✅", HE.whatsapp.eligibleNow, args.eligibleCount));
    head.push("");
  }
  const tail = [HE.whatsapp.notAwardLine, formatBucketCountLine(args.counts)];
  if (args.counts.volunteerRefusal > 0) {
    tail.push(HE.whatsapp.volunteerNotFit);
  }
  return fitChunkByDroppingExamples(head, args.eligibleLines, ["", ...tail]);
}

function renderUrlChunk(resultsUrl: string): string {
  return joinReportLines([
    `🔗 ${boldHe(HE.whatsapp.fullReportHeading)}`,
    resultsUrl,
    "",
    HE.whatsapp.continueAfterReport,
  ]);
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

type ReportChunkKind = "eligible" | "needInfo" | "nearMiss" | "footer";

type TaggedChunk = { kind: ReportChunkKind; text: string };

export function reportHasEligibleOrNeedInfoLead(messages: string[]): boolean {
  return messages.some(
    (m) =>
      m.includes(HE.whatsapp.eligibleNow) ||
      m.includes(HE.whatsapp.reportTitle) ||
      m.includes(HE.whatsapp.reportNoneEligible) ||
      m.includes(HE.whatsapp.needInfoOne) ||
      m.includes(HE.whatsapp.notAwardLine),
  );
}

export function reportIsUrlOnly(messages: string[], resultsUrl: string): boolean {
  if (messages.length === 0) return false;
  const hasUrl = messages.some((m) => m.includes(resultsUrl) || m.includes("🔗"));
  return hasUrl && !reportHasEligibleOrNeedInfoLead(messages);
}

/**
 * Prefer 2 bodies (summary + URL). Never collapse to the results link alone.
 * Combined length is capped in {@link capWhatsAppOutboundBodies}.
 */
export function finalizeWhatsAppReportMessages(args: {
  chunks: TaggedChunk[];
  resultsUrl: string;
}): string[] {
  const texts = args.chunks.map((c) => c.text).filter((t) => t.length > 0);
  if (texts.length === 0) {
    return capWhatsAppOutboundBodies([
      joinReportLines([HE.whatsapp.reportTitle, "", HE.whatsapp.reportNoneEligible]),
      renderUrlChunk(args.resultsUrl),
    ]);
  }
  if (reportIsUrlOnly(texts, args.resultsUrl)) {
    return capWhatsAppOutboundBodies([
      joinReportLines([HE.whatsapp.reportTitle, "", HE.whatsapp.reportNoneEligible]),
      ...texts,
    ]);
  }
  return capWhatsAppOutboundBodies(texts);
}

/** Drop trailing bodies until at most 3, then shrink so concatenated bodies stay ≤ 1500. */
export function capWhatsAppOutboundBodies(texts: string[]): string[] {
  let kept = texts.filter((t) => t.trim().length > 0).slice(0, WHATSAPP_MAX_OUTBOUND_MESSAGES);
  kept = kept.map((t) => (t.length < WHATSAPP_MESSAGE_MAX_CHARS ? t : t.slice(0, WHATSAPP_MESSAGE_MAX_CHARS - 1)));
  const combined = () => kept.reduce((n, t) => n + t.length, 0);
  while (kept.length > 2 && combined() > WHATSAPP_COMBINED_BODY_MAX) {
    kept = [kept[0]!, kept[kept.length - 1]!];
  }
  if (kept.length === 2 && combined() > WHATSAPP_COMBINED_BODY_MAX) {
    const url = kept[1]!;
    const budget = WHATSAPP_COMBINED_BODY_MAX - url.length;
    kept[0] = kept[0]!.slice(0, Math.max(0, budget));
  }
  if (kept.length === 1 && kept[0]!.length > WHATSAPP_COMBINED_BODY_MAX) {
    kept[0] = kept[0]!.slice(0, WHATSAPP_COMBINED_BODY_MAX);
  }
  return kept.filter((t) => t.length > 0);
}

/**
 * Default WhatsApp end-of-flow: counselor summary + URL. No bucket dump.
 */
export function splitWhatsAppReportMessages(args: {
  eligibleCount: number;
  counts: CounselorBucketCounts;
  eligibleLines: string[];
  resultsUrl: string;
}): string[] {
  return finalizeWhatsAppReportMessages({
    chunks: [
      {
        kind: "eligible",
        text: renderCounselorSummary({
          eligibleCount: args.eligibleCount,
          counts: args.counts,
          eligibleLines: take(args.eligibleLines, ELIGIBLE_EXAMPLE_LIMIT),
        }),
      },
      { kind: "footer", text: renderUrlChunk(args.resultsUrl) },
    ],
    resultsUrl: args.resultsUrl,
  });
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
  const eligible = grouped.eligible.map((m, i) => formatCounselorEligibleLine(m, i + 1));
  const namedNeedInfo = grouped.needInfo.filter((m) => leafUnknown(m).some((c) => !!c.field));
  const unnamedNeedInfo = grouped.needInfo.filter((m) => !leafUnknown(m).some((c) => !!c.field));
  const needInfo = [...namedNeedInfo, ...unnamedNeedInfo].map(formatNeedInfoExample);
  const nearMiss = grouped.nearMiss
    .filter((m) => isMutableNearMiss(m) && !isVolunteerRefusalNearMiss(m, profile))
    .map((m) => formatNearMissExample(m, profile))
    .filter((row): row is string => !!row);
  const checkAtInstitution = grouped.checkAtInstitution.map(formatInstitutionExample);
  const closedCycle = grouped.closedCycle
    .map(formatClosedExample)
    .filter((row): row is string => !!row);

  return { eligible, needInfo, nearMiss, checkAtInstitution, closedCycle };
}

export type WhatsAppBucketFollowup = {
  text: string;
  messages: string[];
};

/** One short extra message after «פרטים» or «כמעט». Not the default dump. */
export function buildWhatsAppBucketFollowup(
  profile: StudentProfile,
  kind: "needInfo" | "nearMiss",
  options: WhatsAppReportOptions = {},
): WhatsAppBucketFollowup {
  const asOf = options.asOf ?? new Date();
  const runMatchAll = options.matchAllFn ?? matchAll;
  const matches = runMatchAll(SCHOLARSHIPS, profile, { asOf });
  const grouped = groupMatches(matches);
  const sections = prepareSections(grouped, profile);
  const counselor = counselorBucketCounts(grouped, profile);
  const chunk =
    kind === "needInfo"
      ? renderBucketChunk({
          emoji: "🟡",
          title: HE.whatsapp.needInfoOne,
          count: counselor.needInfo,
          intro: HE.whatsapp.needInfoIntro,
          examples: needInfoExampleLines(take(sections.needInfo, NEED_INFO_EXAMPLE_LIMIT)),
        })
      : renderBucketChunk({
          emoji: "🟠",
          title: HE.buckets.nearMiss,
          count: counselor.nearMiss,
          intro: HE.whatsapp.nearMissIntro,
          examples: take(sections.nearMiss, NEAR_MISS_EXAMPLE_LIMIT),
        });
  const text =
    chunk ??
    (kind === "needInfo"
      ? "אין עכשיו מלגות בחסר פרט לפי מה שמילאתם."
      : "אין עכשיו מלגות כמעט-מתאימות לפי מה שמילאתם.");
  const messages = capWhatsAppOutboundBodies([text]);
  return { text: messages.join("\n\n"), messages };
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
  const counselor = counselorBucketCounts(grouped, profile);
  const top = grouped.eligible.slice(0, WHATSAPP_TOP_MATCH_LIMIT).map(compactMatchLine);

  const messages = splitWhatsAppReportMessages({
    eligibleCount: counselor.eligible,
    counts: counselor,
    eligibleLines: sections.eligible,
    resultsUrl,
  });
  const text = messages.join("\n\n");

  return { text, messages, counts, top, profile, resultsUrl };
}
