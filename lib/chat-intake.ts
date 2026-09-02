import { SCHOLARSHIPS } from "@/data/scholarships";
import { cityNeedsNeighborhood } from "./cities";
import { INSTITUTIONS } from "./institutions";
import { fieldLabelHe } from "./labels";
import { groupMatches, matchAll } from "./matcher";
import {
  CHAT_CORE_FIELDS,
  CHAT_EXTRA_FIELDS,
  MIN_CHAT_ANSWERS_FOR_REPORT,
  filledWizardFieldCount,
  isProfileFieldFilled,
} from "./profile-fields";
import type { DegreeLevel, HouseholdIncomeBand, ProfileField, ServiceType, StudentProfile } from "./types";
import {
  DEGREE_LEVELS,
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

function choice(id: string, labelHe: string, patch: StudentProfile): ChatChoice {
  return { id, labelHe, patch };
}

export const CHAT_QUESTIONS: ChatQuestion[] = [
  {
    id: "institution",
    field: "institution",
    promptHe: "באיזה מוסד אתם לומדים?",
    hintHe: "אפשר לחפש בשם, או לבחור מהרשימה.",
    kind: "search-institution",
    core: true,
  },
  {
    id: "degreeLevel",
    field: "degreeLevel",
    promptHe: "איזה תואר?",
    kind: "choices",
    core: true,
    choices: DEGREE_LEVELS.map((d) => choice(d, fieldLabelHe(d), { degreeLevel: d as DegreeLevel })),
  },
  {
    id: "cityOfResidence",
    field: "cityOfResidence",
    promptHe: "באיזו עיר אתם גרים עכשיו?",
    kind: "search-city",
    core: true,
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
    hintHe: "לא סכום מדויק. אם תדלגו — מלגות סיוע יופיעו תחת «חסר פרט».",
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

export function canOfferChatReport(profile: StudentProfile): boolean {
  return filledWizardFieldCount(profile) >= MIN_CHAT_ANSWERS_FOR_REPORT;
}

export function filterInstitutions(query: string) {
  const q = query.trim();
  if (!q) {
    const popular = CHAT_POPULAR_INSTITUTION_IDS.map((id) => INSTITUTIONS.find((i) => i.id === id)).filter(
      (i): i is NonNullable<typeof i> => Boolean(i),
    );
    return popular;
  }
  return INSTITUTIONS.filter((i) => i.nameHe.includes(q) || i.id.toLowerCase().includes(q.toLowerCase())).slice(
    0,
    12,
  );
}

export type ChatReportCounts = {
  eligible: number;
  needInfo: number;
  nearMiss: number;
  guide: number;
  ineligible: number;
  closedCycle: number;
};

export function chatReportCounts(
  profile: StudentProfile,
  asOf: Date = new Date(),
): ChatReportCounts {
  const grouped = groupMatches(matchAll(SCHOLARSHIPS, profile, { asOf }));
  return {
    eligible: grouped.eligible.length,
    needInfo: grouped.needInfo.length,
    nearMiss: grouped.nearMiss.length,
    guide: grouped.checkAtInstitution.length,
    ineligible: grouped.ineligible.length,
    closedCycle: grouped.closedCycle.length,
  };
}

export function chatFieldsCoverWizardKeys(): boolean {
  const keys = [...CHAT_CORE_FIELDS, ...CHAT_EXTRA_FIELDS];
  return keys.every((f) => CHAT_QUESTIONS.some((q) => q.field === f));
}
