import {
  applyChatAction,
  canOfferChatReport,
  emptyChatState,
  filterInstitutions,
  nextChatQuestion,
  popularCities,
  type ChatAction,
  type ChatQuestion,
  type ChatChoice,
  type ChatSessionState,
} from "./chat-intake";
import { CITY_SUGGESTIONS, citiesMatch, compactCityKey, normalizeCityName } from "./cities";
import { HE } from "./i18n/he";
import { INSTITUTIONS } from "./institutions";
import { fieldLabelHe } from "./labels";
import { filledWizardFieldCount } from "./profile-fields";
import type { StudentProfile } from "./types";

/** Twilio sandbox control words — do not reset or advance the questionnaire. */
const SANDBOX_IGNORE = /^(join(\s+\S+)?|stop|unstop)$/i;

const RESET_COMMANDS = new Set(["התחלה", "התחל", "התחל מחדש", "start", "reset"]);
const REPORT_COMMANDS = new Set([
  "דוח",
  "להראות דוח עכשיו",
  "להראות תוצאות",
  "הציגו לי מלגות",
  "report",
]);
const SKIP_COMMANDS = new Set(["דלג", "דילוג", "skip", "0"]);

export type NumberedOption = {
  n: number;
  labelHe: string;
  payload: string;
};

export type ParsedInbound =
  | { kind: "ignore" }
  | { kind: "reset" }
  | { kind: "report" }
  | { kind: "skip" }
  | { kind: "action"; action: ChatAction }
  | { kind: "relabel"; options: NumberedOption[]; promptHe: string }
  | { kind: "unparsed" };

export type InboundText = {
  body: string;
  buttonPayload?: string;
};

export function normalizeCommand(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function isSandboxKeyword(raw: string): boolean {
  return SANDBOX_IGNORE.test(normalizeCommand(raw));
}

export function isResetCommand(raw: string): boolean {
  const t = normalizeCommand(raw).toLowerCase();
  return RESET_COMMANDS.has(t) || RESET_COMMANDS.has(normalizeCommand(raw));
}

export function isReportCommand(raw: string): boolean {
  const t = normalizeCommand(raw);
  return REPORT_COMMANDS.has(t) || REPORT_COMMANDS.has(t.toLowerCase());
}

export function isSkipCommand(raw: string): boolean {
  const t = normalizeCommand(raw);
  return SKIP_COMMANDS.has(t) || SKIP_COMMANDS.has(t.toLowerCase());
}

export function questionOptions(question: ChatQuestion, searchQuery = ""): NumberedOption[] {
  if (question.kind === "choices" && question.choices) {
    return question.choices.map((c, i) => ({
      n: i + 1,
      labelHe: c.labelHe,
      payload: `choice:${c.id}`,
    }));
  }
  if (question.kind === "search-institution") {
    return filterInstitutions(searchQuery).map((inst, i) => ({
      n: i + 1,
      labelHe: inst.nameHe,
      payload: `institution:${inst.id}`,
    }));
  }
  if (question.kind === "search-city") {
    const list = filterCities(searchQuery);
    return list.map((city, i) => ({
      n: i + 1,
      labelHe: city,
      payload: `city:${city}`,
    }));
  }
  if (question.kind === "multi" && question.multiValues) {
    return question.multiValues.map((v, i) => ({
      n: i + 1,
      labelHe: fieldLabelHe(v),
      payload: `multi:${v}`,
    }));
  }
  return [];
}

export function filterCities(query: string): string[] {
  const q = query.trim();
  if (!q) return popularCities();
  const exact = CITY_SUGGESTIONS.find((c) => citiesMatch(c, q));
  if (exact) return [exact];
  const needle = compactCityKey(normalizeCityName(q));
  if (!needle) return CITY_SUGGESTIONS.slice(0, 8);
  return CITY_SUGGESTIONS.filter((c) => compactCityKey(c).includes(needle) || c.includes(q)).slice(
    0,
    12,
  );
}

export function formatQuestionMessage(question: ChatQuestion, options?: NumberedOption[]): string {
  const opts = options ?? questionOptions(question);
  const lines = [question.promptHe];
  if (question.hintHe && question.kind !== "search-institution") {
    lines.push(question.hintHe);
  }
  if (question.kind === "search-institution") {
    lines.push(HE.whatsapp.searchInstitution);
  }
  if (question.kind === "search-city") {
    lines.push(HE.whatsapp.searchCity);
  }
  if (question.kind === "multi") {
    lines.push(HE.whatsapp.multiHint);
  }
  if (opts.length) {
    lines.push("");
    for (const o of opts) {
      lines.push(`${o.n}. ${o.labelHe}`);
    }
  }
  lines.push("");
  lines.push(HE.whatsapp.skipLine);
  return lines.join("\n");
}

function parseNumberToken(raw: string): number | null {
  const t = normalizeCommand(raw).replace(/[.)]/g, "");
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function parseNumberList(raw: string): number[] | null {
  const t = normalizeCommand(raw).replace(/[.)]/g, "");
  if (!/^\d+(\s*[,،\s]\s*\d+)+$/.test(t) && !/^\d+$/.test(t)) return null;
  const parts = t.split(/[,،\s]+/).filter(Boolean);
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n <= 0)) return null;
  return nums;
}

