import type { ChatQuestion } from "./chat-intake";
import type { InboundText, NumberedOption, ParsedInbound } from "./chat-reply";
import { INSTITUTIONS } from "./institutions";
import { normalizeCityName } from "./cities";

export const DEFAULT_LLM_BASE_URL = "https://api.groq.com/openai/v1";
export const DEFAULT_LLM_MODEL = "llama-3.1-8b-instant";
export const LLM_TIMEOUT_MS = 2500;

export type LlmEnv = {
  WHATSAPP_LLM_API_KEY?: string;
  WHATSAPP_LLM_BASE_URL?: string;
  WHATSAPP_LLM_MODEL?: string;
};

export type LlmNluJson = {
  kind?: string;
  optionNumber?: number;
  optionNumbers?: number[];
  institutionId?: string;
  city?: string;
  confidence?: string;
  clarifyHe?: string;
};

export type FetchLike = (
  input: string | URL,
  init?: { method?: string; headers?: Record<string, string>; body?: string; signal?: AbortSignal },
) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

const SYSTEM_PROMPT =
  "אתה מסווג תשובת סטודנט לאחת האפשרויות שניתנו בלבד. " +
  "אסור להמציא מלגות, סכומים, תאריכים או אפשרויות. " +
  "החזר JSON בלבד. " +
  'סכימה: {"kind":"choice"|"multi"|"institution"|"city"|"skip"|"report"|"reset"|"clarify",' +
  '"optionNumber":number,"optionNumbers":number[],"institutionId":string,"city":string,' +
  '"confidence":"high"|"low","clarifyHe":string}. ' +
  "לראות מלגות / מה מגיע לי / תראה לי / הציגו מלגות → kind=report. " +
  "??? / מה? → kind=clarify. " +
  "confidence=high רק כשהמיפוי חד-משמעי לאפשרות שברשימה. אחרת kind=clarify ו-confidence=low.";

function optionByNumber(options: NumberedOption[], n: number): NumberedOption | undefined {
  return options.find((o) => o.n === n);
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("no json object");
  return JSON.parse(trimmed.slice(start, end + 1));
}

function isHighConfidence(data: LlmNluJson): boolean {
  return data.confidence === "high";
}

export function parsedFromLlmJson(
  data: LlmNluJson,
  question: ChatQuestion,
  listed: NumberedOption[],
): ParsedInbound {
  if (!isHighConfidence(data)) return { kind: "unparsed" };

  const kind = data.kind;
  if (kind === "skip") return { kind: "skip" };
  if (kind === "report") return { kind: "report" };
  if (kind === "reset") return { kind: "reset" };
  if (kind === "clarify") return { kind: "unparsed" };

  if (kind === "choice" || (data.optionNumber != null && question.kind === "choices")) {
    const n = data.optionNumber;
    if (n == null || !Number.isInteger(n)) return { kind: "unparsed" };
    const opt = optionByNumber(listed, n);
    if (!opt?.payload.startsWith("choice:")) return { kind: "unparsed" };
    const id = opt.payload.slice("choice:".length);
    const choice = question.choices?.find((c) => c.id === id);
    if (!choice) return { kind: "unparsed" };
    return { kind: "action", action: { type: "choice", question, choice } };
  }

  if (kind === "multi" || (data.optionNumbers && question.kind === "multi")) {
    const nums = data.optionNumbers;
    if (!nums?.length || nums.some((n) => !Number.isInteger(n) || n <= 0)) return { kind: "unparsed" };
    const values: string[] = [];
    for (const n of nums) {
      const opt = optionByNumber(listed, n);
      if (!opt?.payload.startsWith("multi:")) return { kind: "unparsed" };
      values.push(opt.payload.slice("multi:".length));
    }
    return { kind: "action", action: { type: "multi", question, values } };
  }

  if (kind === "institution" || question.kind === "search-institution") {
    if (data.optionNumber != null) {
      const opt = optionByNumber(listed, data.optionNumber);
      if (opt?.payload.startsWith("institution:")) {
        const id = opt.payload.slice("institution:".length);
        if (INSTITUTIONS.some((i) => i.id === id)) {
          return { kind: "action", action: { type: "institution", question, institutionId: id } };
        }
      }
    }
    const id = typeof data.institutionId === "string" ? data.institutionId.trim() : "";
    if (id && INSTITUTIONS.some((i) => i.id === id)) {
      return { kind: "action", action: { type: "institution", question, institutionId: id } };
    }
    return { kind: "unparsed" };
  }

  if (kind === "city" || question.kind === "search-city") {
    if (data.optionNumber != null) {
      const opt = optionByNumber(listed, data.optionNumber);
      if (opt?.payload.startsWith("city:")) {
        return {
          kind: "action",
          action: { type: "city", question, city: opt.payload.slice("city:".length) },
        };
      }
    }
    const rawCity = typeof data.city === "string" ? data.city.trim() : "";
    if (rawCity.length >= 2) {
      return { kind: "action", action: { type: "city", question, city: normalizeCityName(rawCity) } };
    }
    return { kind: "unparsed" };
  }

  return { kind: "unparsed" };
}

