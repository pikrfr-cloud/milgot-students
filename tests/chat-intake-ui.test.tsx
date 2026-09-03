import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ChatIntake,
  ChatStartOverButton,
  openingChatMessages,
  startOverChatIntake,
} from "@/components/ChatIntake";
import { VerificationNotes } from "@/components/VerificationNotes";
import { SCHOLARSHIPS } from "@/data/scholarships";
import { HE } from "@/lib/i18n/he";
import { nextChatQuestion } from "@/lib/chat-intake";
import { PROFILE_STORAGE_KEY, loadProfile, saveProfile } from "@/lib/profile-storage";
import { showChatStartOver } from "@/lib/student-session";
import { TRACKING_STORAGE_KEY, saveTracking } from "@/lib/tracking";
import { WAITLIST_STORAGE_KEY, saveWaitlist } from "@/lib/waitlist";

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
    expect(html).not.toContain(HE.chat.startOver);
  });

  it("home CTA is the one student action and has no waitlist", () => {
    const home = readFileSync(join(process.cwd(), "app/page.tsx"), "utf8");
    expect(home).toContain("בלי מנוי. בלי חשבון. רק מלגות שבאמת מתאימות לכם, עם הסבר למה.");
    expect(home).toContain("HE.actions.chatIntake");
    expect(home).toContain("מה מתאים");
    expect(home).toContain("מה חסר לאישור");
    expect(home).toContain("כמעט מתאים ומה הפער");
    expect(home).not.toMatch(/waitlist|רשימת המתנה|מייל/i);
  });

  it("hydrates landing ?institution= / ?city= / #p= on first load", () => {
    const src = readFileSync(join(process.cwd(), "components/ChatIntake.tsx"), "utf8");
    expect(src).toContain("loadProfileHydratingShare");
    expect(src).not.toMatch(/safeLoadChatProfile\(loadProfile\)/);
  });
});

describe("results unlock copy is not duplicated", () => {
  it("keeps the heading and uses a different sentence underneath", () => {
    const src = readFileSync(join(process.cwd(), "components/ResultsView.tsx"), "utf8");
    expect(src).toContain("HE.results.completeToUnlock");
    expect(src).toContain("HE.results.completeToUnlockHint");
    expect(HE.results.completeToUnlockHint).not.toBe(HE.results.completeToUnlock);
    expect(src).not.toMatch(
      /completeToUnlock\}[\s\S]{0,80}HE\.results\.completeToUnlock\}/,
    );
  });
});