function optionByNumber(options: NumberedOption[], n: number): NumberedOption | undefined {
  return options.find((o) => o.n === n);
}

function matchChoiceByText(question: ChatQuestion, raw: string): ChatChoice | undefined {
  const t = normalizeCommand(raw).toLowerCase();
  return question.choices?.find(
    (c) =>
      c.id.toLowerCase() === t ||
      c.labelHe === normalizeCommand(raw) ||
      c.labelHe.toLowerCase() === t,
  );
}

function institutionFromPayloadOrText(raw: string): { id: string; nameHe: string } | undefined {
  const payload = raw.startsWith("institution:") ? raw.slice("institution:".length) : raw;
  const byId = INSTITUTIONS.find((i) => i.id.toLowerCase() === payload.trim().toLowerCase());
  if (byId) return { id: byId.id, nameHe: byId.nameHe };
  const list = filterInstitutions(payload);
  if (list.length === 1) return { id: list[0].id, nameHe: list[0].nameHe };
  const exactName = INSTITUTIONS.find((i) => i.nameHe === normalizeCommand(payload));
  if (exactName) return { id: exactName.id, nameHe: exactName.nameHe };
  return undefined;
}

function payloadToAction(
  question: ChatQuestion,
  payload: string,
  options: NumberedOption[],
): ChatAction | undefined {
  const p = payload.trim();
  if (p === "skip" || isSkipCommand(p)) return { type: "skip", question };
  if (p.startsWith("choice:")) {
    const id = p.slice("choice:".length);
    const choice = question.choices?.find((c) => c.id === id);
    if (choice) return { type: "choice", question, choice };
  }
  if (p.startsWith("institution:")) {
    const inst = institutionFromPayloadOrText(p);
    if (inst) return { type: "institution", question, institutionId: inst.id };
  }
  if (p.startsWith("city:")) {
    return { type: "city", question, city: p.slice("city:".length) };
  }
  if (p.startsWith("multi:")) {
    const value = p.slice("multi:".length);
    if (question.multiValues?.includes(value)) {
      return { type: "multi", question, values: [value] };
    }
  }
  const n = parseNumberToken(p);
  if (n != null) {
    const opt = optionByNumber(options, n);
    if (opt) return payloadToAction(question, opt.payload, options);
  }
  return undefined;
}

