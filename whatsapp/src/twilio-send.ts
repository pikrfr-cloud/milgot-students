import { maskFrom } from "./twilio";

export type TwilioSendEnv = {
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_WHATSAPP_FROM?: string;
};

export type SendWhatsAppArgs = {
  to: string;
  body: string;
  env: TwilioSendEnv;
  fetchImpl?: typeof fetch;
};

function envTrim(env: TwilioSendEnv, key: keyof TwilioSendEnv): string {
  return (env[key] ?? "").trim();
}

export function twilioSendConfigured(env: TwilioSendEnv): boolean {
  return Boolean(
    envTrim(env, "TWILIO_ACCOUNT_SID") &&
      envTrim(env, "TWILIO_AUTH_TOKEN") &&
      envTrim(env, "TWILIO_WHATSAPP_FROM"),
  );
}

function basicAuth(sid: string, token: string): string {
  const bytes = new TextEncoder().encode(`${sid}:${token}`);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return `Basic ${btoa(bin)}`;
}

/**
 * Outbound WhatsApp via Twilio Messages API.
 * Never hardcode SID / token / from. Missing secrets → skip and log.
 */
export async function sendWhatsAppMessage(args: SendWhatsAppArgs): Promise<boolean> {
  const sid = envTrim(args.env, "TWILIO_ACCOUNT_SID");
  const token = envTrim(args.env, "TWILIO_AUTH_TOKEN");
  const from = envTrim(args.env, "TWILIO_WHATSAPP_FROM");
  const masked = maskFrom(args.to);

  if (!sid || !token || !from) {
    console.warn(
      `[whatsapp] reminder send skipped for ${masked} — missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_WHATSAPP_FROM`,
    );
    return false;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`;
  const body = new URLSearchParams({
    From: from,
    To: args.to,
    Body: args.body,
  });

  const fetchImpl = args.fetchImpl ?? fetch;
  try {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: basicAuth(sid, token),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!res.ok) {
      console.warn(`[whatsapp] reminder send failed for ${masked}: HTTP ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[whatsapp] reminder send failed for ${masked}:`, err);
    return false;
  }
}
