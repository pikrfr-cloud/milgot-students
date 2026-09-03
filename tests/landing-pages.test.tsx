import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CatalogLandingPage } from "@/components/CatalogLandingPage";
import { amount, deadline } from "@/data/scholarships/helpers";
import { SCHOLARSHIPS } from "@/data/scholarships";
import { decodeSharedProfile } from "@/lib/profile-share";
import { HE } from "@/lib/i18n/he";
import {
  cityLandingTitleHe,
  institutionLanding,
  institutionLandingTitleHe,
  landingIntroHe,
  MIN_LANDING_SCHOLARSHIPS,
  nearestKnownDeadlineIso,
  publishedAmountRange,
  qualifyingCollectionLandings,
  sectorLanding,
  sectorLandingTitleHe,
  TASHPAZ_HE,
  UNCERTAIN_HE,
} from "@/lib/landing-pages";
import type { Scholarship } from "@/lib/types";

function row(partial: Partial<Scholarship> & Pick<Scholarship, "id" | "nameHe">): Scholarship {
  return {
    funderHe: "קרן",
    types: ["need"],
    scope: "national",
    cadence: "annual",
    amounts: amount("משתנה", { uncertain: true }),
    deadline: deadline("מועד טרם פורסם", { kind: "varies", uncertain: true }),
    whoItsForHe: "בדיקה",
    documentsHe: ["מסמך"],
    howToApplyHe: "הגשה",
    lastVerified: "2026-09-02",
    sourceUrls: ["https://example.org/page"],
    eligibility: { type: "degreeLevelIn", values: ["ba"] },
    ...partial,
  };
}

describe("collection landing titles and intros", () => {
  it("uses the required תשפ״ז H1 shapes", () => {
    expect(cityLandingTitleHe("חיפה")).toBe(`מלגות לסטודנטים בחיפה ${TASHPAZ_HE}`);
    expect(institutionLandingTitleHe("המכללה האקדמית אחוה")).toBe(
      `מלגות להמכללה האקדמית אחוה ${TASHPAZ_HE}`,
    );
    expect(sectorLandingTitleHe("arab")).toBe(`מלגות לערבים ${TASHPAZ_HE}`);
  });

  it("builds intro from published amounts and known deadlines only", () => {
    const asOf = new Date("2026-09-03T12:00:00Z");
    const list = [
      row({
        id: "a",
        nameHe: "א",
        amounts: amount("5,000 ₪", { min: 5000, max: 5000 }),
        deadline: deadline("1 באוקטובר", { date: "2026-10-01" }),
      }),
      row({
        id: "b",
        nameHe: "ב",
        amounts: amount("12,000 ₪", { min: 8000, max: 12000 }),
        deadline: deadline("15 בספטמבר", { date: "2026-09-15" }),
      }),
      row({
        id: "c",
        nameHe: "ג",
        amounts: amount("לא פורסם", { uncertain: true }),
      }),
    ];
    const range = publishedAmountRange(list);
    expect(range).toEqual({ min: 5000, max: 12000 });
    expect(nearestKnownDeadlineIso(list, asOf)).toBe("2026-09-15");
    const intro = landingIntroHe(list, asOf);
    expect(intro).toContain("3 מלגות");
    expect(intro).toContain("5,000 ₪");
    expect(intro).toContain("12,000 ₪");
    expect(intro).toContain("15 בספטמבר 2026");
    expect(intro).not.toMatch(/2026-09-15/);
  });

  it("says לא ודאי when no published amount or date exists", () => {
    const intro = landingIntroHe([row({ id: "x", nameHe: "בלי מספר" })]);
    expect(intro).toContain(UNCERTAIN_HE);
    expect(intro).toMatch(/הסכומים לא ודאי/);
    expect(intro).toMatch(/המועד לא ודאי/);
    expect(publishedAmountRange([row({ id: "x", nameHe: "בלי מספר" })])).toBeNull();
    expect(nearestKnownDeadlineIso([row({ id: "x", nameHe: "בלי מספר" })])).toBeNull();
  });

  it("ships at least 15 unique city/institution/sector landings with two or more scholarships", () => {
    const landings = qualifyingCollectionLandings();
    expect(landings.length).toBeGreaterThanOrEqual(15);
    const titles = landings.map((l) => l.titleHe);
    expect(new Set(titles).size).toBe(titles.length);
    for (const landing of landings) {
      expect(landing.scholarships.length).toBeGreaterThanOrEqual(MIN_LANDING_SCHOLARSHIPS);
      expect(landing.titleHe).toContain(TASHPAZ_HE);
      expect(landing.introHe.length).toBeGreaterThan(20);
      expect(landing.chatHref.startsWith("/chat/")).toBe(true);
    }
  });

  it("pre-filters chat with institution and city query params ChatIntake already hydrates", () => {
    const tau = institutionLanding("tau");
    expect(tau).toBeTruthy();
    expect(tau!.chatHref).toBe("/chat/?institution=tau");
    const cityLandingRow = qualifyingCollectionLandings().find((l) => l.kind === "city");
    expect(cityLandingRow?.chatHref.startsWith("/chat/?city=")).toBe(true);
    const sector = sectorLanding("haredi");
    expect(sector.chatHref).toContain("/chat/#p=");
    const payload = sector.chatHref.split("#p=")[1];
    expect(decodeSharedProfile(payload!)).toEqual({ sectors: ["haredi"] });
  });

  it("renders H1, intro, scholarship cards, and the chat CTA", () => {
    const landing = qualifyingCollectionLandings().find((l) => l.kind === "city");
    expect(landing).toBeTruthy();
    const html = renderToStaticMarkup(<CatalogLandingPage landing={landing!} />);
    expect(html).toContain(landing!.titleHe);
    expect(html).toContain(landing!.introHe);
    expect(html).toContain(HE.actions.chatIntake);
    expect(html).toContain("בדקו מה מתאים לכם");
    expect(html).toMatch(/href="\/chat\/?\?city=/);
    for (const s of landing!.scholarships) {
      expect(html).toContain(s.nameHe);
    }
    expect(html).not.toMatch(/ח\.פ|פיקרפר|תשלום|וואטסאפ עסקי/);
  });
});

describe("live catalog landings stay honest", () => {
  it("does not invent amounts or dates in intros", () => {
    for (const landing of qualifyingCollectionLandings()) {
      const range = publishedAmountRange(landing.scholarships);
      if (!range) {
        expect(landing.introHe).toContain(`הסכומים ${UNCERTAIN_HE}`);
      } else {
        expect(landing.introHe).not.toMatch(/הסכומים לא ודאי/);
      }
      const nearest = nearestKnownDeadlineIso(landing.scholarships);
      if (!nearest) {
        expect(landing.introHe).toContain(`המועד ${UNCERTAIN_HE}`);
      }
      for (const s of landing.scholarships) {
        expect(SCHOLARSHIPS.some((row) => row.id === s.id)).toBe(true);
      }
    }
  });
});
