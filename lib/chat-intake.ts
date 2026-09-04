import { CATALOG_STATS, SCHOLARSHIPS } from "@/data/scholarships";
import { uniqueMatchableByApplyUrl } from "./catalog";
import { CITY_SUGGESTIONS, cityNeedsNeighborhood } from "./cities";
import { INSTITUTIONS, type Institution } from "./institutions";
import { fieldLabelHe } from "./labels";
import { groupMatches, matchAll } from "./matcher";
import {
  CHAT_CORE_FIELDS,
  CHAT_EXTRA_FIELDS,
  MIN_CHAT_ANSWERS_FOR_REPORT,
  filledWizardFieldCount,
  isProfileFieldFilled,
} from "./profile-fields";
import { profileIsEmpty } from "./profile-storage";
import type { DegreeLevel, Gender, HouseholdIncomeBand, ProfileField, ServiceType, StudentProfile } from "./types";
import {
  DEGREE_LEVELS,
  GENDERS,
  HOUSEHOLD_INCOME_BANDS,
  SECTORS,
  SERVICE_TYPES,
} from "./types";

export type ChatQuestionKind = "choices" | "search-institution" | "search-city" | "multi";

export type ChatChoice = {
  id: string;
  labelHe: string;
  patch: StudentProfile;
};

export type ChatQuestion = {
  id: string;
  field: ProfileField;
  promptHe: string;
  hintHe?: string;
  kind: ChatQuestionKind;
  choices?: ChatChoice[];
  multiValues?: readonly string[];
  when?: (profile: StudentProfile, askedIds: readonly string[]) => boolean;
  /** On skip, also treat these question ids as asked so follow-ups do not loop. */
  skipAlsoIds?: readonly string[];
  core: boolean;
};

export const CHAT_POPULAR_INSTITUTION_IDS = [
  "tau",
  "huji",
  "technion",
  "bgu",
  "haifa",
  "biu",
  "openu",
  "ono",
] as const;

/** Large-city chips so the city question is tap-first, search-second. */
export const CHAT_POPULAR_CITIES = [
  "תל אביב-יפו",
  "ירושלים",
  "חיפה",
  "באר שבע",
  "רמת גן",
  "ראשון לציון",
  "פתח תקווה",
  "נתניה",
] as const;

function choice(id: string, labelHe: string, patch: StudentProfile): ChatChoice {
  return { id, labelHe, patch };
}

/**
 * Popular institution chips. An empty list is a catalog bug — fall back to the
 * first eight schools so the UI never shows a lone search box.
 */
export function popularInstitutions(): Institution[] {
  const found = CHAT_POPULAR_INSTITUTION_IDS.map((id) => INSTITUTIONS.find((i) => i.id === id)).filter(
    (i): i is Institution => Boolean(i),
  );
  if (found.length > 0) return found;
  return INSTITUTIONS.slice(0, 8);
}

export function popularCities(): string[] {
  const found = CHAT_POPULAR_CITIES.filter((c) => CITY_SUGGESTIONS.includes(c));
  if (found.length > 0) return [...found];
  return CITY_SUGGESTIONS.slice(0, 8);
}

