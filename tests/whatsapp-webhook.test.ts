import { describe, expect, it, beforeEach, vi } from "vitest";
import { CATALOG_STATS, SCHOLARSHIPS } from "@/data/scholarships";
import { applyWhatsAppTurn, formatQuestionMessage, parseInbound, questionOptions } from "@/lib/chat-reply";
import { chatQuestionById, chatReportCounts, nextChatQuestion } from "@/lib/chat-intake";
import { matchAll } from "@/lib/matcher";
import { MIN_CHAT_ANSWERS_FOR_REPORT } from "@/lib/profile-fields";
import { buildWhatsAppReport } from "@/lib/whatsapp-report";
import { sharedResultsUrl } from "@/lib/profile-share";
import type { StudentProfile } from "@/lib/types";
import nextConfig from "../next.config";
import { app } from "@/whatsapp/src/app";
import { handleInbound, handleWhatsAppPost } from "@/whatsapp/src/handler";
import { resetSessionStore } from "@/whatsapp/src/session";
import {
  maskFrom,
  parseTwilioForm,
  twimlEmpty,
  twimlMessages,
  validateTwilioSignature,
} from "@/whatsapp/src/twilio";

const FROM = "whatsapp:+972501234567";
const AS_OF = new Date("2026-09-01T12:00:00+03:00");

function form(body: string, from = FROM, extra: Record<string, string> = {}): string {
  return new URLSearchParams({ From: from, Body: body, ...extra }).toString();
}

async function post(body: string, from = FROM, extra: Record<string, string> = {}) {
  return app.request("http://example.com/whatsapp", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form(body, from, extra),
  });
}

async function xmlOf(body: string, from = FROM, extra: Record<string, string> = {}) {
  const res = await post(body, from, extra);
  return { status: res.status, xml: await res.text() };
}

beforeEach(() => {
  resetSessionStore();
});

