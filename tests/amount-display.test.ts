import { describe, expect, it } from "vitest";
import { SCHOLARSHIPS } from "@/data/scholarships";
import { amountDisplay, whatsappScholarshipShareText, whatsappShareHref } from "@/lib/format";

describe("amountDisplay is number-first", () => {
  it("shows mil-GO as עד 12,480 ₪ without the kitchen paragraph", () => {
    const milGo = SCHOLARSHIPS.find((s) => s.id === "mil-go")!;
    const shown = amountDisplay(milGo.amounts);
    expect(shown.headlineHe).toBe("עד 12,480 ₪");
    expect(shown.noteHe).toBeUndefined();
    expect(shown.headlineHe).not.toMatch(/מדרגות|מה״ט|תשפ/);
    expect(milGo.amounts.textHe.length).toBeGreaterThan(80);
  });

  it("shows a single published number as-is", () => {
    expect(amountDisplay({ textHe: "15,000 ₪", minIls: 15000, maxIls: 15000 }).headlineHe).toBe(
      "15,000 ₪",
    );
  });

  it("translates Young Weizmann amount to Hebrew", () => {
    const rec = SCHOLARSHIPS.find((s) => s.id === "weizmann-young-scholars")!;
    expect(rec.amounts.textHe).toMatch(/15,000 ₪/);
    expect(rec.amounts.textHe).not.toMatch(/NIS|grant of/i);
    expect(amountDisplay(rec.amounts).headlineHe).toBe("15,000 ₪");
  });

  it("falls back to סכום משתנה when there is no number and a long caveat", () => {
    expect(
      amountDisplay({
        textHe: "משתנה לפי ועדת דיקן; סכום לא אומת כמספר אחיד בכל מסלול ובכל שנה",
        uncertain: true,
      }).headlineHe,
    ).toBe("סכום משתנה");
  });
});

describe("WhatsApp share line", () => {
  it("uses מלגת X, עד Y ₪, נסגרת ב-Z", () => {
    const text = whatsappScholarshipShareText({
      nameHe: "בדיקה",
      amounts: { textHe: "wall of caveats", minIls: 3000, maxIls: 12480 },
      deadline: { kind: "fixed", date: "2026-10-04", textHe: "4 באוקטובר" },
    });
    expect(text).toBe("מלגת בדיקה, עד 12,480 ₪, נסגרת ב-4 באוקטובר 2026");
    expect(whatsappShareHref(text)).toMatch(/^https:\/\/wa\.me\/\?text=/);
  });
});
