export type InstitutionKind = "university" | "college" | "other";

export type Institution = {
  id: string;
  nameHe: string;
  kind: InstitutionKind;
  campuses?: { id: string; nameHe: string }[];
  cityHe?: string;
  peripheryCampus?: boolean;
};

export const INSTITUTIONS: Institution[] = [
  { id: "tau", nameHe: "אוניברסיטת תל אביב", kind: "university", cityHe: "תל אביב-יפו" },
  { id: "huji", nameHe: "האוניברסיטה העברית בירושלים", kind: "university", cityHe: "ירושלים", campuses: [
    { id: "mount_scopus", nameHe: "הר הצופים" },
    { id: "edmond_safra", nameHe: "גבעת רם / אדמונד י. ספרא" },
    { id: "ein_kerem", nameHe: "עין כרם" },
    { id: "rehovot", nameHe: "רחובות" },
  ]},
  { id: "technion", nameHe: "הטכניון — מכון טכנולוגי לישראל", kind: "university", cityHe: "חיפה" },
  { id: "bgu", nameHe: "אוניברסיטת בן-גוריון בנגב", kind: "university", cityHe: "באר שבע", peripheryCampus: true, campuses: [
    { id: "beer_sheva", nameHe: "באר שבע" },
    { id: "eilat", nameHe: "אילת" },
    { id: "sde_boker", nameHe: "שדה בוקר" },
  ]},
  { id: "haifa", nameHe: "אוניברסיטת חיפה", kind: "university", cityHe: "חיפה" },
  { id: "biu", nameHe: "אוניברסיטת בר-אילן", kind: "university", cityHe: "רמת גן" },
  { id: "openu", nameHe: "האוניברסיטה הפתוחה", kind: "university", cityHe: "רעננה" },
  { id: "reichman", nameHe: "אוניברסיטת רייכמן", kind: "university", cityHe: "הרצליה" },
  { id: "ariel", nameHe: "אוניברסיטת אריאל", kind: "university", cityHe: "אריאל" },
  { id: "weizmann", nameHe: "מכון ויצמן למדע", kind: "university", cityHe: "רחובות" },
  { id: "telhai", nameHe: "אוניברסיטת תל-חי (בהקמה) / המכללה האקדמית תל-חי", kind: "college", cityHe: "תל חי", peripheryCampus: true },
  { id: "sapir", nameHe: "המכללה האקדמית ספיר", kind: "college", cityHe: "שער הנגב", peripheryCampus: true },
  { id: "kinneret", nameHe: "המכללה האקדמית כנרת", kind: "college", cityHe: "צמח / עמק הירדן", peripheryCampus: true },
  { id: "sce", nameHe: "SCE המכללה האקדמית להנדסה ע״ש סמי שמעון", kind: "college", cityHe: "באר שבע", peripheryCampus: true, campuses: [
    { id: "beer_sheva", nameHe: "באר שבע" },
    { id: "ashdod", nameHe: "אשדוד" },
  ]},
  { id: "bezalel", nameHe: "בצלאל אקדמיה לאמנות ועיצוב ירושלים", kind: "college", cityHe: "ירושלים" },
  { id: "shenkar", nameHe: "שנקר — הנדסה. עיצוב. אמנות", kind: "college", cityHe: "רמת גן" },
  { id: "ono", nameHe: "הקריה האקדמית אונו", kind: "college", cityHe: "קריית אונו" },
  { id: "afeka", nameHe: "מכללת אפקה", kind: "college", cityHe: "תל אביב-יפו" },
  { id: "hit", nameHe: "HIT מכון טכנולוגי חולון", kind: "college", cityHe: "חולון" },
  { id: "ruppin", nameHe: "המרכז האקדמי רופין", kind: "college", cityHe: "עמק חפר" },
  { id: "yvc", nameHe: "המכללה האקדמית עמק יזרעאל", kind: "college", cityHe: "עמק יזרעאל", peripheryCampus: true },
  { id: "wgalil", nameHe: "המכללה האקדמית גליל מערבי", kind: "college", cityHe: "עכו", peripheryCampus: true },
  { id: "achva", nameHe: "המכללה האקדמית אחוה", kind: "college", cityHe: "באר טוביה", peripheryCampus: true },
  { id: "zefat", nameHe: "המכללה האקדמית צפת", kind: "college", cityHe: "צפת", peripheryCampus: true },
  { id: "braude", nameHe: "המכללה האקדמית להנדסה בראודה בכרמיאל", kind: "college", cityHe: "כרמיאל", peripheryCampus: true },
  { id: "azrieli", nameHe: "המכללה האקדמית להנדסה ע״ש עזריאלי ירושלים", kind: "college", cityHe: "ירושלים" },
  { id: "mta", nameHe: "המכללה האקדמית תל אביב-יפו", kind: "college", cityHe: "תל אביב-יפו" },
  { id: "colman", nameHe: "המסלול האקדמי המכללה למינהל", kind: "college", cityHe: "ראשון לציון" },
  { id: "netanya", nameHe: "המרכז האקדמי נתניה", kind: "college", cityHe: "נתניה" },
  { id: "ashkelon", nameHe: "המכללה האקדמית אשקלון", kind: "college", cityHe: "אשקלון", peripheryCampus: true },
  { id: "kibbutzim", nameHe: "מכללת סמינר הקיבוצים", kind: "college", cityHe: "תל אביב-יפו" },
  { id: "levinsky", nameHe: "מכללת לוינסקי-וינגייט", kind: "college", cityHe: "תל אביב-יפו" },
  { id: "david_yellin", nameHe: "מכללת דוד ילין", kind: "college", cityHe: "ירושלים" },
  { id: "gordon", nameHe: "מכללת גורדון", kind: "college", cityHe: "חיפה" },
  { id: "kaye", nameHe: "מכללת קיי", kind: "college", cityHe: "באר שבע", peripheryCampus: true },
  { id: "oranim", nameHe: "מכללת אורנים", kind: "college", cityHe: "קריית טבעון" },
  { id: "herzog", nameHe: "מכללת הרצוג", kind: "college", cityHe: "אלון שבות" },
  { id: "ohalo", nameHe: "מכללת אוהלו בקצרין", kind: "college", cityHe: "קצרין", peripheryCampus: true },
  { id: "hadassah", nameHe: "המכללה האקדמית הדסה", kind: "college", cityHe: "ירושלים" },
  { id: "jca", nameHe: "המכללה האקדמית ירושלים", kind: "college", cityHe: "ירושלים" },
  { id: "pac", nameHe: "המרכז האקדמי פרס", kind: "college", cityHe: "רחובות" },
  { id: "wizo_haifa", nameHe: "ויצו חיפה אקדמיה לעיצוב ולחינוך", kind: "college", cityHe: "חיפה" },
  { id: "ramat_gan_college", nameHe: "המכללה האקדמית רמת גן", kind: "college", cityHe: "רמת גן" },
  { id: "other_che", nameHe: "מוסד אחר המוכר על ידי המל״ג", kind: "other" },
  { id: "mahat", nameHe: "מכללה טכנולוגית (מה״ט)", kind: "other" },
];

/** Deduped list used in the UI (some historical aliases kept for matching only). */
export const INSTITUTIONS_FOR_SELECT = INSTITUTIONS;

export const PERIPHERY_INSTITUTION_IDS = new Set(
  INSTITUTIONS.filter((i) => i.peripheryCampus).map((i) => i.id),
);

export const JERUSALEM_INSTITUTION_IDS = [
  "huji",
  "bezalel",
  "azrieli",
  "david_yellin",
  "hadassah",
  "jca",
];

export const INSTITUTION_GROUPS: { labelHe: string; items: Institution[] }[] = [
  { labelHe: "אוניברסיטאות", items: INSTITUTIONS.filter((i) => i.kind === "university") },
  { labelHe: "מכללות", items: INSTITUTIONS.filter((i) => i.kind === "college") },
  { labelHe: "אחר", items: INSTITUTIONS.filter((i) => i.kind === "other") },
];

export function isPeripheryInstitution(id: string | null | undefined): boolean {
  if (!id) return false;
  return PERIPHERY_INSTITUTION_IDS.has(id);
}
