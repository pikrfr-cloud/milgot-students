import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChatIntake, openingChatMessages } from "@/components/ChatIntake";
import { VerificationNotes } from "@/components/VerificationNotes";
import { SCHOLARSHIPS } from "@/data/scholarships";
import { HE } from "@/lib/i18n/he";
import { nextChatQuestion } from "@/lib/chat-intake";

describe("chat first paint", () => {
  it("opening messages start with the intro and degreeLevel, not institution search", () => {
    const opening = openingChatMessages({});
    const first = nextChatQuestion({}, []);
    expect(first?.id).toBe("degreeLevel");
    expect(opening.messages[0]?.text).toBe(HE.chat.intro);
    expect(opening.messages.some((m) => m.questionId === "degreeLevel")).toBe(true);
    expect(opening.messages.some((m) => m.questionId === "institution")).toBe(false);
    expect(HE.chat.intro).toBe("נענה על כמה שאלות קצרות ותקבלו רשימת מלגות");
    expect(HE.actions.chatIntake).toBe("בדקו מה מתאים לכם");
    expect(HE.chat.showReportNow).toBe("הציגו לי מלגות");
  });

  it("static first paint shows intro, first question, and degree buttons — not loading or a search box", () => {
    const html = renderToStaticMarkup(<ChatIntake />);
    expect(html).toContain(HE.chat.intro);
    expect(html).toContain("איזה תואר?");
    expect(html).toContain("תואר ראשון");
    expect(html).toContain("תואר שני");
    expect(html).toContain(HE.chat.skip);
    expect(html).not.toContain(HE.profile.loading);
    expect(html).not.toContain("טוען");
    expect(html).not.toContain(HE.chat.searchInstitution);
    expect(html).not.toContain("באיזה מוסד");
    expect(html).not.toContain('id="chat-institution-search"');
    expect(html).not.toContain("רשימת המתנה");
  });

  it("home CTA is the one student action and has no waitlist", () => {
    const home = readFileSync(join(process.cwd(), "app/page.tsx"), "utf8");
    expect(home).toContain("HE.actions.chatIntake");
    expect(home).not.toMatch(/waitlist|רשימת המתנה|מייל/i);
  });
});

describe("student notes hide catalog-editor kitchen", () => {
  it("does not print כפילות / applyUrl on a known duplicate-note record", () => {
    const s = SCHOLARSHIPS.find((row) => row.id === "tau-financial-aid");
    if (!s) throw new Error("missing tau-financial-aid");
    expect(s.notesHe).toMatch(/כפילות/);
    const html = renderToStaticMarkup(<VerificationNotes scholarship={s} />);
    expect(html).not.toContain("כפילות");
    expect(html).not.toContain("applyUrl");
    expect(html).not.toContain("הרשומות נשארו");
    expect(html).toContain("לאתר הרשמי");
  });
});
