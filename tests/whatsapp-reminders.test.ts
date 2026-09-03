import { describe, expect, it, beforeEach } from "vitest";
import { amount, deadline } from "@/data/scholarships/helpers";
import { HE } from "@/lib/i18n/he";
import { sharedResultsUrl } from "@/lib/profile-share";
import type { Scholarship, StudentProfile } from "@/lib/types";
import {
  isReminderStopCommand,
  isReminderSubscribeCommand,
  reminderCandidatesFromProfile,
  reminderDayForDeadline,
  reminderMessageHe,
  shouldSendReminder,
} from "@/lib/whatsapp-reminders";
import { handleInbound } from "@/whatsapp/src/handler";
import { memoryKv, getSubscription } from "@/whatsapp/src/reminders-kv";
import { runReminderCron } from "@/whatsapp/src/scheduled";
import { resetSessionStore } from "@/whatsapp/src/session";

const FROM = "whatsapp:+972501234567";
const AS_OF = new Date("2026-09-01T12:00:00+03:00");

/** Profile with at least one matcher-eligible catalog row that has deadline.date. */
const DATED_ELIGIBLE_PROFILE: StudentProfile = {
  institution: "technion",
  degreeLevel: "ma",
  yearOfStudy: 1,
  fieldOfStudy: "engineering",
  cityOfResidence: "חיפה",
  service: "idf",
  willingToVolunteer: true,
};

function fakeScholarship(
  partial: Partial<Scholarship> & Pick<Scholarship, "id" | "deadline">,
): Scholarship {
  return {
    nameHe: partial.nameHe ?? partial.id,
    funderHe: "קרן",
    types: ["need"],
    scope: "national",
    cadence: "annual",
    amounts: amount("משתנה", { uncertain: true }),
    whoItsForHe: "x",
    documentsHe: ["צילום תעודת זהות"],
    howToApplyHe: "x",
    lastVerified: "2026-09-01",
    sourceUrls: ["https://example.ac.il/page/x"],
    eligibility: { type: "degreeLevelIn", values: ["ba"] },
    ...partial,
  };
}

async function finishReport(env?: { REMINDERS: ReturnType<typeof memoryKv> }) {
  await handleInbound({ from: FROM, body: "התחלה" }, { asOf: AS_OF, env });
  await handleInbound({ from: FROM, body: "1" }, { asOf: AS_OF, env });
  await handleInbound({ from: FROM, body: "2" }, { asOf: AS_OF, env });
  await handleInbound({ from: FROM, body: "שדרות" }, { asOf: AS_OF, env });
  await handleInbound({ from: FROM, body: "1" }, { asOf: AS_OF, env });
  return handleInbound({ from: FROM, body: "דוח" }, { asOf: AS_OF, env });
}

beforeEach(() => {
  resetSessionStore();
});

describe("reminder commands", () => {
  it("recognizes תזכורת and הפסק / stop", () => {
    expect(isReminderSubscribeCommand("תזכורת")).toBe(true);
    expect(isReminderSubscribeCommand("  תזכורת  ")).toBe(true);
    expect(isReminderSubscribeCommand("תזכורת\nhttps://example.com/results/#p=abc")).toBe(true);
    expect(isReminderStopCommand("הפסק")).toBe(true);
    expect(isReminderStopCommand("STOP")).toBe(true);
    expect(isReminderStopCommand(" stop ")).toBe(true);
    expect(isReminderStopCommand("unstop")).toBe(false);
    expect(isReminderSubscribeCommand("דוח")).toBe(false);
  });
});

describe("reminder day = deadline.date minus 7 Asia/Jerusalem days", () => {
  it("sends only on that Jerusalem calendar day", () => {
    expect(reminderDayForDeadline("2026-10-15")).toBe("2026-10-08");

    // 04:00 UTC on 8 Oct 2026 = 07:00 IDT — reminder morning.
    const onDay = new Date("2026-10-08T04:00:00Z");
    expect(shouldSendReminder({ deadlineDate: "2026-10-15", now: onDay })).toBe(true);

    // Same UTC calendar day as 7 Oct, but already 8 Oct in Jerusalem (00:30 IDT).
    const jerusalemAlreadyEighth = new Date("2026-10-07T21:30:00Z");
    expect(shouldSendReminder({ deadlineDate: "2026-10-15", now: jerusalemAlreadyEighth })).toBe(true);

    // Still 7 Oct in Jerusalem (23:00 IDT).
    const jerusalemStillSeventh = new Date("2026-10-07T20:00:00Z");
    expect(shouldSendReminder({ deadlineDate: "2026-10-15", now: jerusalemStillSeventh })).toBe(false);

    expect(shouldSendReminder({ deadlineDate: "2026-10-15", now: new Date("2026-10-07T04:00:00Z") })).toBe(
      false,
    );
    expect(shouldSendReminder({ deadlineDate: "2026-10-15", now: new Date("2026-10-09T04:00:00Z") })).toBe(
      false,
    );
  });

  it("does not send scholarships without deadline.date", () => {
    const now = new Date("2026-10-08T04:00:00Z");
    expect(shouldSendReminder({ deadlineDate: undefined, now })).toBe(false);
    expect(shouldSendReminder({ deadlineDate: "2026-10", now })).toBe(false);
    expect(shouldSendReminder({ deadlineDate: "נובמבר", now })).toBe(false);

    const dated = fakeScholarship({
      id: "with-date",
      nameHe: "עם תאריך",
      deadline: deadline("15.10.2026", { date: "2026-10-15" }),
    });
    const undated = fakeScholarship({
      id: "no-date",
      nameHe: "בלי תאריך",
      deadline: deadline("חלון שנתי", { opensAt: "2026-09-01" }),
    });
    const profile: StudentProfile = { degreeLevel: "ba" };
    const items = reminderCandidatesFromProfile(profile, now, [dated, undated]);
    expect(items.map((i) => i.id)).toEqual(["with-date"]);
    expect(items.every((i) => i.deadlineDate === "2026-10-15")).toBe(true);
  });
});