export const CHAT_QUESTIONS: ChatQuestion[] = [
  {
    id: "degreeLevel",
    field: "degreeLevel",
    promptHe: "איזה תואר?",
    kind: "choices",
    core: true,
    choices: DEGREE_LEVELS.map((d) => choice(d, fieldLabelHe(d), { degreeLevel: d as DegreeLevel })),
  },
  {
    id: "miluim",
    field: "reservistDaysLastYear",
    promptHe: "עשיתם ימי מילואים בשנה האחרונה?",
    kind: "choices",
    core: true,
    skipAlsoIds: ["miluimDays"],
    choices: [
      choice("yes", "כן", { service: "idf" }),
      choice("no", "לא", { reservistDaysLastYear: 0 }),
    ],
  },
  {
    id: "miluimDays",
    field: "reservistDaysLastYear",
    promptHe: "בערך כמה ימי מילואים?",
    kind: "choices",
    core: true,
    when: (profile, askedIds) =>
      askedIds.includes("miluim") &&
      profile.service === "idf" &&
      !isProfileFieldFilled(profile, "reservistDaysLastYear"),
    choices: [
      choice("d5", "עד 9 ימים", { reservistDaysLastYear: 5 }),
      choice("d15", "10–20 ימים", { reservistDaysLastYear: 15 }),
      choice("d30", "21–49 ימים", { reservistDaysLastYear: 30 }),
      choice("d50", "50 ימים ומעלה", { reservistDaysLastYear: 50 }),
    ],
  },
  {
    id: "cityOfResidence",
    field: "cityOfResidence",
    promptHe: "באיזו עיר אתם גרים עכשיו?",
    hintHe: "בחרו עיר, או חפשו בשם.",
    kind: "search-city",
    core: true,
  },
  {
    id: "institution",
    field: "institution",
    promptHe: "באיזה מוסד אתם לומדים?",
    hintHe: "בחרו מוסד, או חפשו בשם.",
    kind: "search-institution",
    core: true,
  },
  {
    id: "gender",
    field: "gender",
    promptHe: "מגדר? יש מלגות שנפתחות רק לנשים או לפי מגדר.",
    hintHe: "שאלה אחת, אפשר לדלג.",
    kind: "choices",
    core: true,
    choices: GENDERS.map((g) =>
      choice(g, g === "other" ? "אחר / לא בינארי" : fieldLabelHe(g), { gender: g as Gender }),
    ),
  },
  {
    id: "householdSize",
    field: "householdSize",
    promptHe: "כמה נפשות במשק הבית?",
    hintHe: "לסיוע כלכלי. אפשר לדלג.",
    kind: "choices",
    core: true,
    choices: [1, 2, 3, 4, 5, 6].map((n) =>
      choice(String(n), n === 6 ? "6 ומעלה" : String(n), { householdSize: n === 6 ? 6 : n }),
    ),
  },
  {
    id: "householdIncomeBand",
    field: "householdIncomeBand",
    promptHe: "מה סדר הגודל של הכנסת משק הבית לחודש?",
    hintHe: "לא סכום מדויק. אם תדלגו — מלגות סיוע יופיעו כמשהו שאפשר לפתוח בעוד שאלה.",
    kind: "choices",
    core: true,
    choices: HOUSEHOLD_INCOME_BANDS.map((b) =>
      choice(b, fieldLabelHe(b), { householdIncomeBand: b as HouseholdIncomeBand, incomeBand: null }),
    ),
  },
  {
    id: "yearOfStudy",
    field: "yearOfStudy",
    promptHe: "שנת לימוד?",
    kind: "choices",
    core: false,
    choices: [1, 2, 3, 4, 5].map((y) =>
      choice(String(y), y === 5 ? "שנה 5 ומעלה" : `שנה ${y}`, { yearOfStudy: y }),
    ),
  },
  {
    id: "service",
    field: "service",
    promptHe: "איזה שירות עשיתם?",
    kind: "choices",
    core: false,
    when: (profile) => !isProfileFieldFilled(profile, "service"),
    choices: SERVICE_TYPES.map((s) => choice(s, fieldLabelHe(s), { service: s as ServiceType })),
  },
  {
    id: "willingToVolunteer",
    field: "willingToVolunteer",
    promptHe: "פתוחים להתנדבות כחלק ממלגה?",
    kind: "choices",
    core: false,
    choices: [
      choice("yes", "כן", { willingToVolunteer: true }),
      choice("no", "לא", { willingToVolunteer: false }),
    ],
  },
  {
    id: "sectors",
    field: "sectors",
    promptHe: "שיוך קהילתי? רק כי יש מלגות ייעודיות — אפשר לדלג.",
    kind: "multi",
    core: false,
    multiValues: SECTORS,
  },
  {
    id: "isOleh",
    field: "isOleh",
    promptHe: "עולה חדש/ה או בעל/ת סטטוס עולה?",
    kind: "choices",
    core: false,
    choices: [
      choice("yes", "כן", { isOleh: true }),
      choice("no", "לא", { isOleh: false }),
    ],
  },
];

export function chatQuestionById(id: string): ChatQuestion | undefined {
  return CHAT_QUESTIONS.find((q) => q.id === id);
}

export function nextChatQuestion(
  profile: StudentProfile,
  askedIds: readonly string[],
): ChatQuestion | undefined {
  return CHAT_QUESTIONS.find((q) => {
    if (askedIds.includes(q.id)) return false;
    if (q.when && !q.when(profile, askedIds)) return false;
    if (!q.when && isProfileFieldFilled(profile, q.field)) return false;
    return true;
  });
}

export function applyChatChoice(profile: StudentProfile, choice: ChatChoice): StudentProfile {
  return { ...profile, ...choice.patch };
}

export function skipChatQuestion(profile: StudentProfile, question: ChatQuestion): StudentProfile {
  return { ...profile, [question.field]: null };
}

export function askedIdsAfterSkip(askedIds: readonly string[], question: ChatQuestion): string[] {
  const extra = question.skipAlsoIds ?? [];
  return [...new Set([...askedIds, question.id, ...extra])];
}

export function askedIdsAfterAnswer(askedIds: readonly string[], question: ChatQuestion): string[] {
  return [...new Set([...askedIds, question.id])];
}

export function applyInstitutionAnswer(profile: StudentProfile, institutionId: string): StudentProfile {
  return { ...profile, institution: institutionId };
}

export function applyCityAnswer(profile: StudentProfile, city: string | null): StudentProfile {
  return {
    ...profile,
    cityOfResidence: city,
    neighborhood: city && cityNeedsNeighborhood(city) ? profile.neighborhood : null,
  };
}

export function applyMultiAnswer(
  profile: StudentProfile,
  question: ChatQuestion,
  values: string[],
): StudentProfile {
  const next = values.length ? values : null;
  return { ...profile, [question.field]: next };
}

