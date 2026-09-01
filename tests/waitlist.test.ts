import { describe, expect, it } from "vitest";
import { isPlausibleEmail, parseWaitlist } from "@/lib/waitlist";

describe("waitlist local-only", () => {
  it("rejects missing consent and does not invent a send", () => {
    expect(parseWaitlist({ email: "a@b.co", consent: false, savedAt: "2026-09-01T00:00:00Z" })).toBeNull();
    expect(parseWaitlist({ email: "a@b.co", consent: true, savedAt: "2026-09-01T00:00:00Z" })).toEqual({
      email: "a@b.co",
      consent: true,
      savedAt: "2026-09-01T00:00:00Z",
    });
  });

  it("requires a plausible email", () => {
    expect(isPlausibleEmail("not-an-email")).toBe(false);
    expect(isPlausibleEmail("student@example.com")).toBe(true);
  });
});
