import { afterEach, describe, expect, it, vi } from "vitest";
import { chatQuestionById } from "@/lib/chat-intake";
import { parsedFromLlmJson, resolveUnparsedWithLlm } from "@/lib/chat-nlu";
import {
  applyWhatsAppTurn,
  isClarifyNudge,
  isReportCommand,
  parseInbound,
  questionOptions,
} from "@/lib/chat-reply";

function q(id: string) {
  const question = chatQuestionById(id);
  if (!question) throw new Error(`missing ${id}`);
  return question;
}

describe("deterministic Hebrew synonyms", () => {
  it("maps תואר ראשון / BA / ראשון to ba", () => {
    const degree = q("degreeLevel");
    const listed = questionOptions(degree);
    for (const body of ["תואר ראשון", "BA", "ראשון"]) {
      const parsed = parseInbound({ body }, degree, listed);
      expect(parsed.kind, body).toBe("action");
      if (parsed.kind !== "action" || parsed.action.type !== "choice") throw new Error(body);
      expect(parsed.action.choice.id).toBe("ba");
    }
  });

  it("maps שנה שלישית / שנה ג / 3 to year 3", () => {
    const year = q("yearOfStudy");
    const listed = questionOptions(year);
    for (const body of ["שנה שלישית", "שנה ג", "3"]) {
      const parsed = parseInbound({ body }, year, listed);
      expect(parsed.kind, body).toBe("action");
      if (parsed.kind !== "action" || parsed.action.type !== "choice") throw new Error(body);
      expect(parsed.action.choice.id).toBe("3");
    }
  });

  it("maps כן / בטח / לא ממש on yes-no questions", () => {
    const miluim = q("miluim");
    const volunteer = q("willingToVolunteer");
    const yes = parseInbound({ body: "כן" }, miluim, questionOptions(miluim));
    expect(yes.kind).toBe("action");
    if (yes.kind !== "action" || yes.action.type !== "choice") throw new Error("yes");
    expect(yes.action.choice.id).toBe("yes");

    const sure = parseInbound({ body: "בטח" }, miluim, questionOptions(miluim));
    expect(sure.kind).toBe("action");
    if (sure.kind !== "action" || sure.action.type !== "choice") throw new Error("sure");
    expect(sure.action.choice.id).toBe("yes");

    const no = parseInbound({ body: "לא ממש" }, volunteer, questionOptions(volunteer));
    expect(no.kind).toBe("action");
    if (no.kind !== "action" || no.action.type !== "choice") throw new Error("no");
    expect(no.action.choice.id).toBe("no");

    const volunteerYes = parseInbound({ body: "כן להתנדב" }, volunteer, questionOptions(volunteer));
    expect(volunteerYes.kind).toBe("action");
    if (volunteerYes.kind !== "action" || volunteerYes.action.type !== "choice") {
      throw new Error("volunteer yes");
    }
    expect(volunteerYes.action.choice.id).toBe("yes");
  });

  it("maps הפתוחה / אופן / ת״א to institution ids", () => {
    const inst = q("institution");
    const listed = questionOptions(inst);
    const openu = parseInbound({ body: "הפתוחה" }, inst, listed);
    expect(openu.kind).toBe("action");
    if (openu.kind !== "action" || openu.action.type !== "institution") throw new Error("openu");
    expect(openu.action.institutionId).toBe("openu");

    const open = parseInbound({ body: "אופן" }, inst, listed);
    expect(open.kind).toBe("action");
    if (open.kind !== "action" || open.action.type !== "institution") throw new Error("open");
    expect(open.action.institutionId).toBe("openu");

    const tau = parseInbound({ body: "ת״א" }, inst, listed);
    expect(tau.kind).toBe("action");
    if (tau.kind !== "action" || tau.action.type !== "institution") throw new Error("tau");
    expect(tau.action.institutionId).toBe("tau");
  });

  it("maps ראשל״צ / ראשלצ to ראשון לציון", () => {
    const city = q("cityOfResidence");
    for (const body of ["ראשל״צ", "ראשלצ"]) {
      const parsed = parseInbound({ body }, city, questionOptions(city));
      expect(parsed.kind, body).toBe("action");
      if (parsed.kind !== "action" || parsed.action.type !== "city") throw new Error(body);
      expect(parsed.action.city).toBe("ראשון לציון");
    }
  });

  it("treats לראות מלגות and related phrases as report", () => {
    const degree = q("degreeLevel");
    for (const body of [
      "לראות מלגות",
      "תראו לי מלגות",
      "תראה לי",
      "הציגו מלגות",
      "מה מגיע לי",
      "מה מתאים לי",
    ]) {
      expect(isReportCommand(body), body).toBe(true);
      expect(parseInbound({ body }, degree).kind, body).toBe("report");
    }
  });

  it("treats ??? as a clarify nudge, not a choice", () => {
    expect(isClarifyNudge("???")).toBe(true);
    expect(isClarifyNudge("?")).toBe(true);
    const degree = q("degreeLevel");
    const parsed = parseInbound({ body: "???" }, degree, questionOptions(degree));
    expect(parsed.kind).toBe("unparsed");
    const turn = applyWhatsAppTurn(
      { ...applyWhatsAppTurn(undefined, { body: "התחלה" }).session },
      { body: "???" },
    );
    expect(turn.reportRequested).toBe(false);
    expect(turn.messages.join("\n")).toMatch(/אפשר לכתוב במלים|מספר מהרשימה/);
    expect(turn.messages.join("\n")).toContain("איזה תואר");
  });

  it("does not map an ambiguous label to two degree options", () => {
    const degree = q("degreeLevel");
    const parsed = parseInbound({ body: "תואר" }, degree, questionOptions(degree));
    expect(parsed.kind).toBe("unparsed");
  });
});

