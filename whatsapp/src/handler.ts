import { resolveUnparsedWithLlm, type LlmEnv } from "../../lib/chat-nlu";
import {
  applyWhatsAppTurn,
  isClarifyNudge,
  parseInbound,
  questionOptions,
  sessionQuestion,
  type InboundText,
} from "../../lib/chat-reply";
import {
  isReminderStopCommand,
  isReminderSubscribeCommand,
  profileFromReminderBody,
  reminderCandidatesFromProfile,
  REMINDER_COPY,
  type ReminderItem,
} from "../../lib/whatsapp-reminders";
import { buildWhatsAppReport } from "../../lib/whatsapp-report";
import { getSession, putSession } from "./session";
import { deleteSubscription, putSubscription, type ReminderKv } from "./reminders-kv";
import {
  maskFrom,
  parseTwilioForm,
  twilioWebhookUrl,
  twimlEmpty,
  twimlMessages,
  validateTwilioSignature,
  type TwilioInbound,
} from "./twilio";

export type WhatsAppEnv = {
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_WEBHOOK_URL?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_WHATSAPP_FROM?: string;
  WHATSAPP_LLM_API_KEY?: string;
  WHATSAPP_LLM_BASE_URL?: string;
  WHATSAPP_LLM_MODEL?: string;
  REMINDERS?: ReminderKv;
};

let missingTokenWarned = false;

export type HandleResult = {
  status: number;
  xml: string;
  maskedFrom: string;
  ignored: boolean;
};

function envString(env: WhatsAppEnv | undefined, key: Exclude<keyof WhatsAppEnv, "REMINDERS">): string | undefined {
  const fromBindings = env?.[key];
  if (fromBindings) return fromBindings;
  if (typeof process !== "undefined" && process.env) return process.env[key];
  return undefined;
}

export async function handleWhatsAppPost(args: {
  rawBody: string;
  requestUrl: string;
  signature: string | undefined;
  env?: WhatsAppEnv;
  asOf?: Date;
}): Promise<HandleResult> {
  const params = new URLSearchParams(args.rawBody);
  const inbound = parseTwilioForm(params);
  const maskedFrom = maskFrom(inbound.from);
  const authToken = envString(args.env, "TWILIO_AUTH_TOKEN");

  if (authToken) {
    const url = twilioWebhookUrl(args.requestUrl, envString(args.env, "TWILIO_WEBHOOK_URL"));
    const ok = await validateTwilioSignature(authToken, args.signature ?? "", url, params);
    if (!ok) {
      console.warn(`[whatsapp] invalid Twilio signature from ${maskedFrom}`);
      return { status: 403, xml: twimlEmpty(), maskedFrom, ignored: true };
    }
  } else if (!missingTokenWarned) {
    missingTokenWarned = true;
    console.warn(
      "[whatsapp] TWILIO_AUTH_TOKEN is not set — signature checks skipped (dev mode). Do not use this in production.",
    );
  }

  if (!inbound.from) {
    return { status: 400, xml: twimlMessages(["לא הצלחנו לזהות את השיחה. נסו שוב."]), maskedFrom, ignored: true };
  }

  return handleInbound(inbound, { asOf: args.asOf, env: args.env });
}

function kvOf(env: WhatsAppEnv | undefined): ReminderKv | undefined {
  return env?.REMINDERS;
}

function llmEnvOf(env: WhatsAppEnv | undefined): LlmEnv {
  return {
    WHATSAPP_LLM_API_KEY: envString(env, "WHATSAPP_LLM_API_KEY"),
    WHATSAPP_LLM_BASE_URL: envString(env, "WHATSAPP_LLM_BASE_URL"),
    WHATSAPP_LLM_MODEL: envString(env, "WHATSAPP_LLM_MODEL"),
  };
}

