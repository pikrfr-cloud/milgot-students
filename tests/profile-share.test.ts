import { describe, expect, it } from "vitest";
import { SCHOLARSHIPS } from "@/data/scholarships";
import { matchAll } from "@/lib/matcher";
import {
  compactStudentProfile,
  decodeSharedProfile,
  encodeSharedProfile,
  hydrateSharedProfileFromLocation,
  loadProfileHydratingShare,
  mergeUrlSeedWithStored,
  readChatSeedFromLocation,
  sharedResultsUrl,
} from "@/lib/profile-share";
import { loadProfile, saveProfile } from "@/lib/profile-storage";
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

describe("results hydrate treats #p= as authoritative", () => {
  const AS_OF = new Date("2026-09-01T12:00:00+03:00");

  it("replaces stored institution A + gender male with shared institution B only", () => {
    withResultsWindow((location) => {
      saveProfile({ institution: "tau", gender: "male" });
      expect(loadProfile()).toEqual({ institution: "tau", gender: "male" });

      const shared: StudentProfile = { institution: "technion" };
      const encoded = encodeSharedProfile(shared);
      if (!encoded) throw new Error("expected shared payload");
      location.href = `https://example.test/results/#p=${encoded}`;
      location.pathname = "/results/";
      location.search = "";
      location.hash = `#p=${encoded}`;

      const hydrated = loadProfileHydratingShare();
      expect(hydrated.institution).toBe("technion");
      expect(hydrated.gender).toBeUndefined();
      expect(hydrated).not.toHaveProperty("gender");
      expect(Object.keys(hydrated).sort()).toEqual(["institution"]);
      expect(hydrated).toEqual(compactStudentProfile(shared));
      expect(loadProfile()).toEqual(hydrated);

      const fromHydrate = matchAll(SCHOLARSHIPS, hydrated, { asOf: AS_OF });
      const fromSharedAlone = matchAll(SCHOLARSHIPS, shared, { asOf: AS_OF });
      expect(fromHydrate.map((m) => [m.scholarship.id, m.bucket])).toEqual(
        fromSharedAlone.map((m) => [m.scholarship.id, m.bucket]),
      );
    });
  });

  it("still merges ?institution= / ?city= landing seeds without #p=", () => {
    withResultsWindow((location) => {
      saveProfile({ institution: "tau", gender: "male" });
      location.href = "https://example.test/chat/?institution=technion";
      location.pathname = "/chat/";
      location.search = "?institution=technion";
      location.hash = "";

      const hydrated = hydrateSharedProfileFromLocation();
      expect(hydrated).toEqual({ institution: "technion", gender: "male" });
      expect(loadProfile()).toEqual({ institution: "technion", gender: "male" });
    });
  });
});

function withResultsWindow(
  run: (location: { href: string; pathname: string; search: string; hash: string }) => void,
): void {
  const store = new Map<string, string>();
  const location = {
    href: "https://example.test/results/",
    pathname: "/results/",
    search: "",
    hash: "",
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
    run(location);
  } finally {
    if (prev === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      (globalThis as { window: unknown }).window = prev;
    }
  }
}
