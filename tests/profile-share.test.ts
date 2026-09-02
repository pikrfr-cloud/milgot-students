import { describe, expect, it } from "vitest";
import {
  decodeSharedProfile,
  encodeSharedProfile,
  sharedResultsUrl,
} from "@/lib/profile-share";

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
