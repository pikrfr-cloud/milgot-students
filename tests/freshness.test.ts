import { describe, expect, it } from "vitest";
import { deadline } from "@/data/scholarships/helpers";
import {
  isVerificationStale,
  publicDeadlineLabelHe,
  STALE_VERIFICATION_LABEL_HE,
} from "@/lib/format";

const asOf = new Date("2026-09-01T12:00:00+03:00");
const openDeadline = deadline("פתוח", { date: "2026-10-15" });

describe("90-day stale verification label", () => {
  it("marks lastVerified older than 90 days as stale", () => {
    expect(isVerificationStale("2026-05-01", asOf)).toBe(true);
    expect(isVerificationStale("2026-05", asOf)).toBe(true);
    expect(STALE_VERIFICATION_LABEL_HE).toBe("לא אומת לאחרונה");
  });

  it("does not mark a recent lastVerified as stale", () => {
    expect(isVerificationStale("2026-08-01", asOf)).toBe(false);
    expect(isVerificationStale("2026-09-01", asOf)).toBe(false);
  });

  it("does not label a stale open record as «פתוח להגשה»", () => {
    const stale = publicDeadlineLabelHe(openDeadline, "2026-05-01", asOf);
    expect(stale).not.toBe("פתוח להגשה");
    expect(stale).not.toContain("פתוח להגשה");
    const fresh = publicDeadlineLabelHe(openDeadline, "2026-09-01", asOf);
    expect(fresh).toBe("פתוח להגשה");
  });
});
