import { describe, expect, it } from "vitest";
import { MATCHABLE_SCHOLARSHIPS, SCHOLARSHIPS } from "@/data/scholarships";
import {
  amountDateGateReason,
  countsTowardAmountDateGate,
  matchableWithAmountAndDate,
} from "@/lib/catalog";

describe("matchable-with-amount-and-date gate", () => {
  it("counts only matchable records that have numeric ILS and a dated תשפ״ז deadline", () => {
    const counted = matchableWithAmountAndDate(SCHOLARSHIPS);
    expect(counted.every((s) => countsTowardAmountDateGate(s, SCHOLARSHIPS))).toBe(true);
    expect(counted.every((s) => MATCHABLE_SCHOLARSHIPS.some((m) => m.id === s.id))).toBe(true);
    for (const s of counted) {
      expect(s.amounts.uncertain, s.id).toBeFalsy();
      expect(s.deadline.uncertain, s.id).toBeFalsy();
      expect(s.deadline.kind, s.id).not.toBe("varies");
    }
  });

  it("does not count מדריך shells, תשפ״ו unpublished amounts, or applyUrl clones", () => {
    expect(amountDateGateReason(SCHOLARSHIPS.find((s) => s.id === "ono-dean")!)).toBe("guide");
    expect(amountDateGateReason(SCHOLARSHIPS.find((s) => s.id === "gruss")!)).toBe("amount-uncertain");
    expect(amountDateGateReason(SCHOLARSHIPS.find((s) => s.id === "yeud-45")!)).toBe("amount-uncertain");
    expect(amountDateGateReason(SCHOLARSHIPS.find((s) => s.id === "perach")!)).toBe("deadline-uncertain");
    expect(amountDateGateReason(SCHOLARSHIPS.find((s) => s.id === "openu-financial-aid")!)).toBe(
      "no-numeric-ils",
    );
    expect(amountDateGateReason(SCHOLARSHIPS.find((s) => s.id === "weizmann-graduate")!)).toBe(
      "no-concrete-2026-date",
    );
    expect(amountDateGateReason(SCHOLARSHIPS.find((s) => s.id === "irtikaa")!)).toBe("yes");
    expect(amountDateGateReason(SCHOLARSHIPS.find((s) => s.id === "mil-go")!)).toBe("yes");
  });

  it("reports the honest counted total (do not raise this until records actually qualify)", () => {
    const counted = matchableWithAmountAndDate(SCHOLARSHIPS);
    expect(counted.map((s) => s.id).sort()).toEqual([
      "adams-fellowship",
      "biu-hibur-israeli",
      "biu-isef-phd",
      "biu-jewish-phd-dean",
      "biu-president-phd",
      "biu-rotenstreich",
      "che-ma-data-science",
      "che-ma-diversity",
      "che-ma-women-hightech",
      "che-phd-agriculture",
      "che-phd-data-science",
      "che-phd-diversity",
      "che-phd-economics",
      "che-phd-quantum",
      "che-phd-women-hightech",
      "che-rotenstreich",
      "clore-fellowship",
      "emek-yizrael-community",
      "galil-elion-council",
      "haifa-miluim-first-year",
      "heseg-leadership",
      "hevel-modiin-community",
      "hevel-yavne-pais",
      "hillel-yotzim",
      "hof-hasharon-community",
      "holon-hit-payis",
      "huji-kolodny-ba",
      "irgun-jeckes",
      "irtikaa",
      "isef-recanati-6000",
      "leviathan-scholarship",
      "loewenstein-iron-swords",
      "mate-binyamin-community",
      "mil-go",
      "moshal",
      "openu-1000-scholarships",
      "poalim-lehatzlacha",
      "raanana-community",
      "ramat-hasharon-community",
      "ramat-negev-community",
      "ramat-negev-residency",
      "reichman-golani-omer",
      "rishon-muni",
      "rosh-haayin-community",
      "rosh-haayin-students",
      "rothschild-baroness-phd",
      "schulich-leaders",
      "shenkar-aid",
      "shomron-pais",
      "tau-azrieli-fellows",
      "tau-bubis",
      "tau-diaspora-phd",
      "tau-liber-phd",
      "tau-president-orphanhood",
      "vanleer-journeys",
      "weizmann-young-scholars",
      "zvulun-pais",
    ]);
    expect(counted.length).toBe(57);
    expect(counted.length).toBeLessThan(60);
    expect(counted.length).toBe(matchableWithAmountAndDate(MATCHABLE_SCHOLARSHIPS).length);
  });
});
