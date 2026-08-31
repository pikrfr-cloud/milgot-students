import {
  HOUSEHOLD_INCOME_BANDS,
  INCOME_BANDS,
  type HouseholdIncomeBand,
  type IncomeBand,
  type StudentProfile,
} from "./types";

/** Representative monthly ILS midpoint for each order-of-magnitude band. */
const BAND_MIDPOINT: Record<HouseholdIncomeBand, number> = {
  under_8k: 6_000,
  band_8_15k: 11_500,
  band_15_25k: 20_000,
  band_25_40k: 32_500,
  over_40k: 55_000,
};

/**
 * Approximate per-capita → catalog band. This is an internal estimate, not a
 * fund's official formula (mil-GO and deans use their own scales).
 */
export function perCapitaToBand(perCapita: number): IncomeBand {
  if (perCapita < 2_500) return "very_low";
  if (perCapita < 4_000) return "low";
  if (perCapita < 6_000) return "lower_middle";
  if (perCapita < 10_000) return "middle";
  return "high";
}

export function deriveIncomeBand(
  size: number | null | undefined,
  household: HouseholdIncomeBand | null | undefined,
): IncomeBand | null {
  if (!size || size < 1 || !household) return null;
  return perCapitaToBand(BAND_MIDPOINT[household] / size);
}

export function profileIncomeBand(profile: StudentProfile): IncomeBand | null {
  const derived = deriveIncomeBand(profile.householdSize, profile.householdIncomeBand);
  if (derived) return derived;
  return profile.incomeBand ?? null;
}

export function householdIncomeLabelHe(band: HouseholdIncomeBand): string {
  switch (band) {
    case "under_8k":
      return "עד 8,000 ₪ לחודש";
    case "band_8_15k":
      return "כ־8,000–15,000 ₪ לחודש";
    case "band_15_25k":
      return "כ־15,000–25,000 ₪ לחודש";
    case "band_25_40k":
      return "כ־25,000–40,000 ₪ לחודש";
    case "over_40k":
      return "מעל 40,000 ₪ לחודש";
  }
}

export const HOUSEHOLD_INCOME_HINT_HE =
  "לא שואלים סכום מדויק. בוחרים סדר גודל של הכנסת משק הבית ומספר הנפשות. המערכת מחשבת הכנסה לנפש כדי להתאים למלגות סיוע — זו הערכה פנימית, לא נוסחת הקרן. אפשר לדלג.";

export { HOUSEHOLD_INCOME_BANDS, INCOME_BANDS };
