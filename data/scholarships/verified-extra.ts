import type { Scholarship } from "@/lib/types";
import {
  DOCS_BANK,
  DOCS_BASIC,
  DOCS_SERVICE,
  allOf,
  amount,
  deadline,
  s,
} from "./helpers";

/** Fetch date for this extra-catalog pass (official pages, 2026-09-02). */
const VERIFIED_FETCH = "2026-09-02";

const HOF_HASHARON_LOCALITIES = [
  "אודים",
  "ארסוף",
  "בית יהושע",
  "בני ציון",
  "בצרה",
  "גליל ים",
  "געש",
  "חרוצים",
  "יקום",
  "כפר נטר",
  "רשפון",
  "שפיים",
  "תל יצחק",
];

const HEVEL_MODIIN_LOCALITIES = [
  "אחיסמך",
  "בארות יצחק",
  "בית נחמיה",
  "בית עריף",
  "בן שמן",
  "בני עטרות",
  "ברקת",
  "גבעת כח",
  "גמזו",
  "גנתון",
  "חדיד",
  "טירת יהודה",
  "כפר דניאל",
  "כפר טרומן",
  "כפר רות",
  "כרם בן שמן",
  "לפיד",
  "מבוא מודיעים",
  "מזור",
  "נופך",
  "נחלים",
  "רינתיה",
  "שילת",
];

/**
 * New matchable records verified from official pages on 2026-09-02.
 * Each has a numeric ₪ amount and a dated תשפ״ז deadline. No invented figures.
 */