async function handleReminderStop(from: string, env: WhatsAppEnv | undefined): Promise<HandleResult> {
  const kv = kvOf(env);
  if (kv) {
    await deleteSubscription(kv, from);
  }
  return {
    status: 200,
    xml: twimlMessages([REMINDER_COPY.stopped]),
    maskedFrom: maskFrom(from),
    ignored: false,
  };
}

function lastReportItems(
  inbound: TwilioInbound,
  asOf: Date | undefined,
): ReminderItem[] | null {
  const existing = getSession(inbound.from);
  const fromUrl = profileFromReminderBody(inbound.body);
  if (fromUrl) {
    return reminderCandidatesFromProfile(fromUrl, asOf ?? new Date());
  }
  if (existing?.reportSent) {
    if (existing.lastReportEligible) return existing.lastReportEligible;
    return reminderCandidatesFromProfile(existing.profile, asOf ?? new Date());
  }
  return null;
}

async function handleReminderSubscribe(
  inbound: TwilioInbound,
  options: { asOf?: Date; env?: WhatsAppEnv },
): Promise<HandleResult> {
  const maskedFrom = maskFrom(inbound.from);
  const items = lastReportItems(inbound, options.asOf);
  if (items == null) {
    return {
      status: 200,
      xml: twimlMessages([REMINDER_COPY.needReportFirst]),
      maskedFrom,
      ignored: false,
    };
  }
  if (items.length === 0) {
    return {
      status: 200,
      xml: twimlMessages([REMINDER_COPY.noneDated]),
      maskedFrom,
      ignored: false,
    };
  }
  const kv = kvOf(options.env);
  if (!kv) {
    console.warn("[whatsapp] reminder subscribe skipped — REMINDERS KV is not bound");
    return {
      status: 200,
      xml: twimlMessages([REMINDER_COPY.saveFailed]),
      maskedFrom,
      ignored: false,
    };
  }
  await putSubscription(kv, inbound.from, items);
  return {
    status: 200,
    xml: twimlMessages([REMINDER_COPY.subscribed]),
    maskedFrom,
    ignored: false,
  };
}

export async function handleInbound(
  inbound: TwilioInbound,
  options: { asOf?: Date; env?: WhatsAppEnv } = {},
): Promise<HandleResult> {
  const commandText = inbound.buttonPayload?.trim() || inbound.body;

  if (commandText && isReminderStopCommand(commandText)) {
    return handleReminderStop(inbound.from, options.env);
  }
  if (commandText && isReminderSubscribeCommand(commandText)) {
    return handleReminderSubscribe(inbound, options);
  }

  const maskedFrom = maskFrom(inbound.from);
  const existing = getSession(inbound.from);
  const inboundText: InboundText = {
    body: inbound.body,
    buttonPayload: inbound.buttonPayload,
  };
  const question = existing ? sessionQuestion(existing) : undefined;
  const listed = existing?.listed?.length
    ? existing.listed
    : question
      ? questionOptions(question)
      : [];
  let parsed = parseInbound(inboundText, question, listed);
  if (parsed.kind === "unparsed" && question && !isClarifyNudge(inboundText.body)) {
    parsed = await resolveUnparsedWithLlm({
      inbound: inboundText,
      question,
      listed,
      env: llmEnvOf(options.env),
    });
  }
  const turn = applyWhatsAppTurn(existing, inboundText, { parsed });
  putSession(inbound.from, turn.session);

  if (turn.ignore) {
    return { status: 200, xml: twimlEmpty(), maskedFrom, ignored: true };
  }

  const messages = [...turn.messages];
  if (turn.reportRequested) {
    const profile = turn.appliedProfile ?? turn.session.profile;
    const asOf = options.asOf ?? new Date();
    const report = buildWhatsAppReport(profile, { asOf });
    const lastReportEligible = reminderCandidatesFromProfile(profile, asOf);
    putSession(inbound.from, { ...turn.session, lastReportEligible });
    messages.push(...report.messages);
  }

  return {
    status: 200,
    xml: messages.length ? twimlMessages(messages) : twimlEmpty(),
    maskedFrom,
    ignored: false,
  };
}