describe("cheap LLM NLU fallback", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function jsonResponse(payload: unknown) {
    return {
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(payload) } }],
        }),
    };
  }

  it("applies high-confidence valid JSON to a listed option", async () => {
    const degree = q("degreeLevel");
    const listed = questionOptions(degree);
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ kind: "choice", optionNumber: 1, confidence: "high" }),
    );
    const parsed = await resolveUnparsedWithLlm({
      inbound: { body: "אני לומד לתואר הראשון בערך" },
      question: degree,
      listed,
      env: { WHATSAPP_LLM_API_KEY: "test-key" },
      fetchImpl,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(parsed.kind).toBe("action");
    if (parsed.kind !== "action" || parsed.action.type !== "choice") throw new Error("choice");
    expect(parsed.action.choice.id).toBe("ba");
  });

  it("clarifies on invalid JSON, low confidence, or missing key without throwing", async () => {
    const degree = q("degreeLevel");
    const listed = questionOptions(degree);

    const missing = await resolveUnparsedWithLlm({
      inbound: { body: "משהו חופשי" },
      question: degree,
      listed,
      env: {},
    });
    expect(missing).toEqual({ kind: "unparsed" });

    const low = parsedFromLlmJson(
      { kind: "choice", optionNumber: 1, confidence: "low" },
      degree,
      listed,
    );
    expect(low).toEqual({ kind: "unparsed" });

    const invalidOption = parsedFromLlmJson(
      { kind: "choice", optionNumber: 99, confidence: "high" },
      degree,
      listed,
    );
    expect(invalidOption).toEqual({ kind: "unparsed" });

    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ choices: [{ message: { content: "not-json" } }] }),
    }));
    const bad = await resolveUnparsedWithLlm({
      inbound: { body: "משהו חופשי" },
      question: degree,
      listed,
      env: { WHATSAPP_LLM_API_KEY: "test-key" },
      fetchImpl,
    });
    expect(bad).toEqual({ kind: "unparsed" });
  });
});