export const VERIFIED_EXTRA: Scholarship[] = [
  s({
    id: "ramat-hasharon-students",
    nameHe: "מלגות סטודנטים — רמת השרון (פיס / רוטרי)",
    funderHe: "עיריית רמת השרון, מפעל הפיס ומועדון רוטרי רמת השרון",
    types: ["volunteering"],
    scope: "municipal",
    amounts: amount(
      "מפעל הפיס: 10,000 ₪ תמורת כ־140 שעות (כ־50 מלגות). רוטרי: 5,000 ₪ תמורת 50 שעות. שני המסלולים בדף העירוני, מועד אחרון 15.9.2026.",
      { min: 5000, max: 10000 },
    ),
    cadence: "annual",
    deadline: deadline("הגשת תשפ״ז עד 15.9.2026 — דף המלגות של עיריית רמת השרון", {
      kind: "fixed",
      date: "2026-09-15",
      windowHe: "עד 15.9.2026",
    }),
    whoItsForHe:
      "סטודנטים בני העיר רמת השרון. מסלול הפיס: כ־50 מלגאים, 140 שעות בקהילה. מסלול רוטרי: מוסד מוכר בישראל, 50 שעות, טקס בדצמבר 2026.",
    documentsHe: [
      ...DOCS_BASIC,
      "טופס התחייבות מלגאי למפעל הפיס (מסלול פיס)",
      "טופס התחייבות מלגאי לעירייה (מסלול פיס)",
      "טופס שמירת סודיות (מסלול פיס)",
      "נספח נימוקים והמלצות (מסלול רוטרי)",
    ],
    howToApplyHe: "טפסים מקוונים בדף המלגות של עיריית רמת השרון — מסלול פיס או מסלול רוטרי.",
    applyUrl: "https://ramat-hasharon.muni.il/%D7%9E%D7%9C%D7%92%D7%95%D7%AA/",
    notesHe:
      "שני המסלולים באותו דף רשמי. לא הומצא מספר זוכים לרוטרי. קבלה בוועדה — לא זכאות אוטומטית.",
    lastVerified: VERIFIED_FETCH,
    sourceUrls: ["https://ramat-hasharon.muni.il/%D7%9E%D7%9C%D7%92%D7%95%D7%AA/"],
    treatment: "selective",
    eligibility: allOf(
      { type: "cityIn", values: ["רמת השרון"], of: "either" },
      { type: "degreeLevelIn", values: ["ba", "ma", "practical_engineer", "teaching_certificate"] },
      { type: "willingToVolunteer" },
    ),
  }),
  s({
    id: "hof-hasharon-pais",
    nameHe: "מלגת מועצה אזורית חוף השרון (מפעל הפיס)",
    funderHe: "מועצה אזורית חוף השרון ומפעל הפיס",
    types: ["volunteering"],
    scope: "regional",
    amounts: amount("10,000 ₪ לשנה תמורת 140 שעות בקהילת המועצה; 25 תקנים", {
      min: 10000,
      max: 10000,
    }),
    cadence: "annual",
    deadline: deadline("הרשמת 2026–2027: פתיחה 20.7.2026, מועד אחרון להגשה 8.9.2026; ועדה 24.9.2026", {
      kind: "fixed",
      date: "2026-09-08",
      opensAt: "2026-07-20",
      windowHe: "20.7.2026–8.9.2026",
    }),
    whoItsForHe:
      "סטודנטים תושבי יישובי המועצה (אישור תושבות מהוועד בחמש השנים האחרונות), אחרי שירות צבאי או לאומי, במוסד מל״ג. 25 תקנים; ועדת מלגות ב־24.9.2026.",
    documentsHe: [
      "קורות חיים",
      ...DOCS_BASIC,
      "אישור תושבות מהוועד המקומי (חמש שנים)",
      ...DOCS_SERVICE,
      ...DOCS_BANK,
      "אישור לימודים או הרשמה למוסד מל״ג",
    ],
    howToApplyHe: "טופס הגשה בדף מלגות הסיוע לסטודנטים באתר המועצה.",
    applyUrl: "https://hof-hasharon.co.il/%D7%9E%D7%9C%D7%92%D7%95%D7%AA-%D7%A1%D7%99%D7%95%D7%A2-%D7%9C%D7%A1%D7%98%D7%95%D7%93%D7%A0%D7%98%D7%99%D7%9D/",
    notesHe: "סמינר פתיחה 15.10.2026; סיום שנה 31.7.2027. המועצה שומרת זכות שלא לקבל את כל המועמדים.",
    lastVerified: VERIFIED_FETCH,
    sourceUrls: [
      "https://hof-hasharon.co.il/%D7%9E%D7%9C%D7%92%D7%95%D7%AA-%D7%A1%D7%99%D7%95%D7%A2-%D7%9C%D7%A1%D7%98%D7%95%D7%93%D7%A0%D7%98%D7%99%D7%9D/",
    ],
    treatment: "selective",
    eligibility: allOf(
      { type: "cityIn", values: HOF_HASHARON_LOCALITIES, of: "either" },
      { type: "serviceIn", values: ["idf", "national"] },
      { type: "degreeLevelIn", values: ["ba", "ma"] },
      { type: "willingToVolunteer" },
    ),
  }),
  s({
    id: "rosh-haayin-students",
    nameHe: "מלגות לימודים לסטודנטים — ראש העין תשפ״ז",
    funderHe: "עיריית ראש העין ומפעל הפיס / פר״ח",
    types: ["volunteering"],
    scope: "municipal",
    amounts: amount(
      "תשפ״ז: 50 מלגות פיס 10,000 ₪ (140 שעות); 60 מלגות פיס+פר״ח 10,000 ₪ (120 שעות פר״ח + 20 בקהילה); 26 מלגות עירוניות 5,000 ₪ (75 שעות)",
      { min: 5000, max: 10000 },
    ),
    cadence: "annual",
    deadline: deadline("הרשמת תשפ״ז: 8.9.2026 עד 1.11.2026 בחצות — דף עיריית ראש העין", {
      kind: "annual_window",
      date: "2026-11-01",
      opensAt: "2026-09-08",
      windowHe: "8.9.2026–1.11.2026",
    }),
    whoItsForHe:
      "סטודנטים תושבי ראש העין הנותנים בחזרה לקהילה (ילדים, נוער, אוכלוסיות מיוחדות, קשישים). 136 מלגות בשלושה מסלולים.",
    documentsHe: [...DOCS_BASIC, "תושבות בראש העין", "אישור לימודים לתשפ״ז"],
    howToApplyHe: "טופס מקוון בדף המלגות של עיריית ראש העין.",
    applyUrl: "https://www.rosh-haayin.muni.il/607/",
    notesHe:
      "פעימות תשלום לפי מסלול (עירייה / פיס / פר״ח) מפורטות בדף. לא הומצא תנאי סף נוסף מעבר למה שפורסם.",
    lastVerified: VERIFIED_FETCH,
    sourceUrls: ["https://www.rosh-haayin.muni.il/607/", "https://rosh-haayin.muni.il/607/"],
    treatment: "selective",
    eligibility: allOf(
      { type: "cityIn", values: ["ראש העין"], of: "either" },
      { type: "degreeLevelIn", values: ["ba", "ma", "practical_engineer", "teaching_certificate"] },
      { type: "willingToVolunteer" },
    ),
  }),
  s({
    id: "hevel-modiin-pais",
    nameHe: "מלגת מעורבות חברתית — מועצה אזורית חבל מודיעין",
    funderHe: "מועצה אזורית חבל מודיעין ומפעל הפיס",
    types: ["volunteering"],
    scope: "regional",
    amounts: amount("10,000 ₪ לשנה תמורת 140 שעות התנדבות בגופי המועצה; עד 70 מלגאים", {
      min: 10000,
      max: 10000,
    }),
    cadence: "annual",
    deadline: deadline("הרשמת תשפ״ז עד יום חמישי 20.8.2026 — טופס מלגת הפיס באתר המועצה", {
      kind: "fixed",
      date: "2026-08-20",
      windowHe: "עד 20.8.2026",
    }),
    archivedReasonHe:
      "חלון הגשת תשפ״ז נסגר ב־20.8.2026 לפי טופס המועצה. לא הומצא מועד חדש — המחזור הבא יפורסם באתר המועצה.",
    whoItsForHe:
      "סטודנטים תושבי יישובי המועצה האזורית חבל מודיעין (לא כולל שוהם, שהיא רשות נפרדת). עד 70 מלגות; שעות עד 31.7.2027.",
    documentsHe: [...DOCS_BASIC, "תושבות ביישוב המועצה", "אישור לימודים"],
    howToApplyHe: "טופס בקשת מלגת הפיס באתר מועצה אזורית חבל מודיעין.",
    applyUrl: "https://www.modiin-region.muni.il/duplicated-1755156229/",
    notesHe: "פעימות: 5,000 ₪ במאי 2027 ו־5,000 ₪ בנובמבר 2027, לפי הדף.",
    lastVerified: VERIFIED_FETCH,
    sourceUrls: ["https://www.modiin-region.muni.il/duplicated-1755156229/"],
    treatment: "selective",
    eligibility: allOf(
      { type: "cityIn", values: HEVEL_MODIIN_LOCALITIES, of: "either" },
      { type: "degreeLevelIn", values: ["ba", "ma", "practical_engineer", "teaching_certificate"] },
      { type: "willingToVolunteer" },
    ),
  }),
  s({
    id: "heseg-leadership",
    nameHe: "מלגת חינוך למנהיגות — קרן הישג",
    funderHe: "קרן הישג (HESEG Foundation)",
    types: ["leadership", "volunteering", "need"],
    scope: "national",
    amounts: amount("השתתפות בשכר לימוד לשנה אקדמית: 11,000 ₪ — דף ההרשמה של קרן הישג", {
      min: 11000,
      max: 11000,
    }),
    cadence: "annual",
    deadline: deadline("מועד אחרון להגשת מועמדות 10.8.2026 — דף ההרשמה של קרן הישג", {
      kind: "fixed",
      date: "2026-08-10",
    }),
    archivedReasonHe:
      "חלון הגשת תשפ״ז למלגת חינוך למנהיגות נסגר ב־10.8.2026. מלגת החייל הבודד של אותה קרן נסגרה ב־30.6.2026 בלי סכום ₪ אחיד בדף — לא הומצא סכום.",
    whoItsForHe:
      "סטודנטים לתואר ראשון במוסד מל״ג (לא האוניברסיטה הפתוחה), שנה א׳ או ב׳ באוקטובר 2026, המתנדבים בארגון התנדבות, מרקע כלכלי מאתגר, עם ניסיון בהובלת תהליכים. מיון: טופס, משימה, ראיון.",
    documentsHe: [...DOCS_BASIC, "טופס הרשמה באתר הישג", "ראיון / סדנת מיון למתאימים"],
    howToApplyHe: "טופס הרשמה בדף מלגת חינוך למנהיגות באתר קרן הישג.",
    applyUrl: "https://www.heseg.com/scholarshipapplication",
    notesHe:
      "זו לא מלגת החייל הבודד של הישג (מימון שכ״ל + דמי קיום, בלי ₪ אחיד בדף). אותה כתובת הגשה מציגה את שני המסלולים.",
    lastVerified: VERIFIED_FETCH,
    sourceUrls: ["https://www.heseg.com/scholarshipapplication"],
    treatment: "selective",
    eligibility: allOf(
      { type: "degreeLevelIn", values: ["ba"] },
      { type: "yearOfStudyIn", values: [1, 2] },
      { type: "institutionNotIn", values: ["openu"] },
      { type: "incomeAtMost", value: "low" },
      { type: "willingToVolunteer" },
    ),
  }),
  s({
    id: "tau-liber-phd",
    nameHe: "מלגת קרן ליבר לדוקטורנטים מצטיינים",
    funderHe: "קרן ליבר / מדור קרנות ומלגות, אוניברסיטת תל אביב",
    types: ["research", "merit"],
    scope: "institution",
    amounts: amount("שלוש מלגות תשפ״ז בסך 15,000 ₪ כל אחת — קול קורא רשמי", {
      min: 15000,
      max: 15000,
    }),
    cadence: "one_time",
    deadline: deadline("הגשת תיקים למדור קרנות ומלגות עד יום שלישי 6.10.2026", {
      kind: "fixed",
      date: "2026-10-06",
    }),
    whoItsForHe:
      "דוקטורנטיות ודוקטורנטים באוניברסיטת תל אביב בתחומי הספרות העברית, התיאטרון, ההיסטוריה והאמנות (עדיפות לחקר הספרות העברית והתרבות והחברה הישראלית). אחרי אישור הצעת מחקר; הצטיינות בתואר ראשון ושני. הגשה דרך דיקן הפקולטה (2–3 מועמדים מדורגים).",
    documentsHe: [
      "טופס בקשה למלגת ליבר",
      "אישור קבלה לשלב ב׳ כולל נושא המחקר",
      "תקציר עבודת המחקר (עד 2 עמ׳)",
      "קורות חיים ורשימת פרסומים",
      "שני מכתבי המלצה (אחד מהמנחה)",
    ],
    howToApplyHe: "דרך דיקן הפקולטה למדור קרנות ומלגות (danaav@tauex.tau.ac.il), לפי הקול הקורא.",
    applyUrl:
      "https://acad-sec.tau.ac.il/sites/acadesc.tau.ac.il/files/media_server/acadsec/scholarships/%D7%A7%D7%91%D7%A6%D7%99%D7%9D%20PDF/Liber.pdf",
    notesHe: "הגשה אינה ישירה מהסטודנט בלבד — הדיקן מגיש מועמדים מדורגים.",
    lastVerified: VERIFIED_FETCH,
    sourceUrls: [
      "https://acad-sec.tau.ac.il/sites/acadesc.tau.ac.il/files/media_server/acadsec/scholarships/%D7%A7%D7%91%D7%A6%D7%99%D7%9D%20PDF/Liber.pdf",
    ],
    institutionIds: ["tau"],
    treatment: "selective",
    eligibility: allOf(
      { type: "institutionIn", values: ["tau"] },
      { type: "degreeLevelIn", values: ["phd"] },
      { type: "fieldOfStudyIn", values: ["humanities", "arts"] },
      { type: "minAverage", value: 90 },
    ),
  }),
  s({
    id: "huji-kolodny-ba",
    nameHe: "מלגות קולודני למצטיינים במדעי כדור הארץ",
    funderHe: "המכון למדעי כדור הארץ ע״ש פרדי ונדין הרמן, האוניברסיטה העברית",
    types: ["merit"],
    scope: "institution",
    amounts: amount(
      "חמישה פרסי הצטיינות לתואר ראשון בסך 12,000 ₪ כל אחד (שניים לשנה א׳, שניים לשנה ב׳, אחד לאוכלוסייה לא מיוצגת) — דף המכון לתשפ״ז",
      { min: 12000, max: 12000 },
    ),
    cadence: "one_time",
    deadline: deadline("הגשת מועמדות לתשפ״ז (2026–2027) עד 1.7.2026 למייל המכון", {
      kind: "fixed",
      date: "2026-07-01",
    }),
    archivedReasonHe:
      "חלון הגשת תשפ״ז נסגר ב־1.7.2026 לפי דף מלגות קולודני. לא הועתקו סכומי המוסמך/דוקטורט החודשיים לרשומת התואר הראשון.",
    whoItsForHe:
      "סטודנטיות וסטודנטים מצטיינים במדעי כדור הארץ באוניברסיטה העברית. חמישה פרסי תואר ראשון; בדף פורסמו גם מלגות חודשיות למוסמך (7,500 ₪) ולדוקטורט (9,600 ₪) — לא קודדו כאן כסכום אחיד לתואר ראשון.",
    documentsHe: ["גיליון ציונים", "טופס לפי קול קורא קולודני תשפ״ז"],
    howToApplyHe: "הגשה למייל המכון (renanasn@savion.huji.ac.il) לפי דף מלגות קולודני.",
    applyUrl: "https://earth.huji.ac.il/kolodny_scholarship",
    lastVerified: VERIFIED_FETCH,
    sourceUrls: ["https://earth.huji.ac.il/kolodny_scholarship"],
    institutionIds: ["huji"],
    treatment: "selective",
    eligibility: allOf(
      { type: "institutionIn", values: ["huji"] },
      { type: "degreeLevelIn", values: ["ba"] },
      { type: "yearOfStudyIn", values: [1, 2] },
      { type: "fieldOfStudyIn", values: ["exact_sciences", "life_sciences", "stem"] },
      { type: "minAverage", value: 85 },
    ),
  }),
  s({
    id: "biu-jewish-phd-dean",
    nameHe: "מלגת דקן הפקולטה למדעי היהדות לתואר שלישי",
    funderHe: "הפקולטה למדעי היהדות, אוניברסיטת בר־אילן",
    types: ["research", "merit"],
    scope: "institution",
    amounts: amount(
      "עד 30,000 ₪ בשנת הלימודים הראשונה או השנייה (5,000 עם הרישום עד 30.11.2026, 5,000 בסוף סמסטר א׳, 20,000 עם אישור הצעת המחקר) — דף הפקולטה",
      { min: 5000, max: 30000 },
    ),
    cadence: "one_time",
    deadline: deadline("מועד אחרון להגשת מועמדות: יום ראשון 16.8.2026 — דף הפקולטה למדעי היהדות", {
      kind: "fixed",
      date: "2026-08-16",
    }),
    archivedReasonHe:
      "חלון הגשת תשפ״ז נסגר ב־16.8.2026 לפי דף הפקולטה. 30.11.2026 בדף הוא מועד הרישום לתואר, לא הארכת הגשת המלגה.",
    whoItsForHe:
      "מצטיינים עם תואר שני עם תזה (או סיום בתשפ״ו, ציון 90 לפחות) המתעתדים להתחיל דוקטורט במדעי היהדות בבר־אילן בתשפ״ז. מלגת שכ״ל, מותנית בהתחייבות לסיום הדוקטורט.",
    documentsHe: ["מועמדות לפי דף הפקולטה", "גיליון תואר שני", "קבלה / כוונת הרשמה לדוקטורט"],
    howToApplyHe: "הגשה לפי הקול הקורא בדף מלגות הדוקטורט של הפקולטה למדעי היהדות.",
    applyUrl: "https://jewish-faculty.biu.ac.il/jewish-studies-phd-scholarships",
    lastVerified: VERIFIED_FETCH,
    sourceUrls: ["https://jewish-faculty.biu.ac.il/jewish-studies-phd-scholarships"],
    institutionIds: ["biu"],
    treatment: "selective",
    eligibility: allOf(
      { type: "institutionIn", values: ["biu"] },
      { type: "degreeLevelIn", values: ["phd"] },
      { type: "fieldOfStudyIn", values: ["humanities"] },
      { type: "minAverage", value: 90 },
    ),
  }),
];
