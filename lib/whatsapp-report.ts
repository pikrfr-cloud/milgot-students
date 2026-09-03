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
export const WHATSAPP_REPORT_MAX_CHARS = 3500;

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
  text: string;
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

function renderReportText(args: {
  eligibleCount: number;
  needInfoCount: number;
  nearMissCount: number;
  institutionCount: number;
  closedCount: number;
  ineligibleCount: number;
  sections: BuiltSections;
  limits: ExampleLimits;
  include: {
    needInfo: boolean;
    nearMiss: boolean;
    checkAtInstitution: boolean;
    closedCycle: boolean;
    ineligibleNote: boolean;
  };
  resultsUrl: string;
}): string {
  const lines: string[] = [HE.whatsapp.reportTitle, ""];

  if (args.eligibleCount > 0) {
    lines.push(sectionHeading("✅", HE.whatsapp.eligibleNow, args.eligibleCount));
    lines.push(HE.whatsapp.eligibleIntro);
    lines.push("");
    for (const block of take(args.sections.eligible, args.limits.eligible)) {
      lines.push(block);
      lines.push("");
    }
  }

  if (args.needInfoCount > 0 && args.include.needInfo) {
    lines.push(sectionHeading("🟡", HE.whatsapp.needInfoOne, args.needInfoCount));
    lines.push(HE.whatsapp.needInfoIntro);
    const examples = take(args.sections.needInfo, args.limits.needInfo);
    if (examples.length === 1) {
      lines.push(`לדוגמה: ${examples[0]!.replace(/^• /, "")}`);
    } else {
      for (const ex of examples) lines.push(ex);
    }
    lines.push("");
  }

  if (args.nearMissCount > 0 && args.include.nearMiss) {
    lines.push(sectionHeading("🟠", HE.buckets.nearMiss, args.nearMissCount));
    lines.push(HE.whatsapp.nearMissIntro);
    for (const ex of take(args.sections.nearMiss, args.limits.nearMiss)) lines.push(ex);
    lines.push("");
  }

  if (args.institutionCount > 0 && args.include.checkAtInstitution) {
    lines.push(sectionHeading("🏫", HE.whatsapp.checkInstitution, args.institutionCount));
    lines.push(HE.whatsapp.checkInstitutionIntro);
    for (const ex of take(args.sections.checkAtInstitution, args.limits.checkAtInstitution)) {
      lines.push(ex);
    }
    lines.push("");
  }

  if (args.closedCount > 0 && args.include.closedCycle) {
    lines.push(sectionHeading("📅", HE.buckets.closedCycle, args.closedCount));
    lines.push(HE.whatsapp.closedCycleIntro);
    for (const ex of take(args.sections.closedCycle, args.limits.closedCycle)) lines.push(ex);
    lines.push("");
  }

  lines.push(`🔗 ${boldHe(HE.whatsapp.fullReportHeading)}`);
  lines.push(args.resultsUrl);
  lines.push("");
  lines.push(HE.whatsapp.disclaimer);
  if (args.ineligibleCount > 0 && args.include.ineligibleNote) {
    lines.push(ineligibleClosingHe(args.ineligibleCount));
  }
  lines.push("");
  lines.push(HE.whatsapp.continueAfterReport);

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function cloneLimits(limits: ExampleLimits): ExampleLimits {
  return { ...limits };
}

/**
 * Fit to WhatsApp/Twilio length by dropping lower-priority examples, then
 * whole optional sections. Never slices a scholarship name or the results URL.
 */
export function fitWhatsAppReportText(args: {
  eligibleCount: number;
  needInfoCount: number;
  nearMissCount: number;
  institutionCount: number;
  closedCount: number;
  ineligibleCount: number;
  sections: BuiltSections;
  resultsUrl: string;
  maxChars?: number;
}): string {
  const maxChars = args.maxChars ?? WHATSAPP_REPORT_MAX_CHARS;
  const limits = cloneLimits(DEFAULT_LIMITS);
  const include = {
    needInfo: args.needInfoCount > 0,
    nearMiss: args.nearMissCount > 0,
    checkAtInstitution: args.institutionCount > 0,
    closedCycle: args.closedCount > 0,
    ineligibleNote: args.ineligibleCount > 0,
  };

  const render = () =>
    renderReportText({
      ...args,
      limits,
      include,
    });

  const trimExampleOrder: (keyof ExampleLimits)[] = [
    "closedCycle",
    "checkAtInstitution",
    "nearMiss",
    "needInfo",
    "eligible",
  ];
  const dropSectionOrder: (keyof typeof include)[] = [
    "ineligibleNote",
    "closedCycle",
    "checkAtInstitution",
    "nearMiss",
    "needInfo",
  ];

  let text = render();
  while (text.length > maxChars) {
    const reducible = trimExampleOrder.find((key) => limits[key] > 0 && args.sections[key].length > 0);
    if (reducible) {
      limits[reducible] -= 1;
      text = render();
      continue;
    }
    const droppable = dropSectionOrder.find((key) => include[key]);
    if (droppable) {
      include[droppable] = false;
      text = render();
      continue;
    }
    break;
  }

  return text;
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
  const needInfo = grouped.needInfo.map(formatNeedInfoExample);
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

  const text = fitWhatsAppReportText({
    eligibleCount: grouped.eligible.length,
    needInfoCount: grouped.needInfo.length,
    nearMissCount: grouped.nearMiss.length,
    institutionCount: grouped.checkAtInstitution.length,
    closedCount: grouped.closedCycle.length,
    ineligibleCount: grouped.ineligible.length,
    sections,
    resultsUrl,
  });

  return { text, counts, top, profile, resultsUrl };
}