export function parseInbound(
  inbound: InboundText,
  question: ChatQuestion | undefined,
  listed: NumberedOption[] = [],
): ParsedInbound {
  const raw = inbound.buttonPayload?.trim() || inbound.body;
  if (!raw) return { kind: "unparsed" };
  if (isSandboxKeyword(raw)) return { kind: "ignore" };
  if (isResetCommand(raw)) return { kind: "reset" };
  if (isReportCommand(raw)) return { kind: "report" };
  if (isSkipCommand(raw)) return { kind: "skip" };

  if (!question) return { kind: "unparsed" };

  const options = listed.length ? listed : questionOptions(question);

  if (inbound.buttonPayload) {
    const fromPayload = payloadToAction(question, inbound.buttonPayload, options);
    if (fromPayload) return { kind: "action", action: fromPayload };
  }

  const fromBodyPayload = payloadToAction(question, raw, options);
  if (fromBodyPayload) return { kind: "action", action: fromBodyPayload };

  if (question.kind === "choices") {
    const choice = matchChoiceByText(question, raw);
    if (choice) return { kind: "action", action: { type: "choice", question, choice } };
    return { kind: "unparsed" };
  }

  if (question.kind === "multi") {
    const nums = parseNumberList(raw);
    if (nums && question.multiValues) {
      const values: string[] = [];
      for (const n of nums) {
        const opt = optionByNumber(options, n);
        if (!opt?.payload.startsWith("multi:")) return { kind: "unparsed" };
        values.push(opt.payload.slice("multi:".length));
      }
      return { kind: "action", action: { type: "multi", question, values } };
    }
    const labels = normalizeCommand(raw)
      .split(/[,،]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const mapped = labels
      .map((label) => question.multiValues?.find((v) => v === label || fieldLabelHe(v) === label))
      .filter((v): v is string => Boolean(v));
    if (mapped.length === labels.length && mapped.length > 0) {
      return { kind: "action", action: { type: "multi", question, values: mapped } };
    }
    return { kind: "unparsed" };
  }

  if (question.kind === "search-institution") {
    const exact = institutionFromPayloadOrText(raw);
    if (exact) {
      return { kind: "action", action: { type: "institution", question, institutionId: exact.id } };
    }
    const filtered = questionOptions(question, raw);
    if (filtered.length === 1) {
      const inst = institutionFromPayloadOrText(filtered[0].payload);
      if (inst) {
        return { kind: "action", action: { type: "institution", question, institutionId: inst.id } };
      }
    }
    if (filtered.length > 1) {
      return {
        kind: "relabel",
        options: filtered,
        promptHe: HE.whatsapp.institutionPick,
      };
    }
    return { kind: "unparsed" };
  }

  if (question.kind === "search-city") {
    const n = parseNumberToken(raw);
    if (n != null) {
      const opt = optionByNumber(options, n);
      if (opt?.payload.startsWith("city:")) {
        return {
          kind: "action",
          action: { type: "city", question, city: opt.payload.slice("city:".length) },
        };
      }
    }
    const matches = filterCities(raw);
    if (matches.length === 1) {
      return { kind: "action", action: { type: "city", question, city: matches[0] } };
    }
    const canonical = normalizeCityName(raw);
    if (canonical.length >= 2) {
      return { kind: "action", action: { type: "city", question, city: canonical } };
    }
    return { kind: "unparsed" };
  }

  return { kind: "unparsed" };
}

export type WhatsAppSession = ChatSessionState & {
  extrasIntroShown: boolean;
  offerShown: boolean;
  reportSent: boolean;
  listed: NumberedOption[];
};

export function emptyWhatsAppSession(): WhatsAppSession {
  return {
    ...emptyChatState(),
    extrasIntroShown: false,
    offerShown: false,
    reportSent: false,
    listed: [],
  };
}

export type TurnResult = {
  session: WhatsAppSession;
  messages: string[];
  ignore: boolean;
  reportRequested: boolean;
  appliedProfile?: StudentProfile;
};

function currentQuestion(session: WhatsAppSession): ChatQuestion | undefined {
  return nextChatQuestion(session.profile, session.askedIds);
}

function promptBlock(session: WhatsAppSession, question: ChatQuestion): { text: string; listed: NumberedOption[] } {
  const listed = questionOptions(question);
  return { text: formatQuestionMessage(question, listed), listed };
}

function nextPromptMessages(
  prev: WhatsAppSession,
  next: WhatsAppSession,
): { messages: string[]; session: WhatsAppSession } {
  const messages: string[] = [];
  const prevFilled = filledWizardFieldCount(prev.profile);
  const nextFilled = filledWizardFieldCount(next.profile);
  let extrasIntroShown = next.extrasIntroShown;
  let offerShown = next.offerShown;

  if (!offerShown && nextFilled >= 3 && prevFilled < 3) {
    messages.push(HE.whatsapp.offer);
    offerShown = true;
  }

  const question = nextChatQuestion(next.profile, next.askedIds);
  if (question) {
    if (!question.core && !extrasIntroShown) {
      messages.push(HE.chat.extrasIntro);
      extrasIntroShown = true;
    }
    const block = promptBlock(next, question);
    messages.push(block.text);
    return {
      messages,
      session: { ...next, extrasIntroShown, offerShown, listed: block.listed },
    };
  }

  if (nextFilled >= 1) {
    messages.push(HE.chat.done);
  } else {
    messages.push(HE.chat.emptyDone);
  }
  return {
    messages,
    session: { ...next, extrasIntroShown, offerShown, listed: [] },
  };
}

export function startSessionMessages(): { session: WhatsAppSession; messages: string[] } {
  const session = emptyWhatsAppSession();
  const first = nextChatQuestion(session.profile, session.askedIds);
  const messages = [`${HE.chat.intro}\n\n${HE.whatsapp.introExtra}\n\n${HE.whatsapp.sessionPrivacy}`];
  if (first) {
    const block = promptBlock(session, first);
    messages.push(block.text);
    return { session: { ...session, listed: block.listed }, messages };
  }
  messages.push(HE.chat.emptyDone);
  return { session, messages };
}

/**
 * One inbound WhatsApp turn against the shared chat-intake machine.
 * Report text is left to the caller so the webhook can run the real matcher.
 */
export function applyWhatsAppTurn(session: WhatsAppSession | undefined, inbound: InboundText): TurnResult {
  const raw = inbound.buttonPayload?.trim() || inbound.body;
  if (raw && isSandboxKeyword(raw)) {
    return {
      session: session ?? emptyWhatsAppSession(),
      messages: [],
      ignore: true,
      reportRequested: false,
    };
  }

  if (!session || (raw && isResetCommand(raw))) {
    const started = startSessionMessages();
    return {
      session: started.session,
      messages: started.messages,
      ignore: false,
      reportRequested: false,
    };
  }

  const question = currentQuestion(session);
  const parsed = parseInbound(inbound, question, session.listed);

  if (parsed.kind === "ignore") {
    return { session, messages: [], ignore: true, reportRequested: false };
  }

  if (parsed.kind === "reset") {
    const started = startSessionMessages();
    return {
      session: started.session,
      messages: started.messages,
      ignore: false,
      reportRequested: false,
    };
  }

  if (parsed.kind === "report") {
    if (!canOfferChatReport(session.profile)) {
      const messages: string[] = [HE.whatsapp.tooEarlyReport];
      if (question) {
        const block = promptBlock(session, question);
        messages.push(block.text);
        return {
          session: { ...session, listed: block.listed },
          messages,
          ignore: false,
          reportRequested: false,
        };
      }
      return { session, messages, ignore: false, reportRequested: false };
    }
    return {
      session: { ...session, reportSent: true, offerShown: true },
      messages: [],
      ignore: false,
      reportRequested: true,
      appliedProfile: session.profile,
    };
  }

  if (parsed.kind === "relabel") {
    const text = [parsed.promptHe, "", ...parsed.options.map((o) => `${o.n}. ${o.labelHe}`), "", HE.whatsapp.skipLine].join(
      "\n",
    );
    return {
      session: { ...session, listed: parsed.options },
      messages: [text],
      ignore: false,
      reportRequested: false,
    };
  }

  if (parsed.kind === "unparsed") {
    const messages: string[] = [HE.whatsapp.unparsed];
    if (question) {
      const block = promptBlock(session, question);
      messages.push(block.text);
      return {
        session: { ...session, listed: block.listed },
        messages,
        ignore: false,
        reportRequested: false,
      };
    }
    return { session, messages, ignore: false, reportRequested: false };
  }

  if (!question) {
    if (canOfferChatReport(session.profile)) {
      return {
        session: { ...session, reportSent: true },
        messages: [],
        ignore: false,
        reportRequested: true,
        appliedProfile: session.profile,
      };
    }
    const started = startSessionMessages();
    return {
      session: started.session,
      messages: started.messages,
      ignore: false,
      reportRequested: false,
    };
  }

  const action: ChatAction =
    parsed.kind === "skip" ? { type: "skip", question } : parsed.action;
  const applied = applyChatAction(session, action);
  const next: WhatsAppSession = {
    ...session,
    profile: applied.profile,
    askedIds: applied.askedIds,
  };

  const follow = nextPromptMessages(session, next);
  const moreQuestions = Boolean(nextChatQuestion(follow.session.profile, follow.session.askedIds));
  const shouldAutoReport = !moreQuestions && canOfferChatReport(follow.session.profile);

  return {
    session: { ...follow.session, reportSent: shouldAutoReport || follow.session.reportSent },
    messages: follow.messages,
    ignore: false,
    reportRequested: shouldAutoReport,
    appliedProfile: follow.session.profile,
  };
}

export function sessionQuestion(session: WhatsAppSession): ChatQuestion | undefined {
  return nextChatQuestion(session.profile, session.askedIds);
}
