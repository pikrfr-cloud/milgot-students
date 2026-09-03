/**
 * Deterministic Hebrew (and a few English) aliases for WhatsApp answers.
 * Used before any LLM call. Only apply a match when it is unique.
 */

export function normalizeForMatch(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[״"‟”„]/g, "")
    .replace(/[׳'`ʼ]/g, "")
    .replace(/[־–—]/g, "-")
    .replace(/[.]/g, "")
    .toLowerCase();
}

export const YES_ALIASES = [
  "כן",
  "בטח",
  "בטח כן",
  "נוח לי",
  "מוכן",
  "מוכנה",
  "כן להתנדב",
  "כן אני מוכן",
  "כן אני מוכנה",
  "ברור",
  "יאללה",
  "אוקיי",
  "אוקי",
  "ok",
  "okay",
  "yes",
] as const;

export const NO_ALIASES = [
  "לא",
  "לא ממש",
  "לא רוצה",
  "לא תודה",
  "עדיף לא",
  "לא להתנדב",
  "no",
] as const;

/** Degree choice ids → extra phrases. Only used on the degree question. */
export const DEGREE_ALIASES: Record<string, readonly string[]> = {
  ba: ["תואר ראשון", "ראשון", "ba", "b.a", "bachelor"],
  ma: ["תואר שני", "שני", "ma", "m.a", "master", "מאסטר"],
  phd: ["תואר שלישי", "שלישי", "דוקטורט", "phd", "ph.d", "דוקטור"],
  teaching_certificate: ["תעודת הוראה", "הוראה"],
  practical_engineer: ["הנדסאי", "הנדסאית"],
  prep: ["מכינה", "מכינה קדם אקדמית", "מכינה קדם-אקדמית"],
};

/** Year-of-study choice ids → extra phrases. Only used on the year question. */
export const YEAR_ALIASES: Record<string, readonly string[]> = {
  "1": ["שנה 1", "שנה א", "ראשונה", "שנה ראשונה", "שנה אחת"],
  "2": ["שנה 2", "שנה ב", "שניה", "שנייה", "שנה שניה", "שנה שנייה"],
  "3": ["שנה 3", "שנה ג", "שלישית", "שנה שלישית"],
  "4": ["שנה 4", "שנה ד", "רביעית", "שנה רביעית"],
  "5": ["שנה 5", "שנה ה", "חמישית", "שנה חמישית", "5 ומעלה", "שנה 5 ומעלה"],
};

/**
 * Normalized student phrasing → institution id.
 * Keep keys unique; do not map a nickname that belongs to two schools.
 */
export const INSTITUTION_ALIASES: Record<string, string> = {
  הפתוחה: "openu",
  פתוחה: "openu",
  אופן: "openu",
  openu: "openu",
  open: "openu",
  "תל אביב": "tau",
  תא: "tau",
  tau: "tau",
  העברית: "huji",
  huji: "huji",
  הטכניון: "technion",
  טכניון: "technion",
  technion: "technion",
  "בן גוריון": "bgu",
  "בן-גוריון": "bgu",
  בגו: "bgu",
  bgu: "bgu",
  "בר אילן": "biu",
  "בר-אילן": "biu",
  biu: "biu",
  רייכמן: "reichman",
  הבינתחומי: "reichman",
  reichman: "reichman",
  ויצמן: "weizmann",
  weizmann: "weizmann",
  ספיר: "sapir",
  sapir: "sapir",
  אונו: "ono",
  ono: "ono",
  אריאל: "ariel",
  ariel: "ariel",
};

function aliasEquals(alias: string, text: string): boolean {
  return normalizeForMatch(alias) === text;
}

/** Exact alias, or the text starts with the alias plus a space (alias length ≥ 3). */
function aliasHits(alias: string, text: string): boolean {
  const a = normalizeForMatch(alias);
  if (!a) return false;
  if (text === a) return true;
  if (a.length >= 3 && (text.startsWith(`${a} `) || text.endsWith(` ${a}`) || text.includes(` ${a} `))) {
    return true;
  }
  return false;
}

export function matchYesNoAlias(text: string): "yes" | "no" | undefined {
  const t = normalizeForMatch(text);
  if (!t) return undefined;
  const yesHit = YES_ALIASES.some((a) => aliasEquals(a, t));
  const noHit = NO_ALIASES.some((a) => aliasEquals(a, t));
  if (yesHit && !noHit) return "yes";
  if (noHit && !yesHit) return "no";
  if (t.startsWith("כן ") && !t.includes("לא")) return "yes";
  if (t.startsWith("לא ")) return "no";
  return undefined;
}

export function matchMappedAliases(
  text: string,
  map: Record<string, readonly string[]>,
): string | undefined {
  const t = normalizeForMatch(text);
  if (!t) return undefined;
  const hits = new Set<string>();
  for (const [id, aliases] of Object.entries(map)) {
    if (aliases.some((a) => aliasHits(a, t))) hits.add(id);
  }
  if (hits.size !== 1) return undefined;
  return [...hits][0];
}

export function institutionIdFromAlias(text: string): string | undefined {
  const t = normalizeForMatch(text);
  if (!t) return undefined;
  const exact = INSTITUTION_ALIASES[t];
  if (exact) return exact;

  // Contains only for short nicknames — a full official name should use INSTITUTIONS.
  if (t.length > 18) return undefined;
  const hits = new Set<string>();
  for (const [alias, id] of Object.entries(INSTITUTION_ALIASES)) {
    const a = normalizeForMatch(alias);
    if (a.length >= 3 && t.includes(a)) hits.add(id);
  }
  if (hits.size !== 1) return undefined;
  return [...hits][0];
}

export type LabeledItem = { id: string; labelHe: string };

/**
 * Unique startsWith / contains match among listed labels.
 * Short 1–2 letter labels (כן / לא / 1) must not substring-match freely.
 */
export function uniquePartialLabelMatch<T extends LabeledItem>(
  items: readonly T[],
  raw: string,
): T | undefined {
  const t = normalizeForMatch(raw);
  if (t.length < 2) return undefined;

  const matches = items.filter((item) => {
    const label = normalizeForMatch(item.labelHe);
    const id = normalizeForMatch(item.id);
    if (!label) return false;
    if (label === t || id === t) return true;
    if (label.startsWith(t) || (t.startsWith(label) && label.length >= 2)) return true;
    if (label.includes(t)) return true;
    if (label.length >= 3 && t.includes(label)) return true;
    return false;
  });
  return matches.length === 1 ? matches[0] : undefined;
}