describe("תזכורת after a report", () => {
  it("registers a subscription for eligible scholarships that have deadline.date", async () => {
    const kv = memoryKv();
    const env = { REMINDERS: kv };
    await finishReport(env);

    const reportUrl = sharedResultsUrl(DATED_ELIGIBLE_PROFILE);
    const subscribed = await handleInbound(
      { from: FROM, body: `תזכורת\n${reportUrl}` },
      { asOf: AS_OF, env },
    );
    expect(subscribed.xml).toContain(HE.whatsapp.reminderSubscribed);

    const expected = reminderCandidatesFromProfile(DATED_ELIGIBLE_PROFILE, AS_OF);
    expect(expected.length).toBeGreaterThan(0);
    expect(expected.every((i) => /^\d{4}-\d{2}-\d{2}$/.test(i.deadlineDate))).toBe(true);

    const sub = await getSubscription(kv, FROM);
    expect(sub?.from).toBe(FROM);
    expect(sub?.items.map((i) => i.id).sort()).toEqual(expected.map((i) => i.id).sort());
    expect(sub?.items.every((i) => /^\d{4}-\d{2}-\d{2}$/.test(i.deadlineDate))).toBe(true);
  });

  it("does not subscribe before a report", async () => {
    const kv = memoryKv();
    const env = { REMINDERS: kv };
    await handleInbound({ from: FROM, body: "התחלה" }, { asOf: AS_OF, env });
    const res = await handleInbound({ from: FROM, body: "תזכורת" }, { asOf: AS_OF, env });
    expect(res.xml).toContain(HE.whatsapp.reminderNeedReport);
    expect(await getSubscription(kv, FROM)).toBeNull();
  });
});

describe("הפסק / stop cancels so cron sends nothing", () => {
  it("unsubscribes without wiping the questionnaire", async () => {
    const kv = memoryKv();
    const env = { REMINDERS: kv };

    await handleInbound({ from: FROM, body: "התחלה" }, { asOf: AS_OF, env });
    await handleInbound({ from: FROM, body: "1" }, { asOf: AS_OF, env });
    const stopMid = await handleInbound({ from: FROM, body: "stop" }, { asOf: AS_OF, env });
    expect(stopMid.xml).toContain(HE.whatsapp.reminderStopped);
    const next = await handleInbound({ from: FROM, body: "2" }, { asOf: AS_OF, env });
    expect(next.xml).toContain("באיזו עיר");

    resetSessionStore();
    await finishReport(env);
    await handleInbound(
      { from: FROM, body: `תזכורת\n${sharedResultsUrl(DATED_ELIGIBLE_PROFILE)}` },
      { asOf: AS_OF, env },
    );
    expect(await getSubscription(kv, FROM)).not.toBeNull();

    const hpask = await handleInbound({ from: FROM, body: "הפסק" }, { asOf: AS_OF, env });
    expect(hpask.xml).toContain(HE.whatsapp.reminderStopped);
    expect(await getSubscription(kv, FROM)).toBeNull();

    const sent: string[] = [];
    const cron = await runReminderCron({
      env,
      now: new Date("2026-10-08T04:00:00Z"),
      send: async ({ body }) => {
        sent.push(body);
        return true;
      },
    });
    expect(cron.sent).toBe(0);
    expect(sent).toEqual([]);
  });
});

describe("cron send + dedup", () => {
  it("sends on the reminder day, skips other days, never sends undated, dedups", async () => {
    const kv = memoryKv();
    const itemDated = {
      id: "with-date",
      nameHe: "עם תאריך",
      deadlineDate: "2026-10-15",
    };
    await kv.put(
      `sub:${FROM}`,
      JSON.stringify({ from: FROM, items: [itemDated] }),
    );

    const sent: string[] = [];
    const send = async ({ body }: { body: string }) => {
      sent.push(body);
      return true;
    };

    const otherDay = await runReminderCron({
      env: { REMINDERS: kv },
      now: new Date("2026-10-01T04:00:00Z"),
      send,
    });
    expect(otherDay.sent).toBe(0);
    expect(sent).toEqual([]);

    const onDay = await runReminderCron({
      env: { REMINDERS: kv },
      now: new Date("2026-10-08T04:00:00Z"),
      send,
    });
    expect(onDay.sent).toBe(1);
    expect(sent).toEqual([reminderMessageHe("עם תאריך", "2026-10-15")]);
    expect(sent[0]).not.toContain("₪");

    sent.length = 0;
    const again = await runReminderCron({
      env: { REMINDERS: kv },
      now: new Date("2026-10-08T04:00:00Z"),
      send,
    });
    expect(again.sent).toBe(0);
    expect(sent).toEqual([]);
  });
});
