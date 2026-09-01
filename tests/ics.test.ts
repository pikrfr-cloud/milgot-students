import { describe, expect, it } from "vitest";
import { deadlineToIcs, foldIcsLine } from "@/lib/ics";
import { SCHOLARSHIPS } from "@/data/scholarships";

describe("ICS RFC 5545", () => {
  it("folds lines over 75 bytes and uses CRLF, DTEND, METHOD, current DTSTAMP", () => {
    const s = SCHOLARSHIPS.find((x) => x.deadline.date) ?? SCHOLARSHIPS[0];
    const now = new Date("2026-09-01T08:15:30Z");
    const body = deadlineToIcs(s, s.deadline, now);
    expect(body).toBeTruthy();
    expect(body!.endsWith("\r\n")).toBe(true);
    expect(body).toContain("METHOD:PUBLISH");
    expect(body).toContain("DTEND;VALUE=DATE:");
    expect(body).toContain("DTSTAMP:20260901T081530Z");
    for (const raw of body!.split("\r\n").filter(Boolean)) {
      expect(new TextEncoder().encode(raw).length).toBeLessThanOrEqual(75);
    }
  });

  it("foldIcsLine wraps at 75 octets", () => {
    const long = `SUMMARY:${"א".repeat(80)}`;
    const folded = foldIcsLine(long);
    expect(folded).toContain("\r\n ");
    for (const part of folded.split("\r\n")) {
      expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
    }
  });
});
