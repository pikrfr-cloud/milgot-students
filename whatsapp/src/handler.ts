import { applyWhatsAppTurn } from "../../lib/chat-reply";
import { buildWhatsAppReport } from "../../lib/whatsapp-report";
import { getSession, putSession } from "./session";
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
};

let missingTokenWarned = false;

export type HandleResult = {
  status: number;
  xml: string;
  maskedFrom: string;
  ignored: boolean;
};

function envValue(env: WhatsAppEnv | undefined, key: keyof WhatsAppEnv): string | undefined {
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
  const authToken = envValue(args.env, "TWILIO_AUTH_TOKEN");

  if (authToken) {
    const url = twilioWebhookUrl(args.requestUrl, envValue(args.env, "TWILIO_WEBHOOK_URL"));
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

  return handleInbound(inbound, { asOf: args.asOf });
}

export function handleInbound(
  inbound: TwilioInbound,
  options: { asOf?: Date } = {},
): HandleResult {
  const maskedFrom = maskFrom(inbound.from);
  const existing = getSession(inbound.from);
  const turn = applyWhatsAppTurn(existing, {
    body: inbound.body,
    buttonPayload: inbound.buttonPayload,
  });
  putSession(inbound.from, turn.session);

  if (turn.ignore) {
    return { status: 200, xml: twimlEmpty(), maskedFrom, ignored: true };
  }

  const messages = [...turn.messages];
  if (turn.reportRequested) {
    const report = buildWhatsAppReport(turn.appliedProfile ?? turn.session.profile, {
      asOf: options.asOf,
    });
    messages.push(report.text);
  }

  return {
    status: 200,
    xml: messages.length ? twimlMessages(messages) : twimlEmpty(),
    maskedFrom,
    ignored: false,
  };
}