export function canOfferChatReport(
  profile: StudentProfile,
  askedIds: readonly string[] = [],
): boolean {
  if (filledWizardFieldCount(profile) < MIN_CHAT_ANSWERS_FOR_REPORT) return false;
  return askedIds.includes("institution") || isProfileFieldFilled(profile, "institution");
}

/** Shared session state for the web chat and the WhatsApp webhook. */
export type ChatSessionState = {
  profile: StudentProfile;
  askedIds: string[];
};

export type ChatAction =
  | { type: "choice"; question: ChatQuestion; choice: ChatChoice }
  | { type: "skip"; question: ChatQuestion }
  | { type: "institution"; question: ChatQuestion; institutionId: string }
  | { type: "city"; question: ChatQuestion; city: string | null }
  | { type: "multi"; question: ChatQuestion; values: string[] }
  | { type: "reset" };

export function emptyChatState(): ChatSessionState {
  return { profile: {}, askedIds: [] };
}

/**
 * One mutation of the intake machine. ChatIntake and the WhatsApp webhook
 * must both go through this so question order and field mapping cannot drift.
 */
export function applyChatAction(state: ChatSessionState, action: ChatAction): ChatSessionState {
  switch (action.type) {
    case "reset":
      return emptyChatState();
    case "choice":
      return {
        profile: applyChatChoice(state.profile, action.choice),
        askedIds: askedIdsAfterAnswer(state.askedIds, action.question),
      };
    case "skip":
      return {
        profile: skipChatQuestion(state.profile, action.question),
        askedIds: askedIdsAfterSkip(state.askedIds, action.question),
      };
    case "institution":
      return {
        profile: applyInstitutionAnswer(state.profile, action.institutionId),
        askedIds: askedIdsAfterAnswer(state.askedIds, action.question),
      };
    case "city":
      return {
        profile: applyCityAnswer(state.profile, action.city),
        askedIds: askedIdsAfterAnswer(state.askedIds, action.question),
      };
    case "multi":
      return {
        profile: applyMultiAnswer(state.profile, action.question, action.values),
        askedIds: askedIdsAfterAnswer(state.askedIds, action.question),
      };
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

export function filterInstitutions(query: string) {
  const q = query.trim();
  if (!q) return popularInstitutions();
  return INSTITUTIONS.filter((i) => i.nameHe.includes(q) || i.id.toLowerCase().includes(q.toLowerCase())).slice(
    0,
    12,
  );
}

/** Never throws — chat first paint must not depend on storage succeeding. */
export function safeLoadChatProfile(load: () => StudentProfile): StudentProfile {
  try {
    return load() ?? {};
  } catch {
    return {};
  }
}

export type ChatReportCounts = {
  eligible: number;
  needInfo: number;
  nearMiss: number;
  guide: number;
  ineligible: number;
  closedCycle: number;
  catalogTotal: number;
};

export function chatReportCounts(
  profile: StudentProfile,
  asOf: Date = new Date(),
): ChatReportCounts {
  const unique = uniqueMatchableByApplyUrl(SCHOLARSHIPS);
  const catalogTotal = unique.length;
  const grouped = groupMatches(matchAll(unique, profile, { asOf }));
  const cap = (n: number) => Math.min(n, catalogTotal);
  return {
    eligible: cap(grouped.eligible.length),
    needInfo: cap(grouped.needInfo.length),
    nearMiss: cap(grouped.nearMiss.length),
    guide: 0,
    ineligible: cap(grouped.ineligible.length),
    closedCycle: cap(grouped.closedCycle.length),
    catalogTotal,
  };
}

export function chatCountWithinCatalog(counts: ChatReportCounts): boolean {
  const buckets = [
    counts.eligible,
    counts.needInfo,
    counts.nearMiss,
    counts.guide,
    counts.ineligible,
    counts.closedCycle,
  ];
  return (
    counts.catalogTotal === CATALOG_STATS.total &&
    buckets.every((n) => n <= counts.catalogTotal) &&
    buckets.reduce((a, b) => a + b, 0) <= counts.catalogTotal
  );
}

export type ChatScrollTrigger = "messages" | "multi-toggle" | "question-change" | "report-open";

/** Auto-scroll shifts tap targets on mobile. Only the report panel may scroll. */
export function shouldScrollChat(trigger: ChatScrollTrigger): boolean {
  return trigger === "report-open";
}

/** Keep in-session answers if the student tapped before storage hydrated. */
export function mergeSessionAndStoredProfile(
  session: StudentProfile,
  stored: StudentProfile,
): StudentProfile {
  if (!profileIsEmpty(session)) return session;
  return stored;
}

export function chatFieldsCoverWizardKeys(): boolean {
  const keys = [...CHAT_CORE_FIELDS, ...CHAT_EXTRA_FIELDS];
  return keys.every((f) => CHAT_QUESTIONS.some((q) => q.field === f));
}
