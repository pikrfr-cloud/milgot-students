/** @vitest-environment jsdom */

import { afterEach, describe, expect, it } from "vitest";
import {
  compactStudentProfile,
  decodeSharedProfile,
  decodeSharedProfileFromUrl,
  encodeSharedProfile,
  hydrateSharedProfileFromLocation,
  loadProfileHydratingShare,
  sharedResultsUrl,
} from "@/lib/profile-share";
import { parseStudentProfile } from "@/lib/profile-schema";
import { PROFILE_STORAGE_KEY, loadProfile, saveProfile } from "@/lib/profile-storage";
import { WHATSAPP_RESULTS_URL, buildWhatsAppReport } from "@/lib/whatsapp-report";
import { HE } from "@/lib/i18n/he";
import type { StudentProfile } from "@/lib/types";

const FIXTURE: StudentProfile = {
  institution: "tau",
  degreeLevel: "ba",
  cityOfResidence: "שדרות",
  neighborhood: null,
  yearOfStudy: 1,
  service: "idf",
  willingToVolunteer: true,
  sectors: [],
};

const COMPACT: StudentProfile = {
  institution: "tau",
  degreeLevel: "ba",
  cityOfResidence: "שדרות",
  yearOfStudy: 1,
  service: "idf",
  willingToVolunteer: true,
};

afterEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
});

describe("encode / decode shared profile", () => {
  it("round-trips a fixture through base64url JSON and parseStudentProfile", () => {
    expect(compactStudentProfile(FIXTURE)).toEqual(COMPACT);
    const encoded = encodeSharedProfile(FIXTURE);
    expect(encoded).toBeTruthy();
    expect(encoded).not.toMatch(/[+/=]/);
    const decoded = decodeSharedProfile(encoded!);
    expect(decoded).toEqual(COMPACT);
    expect(parseStudentProfile(decoded)).toEqual(COMPACT);
    expect(decoded?.cityOfResidence).toBe("שדרות");
    expect(decoded).not.toHaveProperty("neighborhood");
    expect(decoded).not.toHaveProperty("sectors");
  });

  it("rejects garbage, empty, and schema-invalid payloads", () => {
    expect(decodeSharedProfile("")).toBeNull();
    expect(decodeSharedProfile("%%%not-base64%%%")).toBeNull();
    expect(decodeSharedProfile("not-valid")).toBeNull();
    expect(decodeSharedProfile(btoa("hello").replace(/=+$/g, ""))).toBeNull();
    expect(decodeSharedProfile(btoa("[]").replace(/=+$/g, ""))).toBeNull();
    expect(decodeSharedProfile(btoa("{}").replace(/=+$/g, ""))).toBeNull();
    expect(decodeSharedProfile(btoa(JSON.stringify({ institution: null })).replace(/=+$/g, ""))).toBeNull();
    expect(
      decodeSharedProfile(btoa(JSON.stringify({ degreeLevel: "not-a-level" })).replace(/=+$/g, "")),
    ).toBeNull();
    expect(
      decodeSharedProfile(
        btoa(JSON.stringify({ schemaVersion: 2, profile: { institution: "tau" } })).replace(/=+$/g, ""),
      ),
    ).toBeNull();
    expect(encodeSharedProfile({})).toBeNull();
    expect(encodeSharedProfile({ institution: null, sectors: [] })).toBeNull();
  });
});

describe("WhatsApp report URL", () => {
  it("points at /results/ with a payload the hydrator can read", () => {
    const report = buildWhatsAppReport(FIXTURE, { asOf: new Date("2026-09-01T12:00:00+03:00") });
    const url = sharedResultsUrl(FIXTURE);
    expect(url.startsWith(WHATSAPP_RESULTS_URL)).toBe(true);
    expect(url).toContain("/results/");
    expect(url).toContain("#p=");
    expect(url).not.toContain("/chat/");
    expect(report.text).toContain(url);
    expect(report.text).toContain(HE.whatsapp.fullReportLink);
    expect(HE.whatsapp.fullReportLink).toBe("הדוח המלא באתר:");
    expect(HE.whatsapp.fullReportHint).toBe(
      "לחצו כדי לראות את הדוח עם התשובות שנתתם — בלי שם ובלי טלפון.",
    );
    expect(report.text).toContain(HE.whatsapp.fullReportHint);
    expect(`${HE.whatsapp.fullReportLink} ${HE.whatsapp.fullReportHint}`).not.toMatch(
      /hash|localStorage|webhook|#p=|קידוד|שרת/i,
    );
    expect(decodeSharedProfileFromUrl(url)).toEqual(COMPACT);
    expect(report.text.length).toBeLessThan(3500);
  });
});

describe("hydrateSharedProfileFromLocation", () => {
  it("saves a valid hash payload and strips it from the address bar", () => {
    const encoded = encodeSharedProfile(FIXTURE);
    expect(encoded).toBeTruthy();
    window.history.replaceState(null, "", `/milgot-students/results/#p=${encoded}`);
    expect(window.location.hash).toContain("p=");

    const hydrated = hydrateSharedProfileFromLocation();
    expect(hydrated).toEqual(COMPACT);
    expect(loadProfile()).toEqual(COMPACT);
    expect(window.localStorage.getItem(PROFILE_STORAGE_KEY)).toContain("tau");
    expect(window.location.hash).toBe("");
    expect(window.location.href).not.toContain(encoded);
    expect(window.location.pathname).toBe("/milgot-students/results/");
  });

  it("also accepts ?p= and strips the query after save", () => {
    const encoded = encodeSharedProfile(FIXTURE);
    window.history.replaceState(null, "", `/milgot-students/chat/?p=${encoded}`);
    expect(loadProfileHydratingShare()).toEqual(COMPACT);
    expect(window.location.search).not.toContain("p=");
    expect(window.location.pathname).toBe("/milgot-students/chat/");
  });

  it("does not wipe an existing profile when the payload is invalid", () => {
    saveProfile({ institution: "haifa", degreeLevel: "ma" });
    window.history.replaceState(null, "", "/milgot-students/results/#p=not-valid-payload");
    expect(hydrateSharedProfileFromLocation()).toBeNull();
    expect(loadProfile()).toMatchObject({ institution: "haifa", degreeLevel: "ma" });

    const emptyPayload = btoa("{}").replace(/=+$/g, "");
    window.history.replaceState(null, "", `/milgot-students/results/#p=${emptyPayload}`);
    expect(hydrateSharedProfileFromLocation()).toBeNull();
    expect(loadProfile()).toMatchObject({ institution: "haifa", degreeLevel: "ma" });

    expect(loadProfileHydratingShare()).toMatchObject({ institution: "haifa", degreeLevel: "ma" });
  });
});