function listedPrompt(question: ChatQuestion, listed: NumberedOption[]): string {
  const lines = [`שאלה: ${question.promptHe}`, "אפשרויות:"];
  for (const o of listed) {
    const id = o.payload.includes(":") ? o.payload.slice(o.payload.indexOf(":") + 1) : "";
    lines.push(id && question.kind === "search-institution" ? `${o.n}. ${o.labelHe} (${id})` : `${o.n}. ${o.labelHe}`);
  }
  if (question.kind === "multi") lines.push("אפשר כמה מספרים.");
  return lines.join("\n");
}

async function callChatCompletions(args: {
  apiKey: string;
  baseUrl: string;
  model: string;
  userText: string;
  question: ChatQuestion;
  listed: NumberedOption[];
  fetchImpl: FetchLike;
  timeoutMs: number;
}): Promise<LlmNluJson | null> {
  const url = `${args.baseUrl.replace(/\/$/, "")}/chat/completions`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), args.timeoutMs);
  try {
    const res = await args.fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: args.model,
        temperature: 0,
        max_tokens: 160,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `${listedPrompt(args.question, args.listed)}\nטקסט הסטודנט: ${args.userText}`,
          },
        ],
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const raw = await res.text();
    const body = JSON.parse(raw) as { choices?: { message?: { content?: string } }[] };
    const content = body.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = extractJsonObject(content);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as LlmNluJson;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * LLM fallback after the deterministic parser returns `unparsed`.
 * Missing key, timeout, invalid JSON, or low confidence → `unparsed` (no throw).
 */
export async function resolveUnparsedWithLlm(args: {
  inbound: InboundText;
  question: ChatQuestion;
  listed: NumberedOption[];
  env?: LlmEnv;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
}): Promise<ParsedInbound> {
  const apiKey = args.env?.WHATSAPP_LLM_API_KEY?.trim();
  if (!apiKey) return { kind: "unparsed" };

  const userText = (args.inbound.buttonPayload?.trim() || args.inbound.body).trim();
  if (!userText) return { kind: "unparsed" };

  const listed = args.listed;
  const fetchImpl = args.fetchImpl ?? (globalThis.fetch as FetchLike);
  const data = await callChatCompletions({
    apiKey,
    baseUrl: args.env?.WHATSAPP_LLM_BASE_URL?.trim() || DEFAULT_LLM_BASE_URL,
    model: args.env?.WHATSAPP_LLM_MODEL?.trim() || DEFAULT_LLM_MODEL,
    userText,
    question: args.question,
    listed,
    fetchImpl,
    timeoutMs: args.timeoutMs ?? LLM_TIMEOUT_MS,
  });
  if (!data) return { kind: "unparsed" };
  return parsedFromLlmJson(data, args.question, listed);
}
