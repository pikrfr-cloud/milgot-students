import { capWhatsAppOutboundBodies } from "../../lib/whatsapp-report";

/** Twilio form-encoded inbound + TwiML helpers. No official SDK (keeps the Worker small). */

export type TwilioInbound = {
  from: string;
  body: string;
  profileName?: string;
  buttonPayload?: string;
  buttonText?: string;
  messageSid?: string;
};

export function parseTwilioForm(params: URLSearchParams): TwilioInbound {
  const buttonPayload =
    params.get("ButtonPayload")?.trim() ||
    params.get("ButtonText")?.trim() ||
    undefined;
  return {
    from: params.get("From") ?? params.get("WaId") ?? "",
    body: (params.get("Body") ?? "").trim(),
    profileName: params.get("ProfileName") || undefined,
    buttonPayload,
    buttonText: params.get("ButtonText") || undefined,
    messageSid: params.get("MessageSid") || undefined,
  };
}

/** Mask to last 4 digits — never log a full WhatsApp From. */
export function maskFrom(from: string): string {
  const digits = from.replace(/\D/g, "");
  if (digits.length < 4) return "…";
  return `…${digits.slice(-4)}`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function twimlMessages(texts: string[]): string {
  const body = capWhatsAppOutboundBodies(texts)
    .map((t) => `<Message>${escapeXml(t)}</Message>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`;
}

export function twimlEmpty(): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

function base64FromBytes(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

/**
 * Twilio request signature: HMAC-SHA1 of URL + sorted POST params, Base64.
 * @see https://www.twilio.com/docs/usage/security#validating-requests
 */
export async function validateTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: URLSearchParams,
): Promise<boolean> {
  const keys = [...new Set(params.keys())].sort();
  let data = url;
  for (const key of keys) {
    data += key + (params.get(key) ?? "");
  }
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(authToken),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
  const expected = base64FromBytes(new Uint8Array(signed));
  const a = new TextEncoder().encode(expected);
  const b = new TextEncoder().encode(signature);
  return bytesEqual(a, b);
}

export function twilioWebhookUrl(
  requestUrl: string,
  override: string | undefined,
): string {
  if (override?.trim()) {
    const u = new URL(override.trim());
    return `${u.origin}${u.pathname}`;
  }
  const u = new URL(requestUrl);
  return `${u.origin}${u.pathname}`;
}