describe("Twilio inbound parse + TwiML", () => {
  it("reads From, Body, ProfileName, and ButtonPayload", () => {
    const inbound = parseTwilioForm(
      new URLSearchParams({
        From: FROM,
        Body: "ignored-when-button-present",
        ProfileName: "Student",
        ButtonPayload: "choice:ba",
        ButtonText: "תואר ראשון",
      }),
    );
    expect(inbound.from).toBe(FROM);
    expect(inbound.body).toBe("ignored-when-button-present");
    expect(inbound.profileName).toBe("Student");
    expect(inbound.buttonPayload).toBe("choice:ba");
  });

  it("masks the last 4 digits and never echoes the full number", () => {
    expect(maskFrom(FROM)).toBe("…4567");
    expect(maskFrom("+972501234567")).toBe("…4567");
    expect(maskFrom("12")).toBe("…");
  });

  it("emits TwiML Response/Message and escapes XML", () => {
    const xml = twimlMessages(["שלום <שם> & חברים"]);
    expect(xml).toContain("<Response>");
    expect(xml).toContain("</Response>");
    expect(xml).toContain("<Message>");
    expect(xml).toContain("שלום &lt;שם&gt; &amp; חברים");
    expect(xml).not.toContain("<שם>");
    expect(twimlEmpty()).toBe(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
  });
});

describe("skip, numbered choice, button payload", () => {
  it("lists numbered options plus דלג", () => {
    const degree = chatQuestionById("degreeLevel");
    if (!degree) throw new Error("missing degree");
    const text = formatQuestionMessage(degree);
    expect(text).toContain("1. תואר ראשון");
    expect(text).toContain("2. תואר שני");
    expect(text).toContain("דלג");
    expect(questionOptions(degree).map((o) => o.payload)).toContain("choice:ba");
  });

  it("parses a numbered choice the same as the site button", () => {
    const degree = chatQuestionById("degreeLevel");
    if (!degree) throw new Error("missing degree");
    const parsed = parseInbound({ body: "1" }, degree, questionOptions(degree));
    expect(parsed.kind).toBe("action");
    if (parsed.kind !== "action" || parsed.action.type !== "choice") throw new Error("expected choice");
    expect(parsed.action.choice.id).toBe("ba");
    expect(parsed.action.choice.patch).toEqual({ degreeLevel: "ba" });
  });

  it("parses ButtonPayload without using Body", () => {
    const degree = chatQuestionById("degreeLevel");
    if (!degree) throw new Error("missing degree");
    const parsed = parseInbound(
      { body: "something else", buttonPayload: "choice:ma" },
      degree,
      questionOptions(degree),
    );
    expect(parsed.kind).toBe("action");
    if (parsed.kind !== "action" || parsed.action.type !== "choice") throw new Error("expected choice");
    expect(parsed.action.choice.id).toBe("ma");
  });

  it("skip uses the same skipChatQuestion field mapping", () => {
    const miluim = chatQuestionById("miluim");
    if (!miluim) throw new Error("missing miluim");
    const started = applyWhatsAppTurn(undefined, { body: "התחלה" });
    let session = started.session;
    session = applyWhatsAppTurn(session, { body: "1" }).session;
    expect(nextChatQuestion(session.profile, session.askedIds)?.id).toBe("miluim");
    const skipped = applyWhatsAppTurn(session, { body: "דלג" });
    expect(skipped.session.profile.reservistDaysLastYear).toBeNull();
    expect(skipped.session.askedIds).toContain("miluim");
    expect(skipped.session.askedIds).toContain("miluimDays");
    expect(nextChatQuestion(skipped.session.profile, skipped.session.askedIds)?.id).toBe(
      "cityOfResidence",
    );
    expect(nextChatQuestion(skipped.session.profile, skipped.session.askedIds)?.id).not.toBe("miluim");
    expect(nextChatQuestion(skipped.session.profile, skipped.session.askedIds)?.id).not.toBe(
      "miluimDays",
    );
  });
});

describe("session reset and sandbox keywords", () => {
  it("התחלה / start / התחל מחדש reset the session", async () => {
    const first = await xmlOf("היי");
    expect(first.xml).toContain("איזה תואר");
    await xmlOf("1");
    const reset = await xmlOf("התחל מחדש");
    expect(reset.xml).toContain("איזה תואר");
    expect(reset.xml).toContain("התחל מחדש");
    const startEn = await handleInbound({ from: FROM, body: "start" });
    expect(startEn.xml).toContain("איזה תואר");
  });

  it("restates the question on ??? instead of a dead לא הבנתי loop", async () => {
    await xmlOf("התחלה");
    const clarify = await xmlOf("???");
    expect(clarify.xml).toContain("איזה תואר");
    expect(clarify.xml).toMatch(/אפשר לכתוב במלים|מספר מהרשימה/);
    expect(clarify.xml).not.toContain("לא הבנתי. שלחו מספר");
  });

  it("ignores Twilio sandbox join without wiping the session", async () => {
    await xmlOf("התחלה");
    await xmlOf("1");
    const join = await xmlOf("join doll-product");
    expect(join.status).toBe(200);
    expect(join.xml).toBe(twimlEmpty());
    const next = await xmlOf("2");
    expect(next.xml).toContain("באיזו עיר");
  });
});

describe("webhook TwiML + matcher on the built profile", () => {
  it("POST /whatsapp returns TwiML and does not add an API route to the static app", async () => {
    expect(nextConfig.output).toBe("export");
    expect(nextConfig.basePath).toBe("/milgot-students");
    const res = await post("התחלה");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/xml");
    const xml = await res.text();
    expect(xml.startsWith(`<?xml version="1.0" encoding="UTF-8"?>`)).toBe(true);
    expect(xml).toContain("<Response>");
    expect(xml).toContain("<Message>");
  });

  it("runs the site matcher with the profile built from answers", async () => {
    const matchAllFn = vi.fn(matchAll);
    await xmlOf("התחלה");
    await xmlOf("1");
    await xmlOf("2");
    await xmlOf("שדרות");
    await xmlOf("1");
    const early = await handleInbound({ from: FROM, body: "לראות מלגות" }, { asOf: AS_OF });
    expect(early.xml).toContain("הנה מה שמצאתי לפי התשובות שלכם");
    const messageBodies = [...early.xml.matchAll(/<Message>([\s\S]*?)<\/Message>/g)].map((m) =>
      (m[1] ?? "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"'),
    );
    expect(messageBodies.length).toBeGreaterThan(1);
    for (const body of messageBodies) {
      expect(body.length).toBeLessThan(1500);
    }
    expect(messageBodies.some((b) => b.includes("#p="))).toBe(true);
    const expected: StudentProfile = {
      institution: "tau",
      degreeLevel: "ba",
      reservistDaysLastYear: 0,
      cityOfResidence: "שדרות",
      neighborhood: null,
    };
    expect(early.xml).toContain("#p=");
    expect(early.xml).toContain("/results/");
    expect(early.xml).toContain(sharedResultsUrl(expected).replace(/&/g, "&amp;"));

    const report = buildWhatsAppReport(expected, { asOf: AS_OF, matchAllFn });
    expect(matchAllFn).toHaveBeenCalledTimes(1);
    expect(matchAllFn.mock.calls[0][0]).toBe(SCHOLARSHIPS);
    expect(matchAllFn.mock.calls[0][1]).toMatchObject(expected);
    expect(report.counts).toEqual(chatReportCounts(expected, AS_OF));
    expect(report.counts.eligible + report.counts.needInfo + report.counts.nearMiss + report.counts.guide).toBeGreaterThan(
      0,
    );
    expect(report.text).toMatch(/מתאים עכשיו|חסר פרט אחד|כמעט מתאים|צריך לבדוק במוסד/);
    expect(report.resultsUrl).toContain("#p=");
    expect(report.text).not.toContain("זכאים לזכייה");
    expect(MIN_CHAT_ANSWERS_FOR_REPORT).toBe(3);
  });
});

describe("site matcher and webhook report agree on fixture profiles", () => {
  const fixtures: { name: string; profile: StudentProfile }[] = [
    {
      name: "chat three answers",
      profile: { institution: "tau", degreeLevel: "ba", cityOfResidence: "שדרות", neighborhood: null },
    },
    {
      name: "technion MA",
      profile: {
        institution: "technion",
        degreeLevel: "ma",
        yearOfStudy: 1,
        fieldOfStudy: "engineering",
        cityOfResidence: "חיפה",
        service: "idf",
        willingToVolunteer: true,
      },
    },
    {
      name: "arab Haifa",
      profile: {
        institution: "haifa",
        degreeLevel: "ba",
        yearOfStudy: 1,
        cityOfResidence: "נצרת",
        sectors: ["arab"],
        service: "none",
        willingToVolunteer: true,
      },
    },
  ];

  it.each(fixtures)("$name", ({ profile }) => {
    const report = buildWhatsAppReport(profile, { asOf: AS_OF });
    const counts = chatReportCounts(profile, AS_OF);
    expect(report.counts).toEqual(counts);
    expect(counts.catalogTotal).toBe(CATALOG_STATS.total);
    expect(counts.ineligible).toBeLessThanOrEqual(CATALOG_STATS.total);
    expect(
      counts.eligible +
        counts.needInfo +
        counts.nearMiss +
        counts.guide +
        counts.ineligible +
        counts.closedCycle,
    ).toBeLessThanOrEqual(CATALOG_STATS.total);
  });
});

describe("Twilio signature", () => {
  it("rejects a bad signature when the auth token is set", async () => {
    const raw = form("התחלה");
    const result = await handleWhatsAppPost({
      rawBody: raw,
      requestUrl: "https://example.com/whatsapp",
      signature: "not-valid",
      env: { TWILIO_AUTH_TOKEN: "test-token" },
    });
    expect(result.status).toBe(403);
    expect(result.xml).toBe(twimlEmpty());
    expect(result.maskedFrom).toBe("…4567");
  });

  it("accepts a valid HMAC-SHA1 signature", async () => {
    const raw = form("התחלה");
    const params = new URLSearchParams(raw);
    const url = "https://example.com/whatsapp";
    const token = "test-token";
    const keys = [...new Set(params.keys())].sort();
    let data = url;
    for (const key of keys) data += key + (params.get(key) ?? "");
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(token),
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"],
    );
    const signed = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
    let bin = "";
    for (const b of new Uint8Array(signed)) bin += String.fromCharCode(b);
    const signature = btoa(bin);
    expect(await validateTwilioSignature(token, signature, url, params)).toBe(true);

    resetSessionStore();
    const result = await handleWhatsAppPost({
      rawBody: raw,
      requestUrl: url,
      signature,
      env: { TWILIO_AUTH_TOKEN: token },
    });
    expect(result.status).toBe(200);
    expect(result.xml).toContain("<Message>");
  });
});