describe("chat start over", () => {
  it("uses a plain Hebrew label and shows a real button when the profile is filled", () => {
    expect(HE.chat.startOver).toBe("התחילו מאפס");
    expect(showChatStartOver({})).toBe(false);
    expect(showChatStartOver({ degreeLevel: "ba" })).toBe(true);

    const hidden = renderToStaticMarkup(<ChatStartOverButton profile={{}} onStartOver={() => {}} />);
    expect(hidden).not.toContain(HE.chat.startOver);

    const shown = renderToStaticMarkup(
      <ChatStartOverButton
        profile={{ degreeLevel: "ba", institution: "tau", cityOfResidence: "חיפה" }}
        onStartOver={() => {}}
      />,
    );
    expect(shown).toContain(HE.chat.startOver);
    expect(shown).toContain("min-h-12");
    expect(shown).toContain("border-line");
    expect(shown).not.toContain("bg-clay");
    expect(shown).not.toContain("bg-forest");
    expect(shown).not.toContain("confirm");
  });

  it("clicking start over wipes storage and returns the first-question opening", () => {
    const filled = { degreeLevel: "ba" as const, institution: "tau", cityOfResidence: "חיפה" };
    const resume = openingChatMessages(filled);
    expect(resume.messages.some((m) => m.text === HE.chat.resume)).toBe(true);

    withBrowserStorage((store) => {
      saveProfile(filled);
      saveTracking({ perach: { status: "in_progress", updatedAt: "2026-09-01T00:00:00.000Z" } });
      saveWaitlist("student@example.com", true);
      expect(store.has(PROFILE_STORAGE_KEY)).toBe(true);
      expect(showChatStartOver(loadProfile())).toBe(true);

      // saveProfile({}) must not be the reset path — it leaves a filled store.
      saveProfile({});
      expect(store.has(PROFILE_STORAGE_KEY)).toBe(true);
      expect(loadProfile().degreeLevel).toBe("ba");

      const next = startOverChatIntake();

      expect(store.has(PROFILE_STORAGE_KEY)).toBe(false);
      expect(store.has(TRACKING_STORAGE_KEY)).toBe(false);
      expect(store.has(WAITLIST_STORAGE_KEY)).toBe(false);
      expect(window.localStorage.getItem(PROFILE_STORAGE_KEY)).toBeNull();
      expect(window.location.hash).toBe("");
      expect(next.profile).toEqual({});
      expect(next.askedIds).toEqual([]);
      expect(next.reportOpen).toBe(false);
      expect(next.offerShown).toBe(false);
      expect(next.messages.some((m) => m.text === HE.chat.resume)).toBe(false);
      expect(next.messages.some((m) => m.summary)).toBe(false);
      expect(next.messages.some((m) => m.text === HE.chat.done)).toBe(false);
      expect(next.messages.some((m) => m.questionId === "degreeLevel")).toBe(true);
      expect(next.messages.some((m) => m.text === "איזה תואר?")).toBe(true);

      const after = renderToStaticMarkup(<ChatIntake />);
      expect(after).toContain("איזה תואר?");
      expect(after).toContain("תואר ראשון");
      expect(after).toContain("תואר שני");
      expect(after).not.toContain(HE.chat.resume);
      expect(after).not.toContain(HE.chat.startOver);
      expect(after).not.toContain(HE.buckets.eligible);
      expect(after).not.toContain(HE.chat.needInfoHuman);
    });
  });

  it("wires start over on chat and results without a confirm or privacy detour", () => {
    const chat = readFileSync(join(process.cwd(), "components/ChatIntake.tsx"), "utf8");
    expect(chat).toContain("startOverChatIntake");
    expect(chat).toContain("ChatStartOverButton");
    expect(chat).toContain("HE.chat.startOver");
    expect(chat).toContain("wipeStudentSession");
    expect(chat).not.toMatch(/saveProfile\(\s*\{\s*\}\s*\)/);
    expect(chat).not.toMatch(/window\.confirm|HE\.profile\.deleteConfirm/);
    expect(chat).not.toMatch(/\/privacy/);

    const results = readFileSync(join(process.cwd(), "components/ResultsView.tsx"), "utf8");
    expect(results).toContain("HE.chat.startOver");
    expect(results).toContain("wipeStudentSession");
    expect(results).not.toMatch(/window\.confirm|HE\.profile\.deleteConfirm/);
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

function withBrowserStorage(run: (store: Map<string, string>) => void): void {
  const store = new Map<string, string>();
  const location = {
    href: "https://example.test/chat/#p=abc",
    pathname: "/chat/",
    search: "",
    hash: "#p=abc",
  };
  const history = {
    state: null as unknown,
    replaceState(state: unknown, _title: string, url: string) {
      history.state = state;
      const next = new URL(url, "https://example.test");
      location.href = next.href;
      location.pathname = next.pathname;
      location.search = next.search;
      location.hash = next.hash;
    },
  };
  const localStorage = {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
    removeItem(key: string) {
      store.delete(key);
    },
  };
  const prev = (globalThis as { window?: unknown }).window;
  (globalThis as { window: unknown }).window = { localStorage, location, history };
  try {
    run(store);
  } finally {
    if (prev === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      (globalThis as { window: unknown }).window = prev;
    }
  }
}
