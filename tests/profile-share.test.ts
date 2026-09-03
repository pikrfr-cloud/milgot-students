import { describe, expect, it } from "vitest";
import {
  decodeSharedProfile,
  encodeSharedProfile,
  mergeUrlSeedWithStored,
  readChatSeedFromLocation,
  sharedResultsUrl,
} from "@/lib/profile-share";
import type { StudentProfile } from "@/lib/types";

describe("shared profile hash", () => {
  it("round-trips filled keys only", () => {
    const encoded = encodeSharedProfile({ institution: "tau", degreeLevel: "ba" });
    expect(encoded).toBeTruthy();
    expect(decodeSharedProfile(encoded!)).toEqual({ institution: "tau", degreeLevel: "ba" });
  });

  it("puts the payload in the hash so GitHub Pages never sees it", () => {
    const url = sharedResultsUrl({ institution: "bgu" });
    expect(url).toContain("/results/#p=");
    expect(url).not.toContain("?p=");
  });
});

describe("chat landing seed hydrate", () => {
  it("reads ?institution= and ?city= without a second encoding", () => {
    expect(readChatSeedFromLocation({ hash: "", search: "?institution=tau" })).toEqual({
      institution: "tau",
    });
    expect(readChatSeedFromLocation({ hash: "", search: "?city=%D7%97%D7%99%D7%A4%D7%94" })).toEqual({
      cityOfResidence: "חיפה",
    });
    expect(readChatSeedFromLocation({ hash: "", search: "?institution=not-a-school" })).toBeNull();
    expect(readChatSeedFromLocation({ hash: "", search: "" })).toBeNull();
  });

  it("merges a URL seed onto a filled profile and ignores empty hydrate", () => {
    const stored: StudentProfile = { degreeLevel: "ba", cityOfResidence: "חיפה" };
    expect(mergeUrlSeedWithStored(stored, { institution: "tau" })).toEqual({
      degreeLevel: "ba",
      cityOfResidence: "חיפה",
      institution: "tau",
    });
    expect(mergeUrlSeedWithStored(stored, null)).toEqual(stored);
    expect(mergeUrlSeedWithStored(stored, {})).toEqual(stored);
  });
});


describe("shared profile hash", () => {
  it("round-trips filled keys only", () => {
    const encoded = encodeSharedProfile({ institution: "tau", degreeLevel: "ba" });
    expect(encoded).toBeTruthy();
    expect(decodeSharedProfile(encoded!)).toEqual({ institution: "tau", degreeLevel: "ba" });
  });

  it("puts the payload in the hash so GitHub Pages never sees it", () => {
    const url = sharedResultsUrl({ institution: "bgu" });
    expect(url).toContain("/results/#p=");
    expect(url).not.toContain("?p=");
  });
});
