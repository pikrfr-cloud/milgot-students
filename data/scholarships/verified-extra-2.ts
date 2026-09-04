import type { Scholarship } from "@/lib/types";
import {
  DOCS_BANK,
  DOCS_BASIC,
  DOCS_SERVICE,
  STEM,
  STEM_PLUS_MED,
  VERIFIED_GATE,
  allOf,
  amount,
  deadline,
  s,
} from "./helpers";

/**
 * Second extra-catalog pass (official pages fetched 2026-09-02).
 * Each row has a numeric ₪ (or labeled USD) amount and a concrete תשפ״ז calendar day.
 * No invented figures. Ids and applyUrls do not overlap PR #13.
 */
export const VERIFIED_EXTRA_2: Scholarship[] = [
  s({
    id: "zvulun-pais",
    nameHe: "מלגות פיס זבולון — מעורבות חברתית",
    funderHe: "מועצה אזורית זבולון בשיתוף מפעל הפיס",
    types: ["volunteering"],
    scope: "regional",
    amounts: amount("10,000 ₪ תמורת 140 שעות פעילות בקהילה, בחינוך ובמועצה (הודעת המועצה לתשפ״ז)", {
      min: 10000,
      max: 10000,
    }),
    cadence: "annual",
    deadline: deadline("ההרשמה פתוחה עד 24.9.2026 (הודעת מלגות פיס זבולון תשפ״ז)", {
      kind: "fixed",
      date: "2026-09-24",
    }),
    whoItsForHe:
      "סטודנטיות וסטודנטים תושבי מועצה אזורית זבולון. מועמדים שיעמדו בתנאי הסף יוזמנו לראיון. הגשת בקשה אינה התחייבות לקבלה.",
    documentsHe: [...DOCS_BASIC, "ספח תושבות בזבולון", ...DOCS_BANK],
    howToApplyHe: "טופס ההרשמה למלגות פיס זבולון 2026–2027 באתר המועצה, לפי ההודעה מ־10.8.2026.",
    applyUrl: "https://www.zvulun.org.il/articles/item/176/",
    notesHe: "מיון: ראיון. טופס ההרשמה המקושר מההודעה: zvulun.org.il/844/.",
    lastVerified: VERIFIED_GATE,
    sourceUrls: [
      "https://www.zvulun.org.il/articles/item/176/",
      "https://www.zvulun.org.il/844/",
    ],
    treatment: "selective",
    eligibility: allOf(
      { type: "cityIn", values: ["זבולון"] },
      { type: "willingToVolunteer" },
    ),
  }),
  s({
    id: "shomron-pais",
    nameHe: "מלגות מפעל הפיס — מועצה אזורית שומרון",
    funderHe: "מועצה אזורית שומרון בשיתוף מפעל הפיס",
    types: ["volunteering"],
    scope: "regional",
    amounts: amount("10,000 ₪ לכל סטודנט תושב השומרון תמורת התנדבות ביישוב (דף המלגות של המועצה)", {
      min: 10000,
      max: 10000,
    }),
    cadence: "annual",
    deadline: deadline(
      "הגשת בקשה למלגות המועצה עד ג׳ תשרי 14.9 (חוברת מלגות תשפ״ז של מחלקת הצעירים)",
      {
        kind: "fixed",
        date: "2026-09-14",
      },
    ),
    whoItsForHe:
      "סטודנטים תושבי מועצה אזורית שומרון. זכאות דורשת התנדבות בתחומי פעילות ביישובים. אין כפל מלגת מפעל הפיס באותה שנה. חוב ארנונה יש להסדיר.",
    documentsHe: [
      ...DOCS_BASIC,
      "אישור לימודים תקף לשנת תשפ״ז",
      ...DOCS_BANK,
      "ספח כתובת בשומרון / חוזה שכירות בתוקף",
    ],
    howToApplyHe: "הגשה מקוונת לפי דף המלגות וחוברת תשפ״ז של מוא״ז שומרון.",
    applyUrl: "https://www.shomron.org.il/396/",
    notesHe:
      "היום 14.9 בחוברת הוא ג׳ תשרי של תשפ״ז (14.9.2026). בדף גם מסלול חצי־תקן 4,500 ₪ — לא פוצל כי אותו דף הגשה.",
    lastVerified: VERIFIED_GATE,
    sourceUrls: [
      "https://www.shomron.org.il/396/",
      "https://www.shomron.org.il/uploads/n/1786007615.4864.pdf",
    ],
    treatment: "selective",
    eligibility: allOf(
      { type: "cityIn", values: ["שומרון"] },
      { type: "willingToVolunteer" },
    ),
  }),
  s({
    id: "hevel-yavne-pais",
    nameHe: "מלגת פיס — מועצה אזורית חבל יבנה",
    funderHe: "מועצה אזורית חבל יבנה בשיתוף מפעל הפיס",
    types: ["volunteering"],
    scope: "regional",
    amounts: amount("מלגת פיס 10,000 ₪ תמורת 140 שעות (דף מלגת פיס של המועצה)", {
      min: 10000,
      max: 10000,
    }),
    cadence: "annual",
    deadline: deadline("תאריך אחרון להרשמה והגשת מסמכים 15.09.26 (דף המלגות המרכזי של המועצה)", {
      kind: "fixed",
      date: "2026-09-15",
    }),
    whoItsForHe:
      "סטודנט הלומד במוסד מוכר למל״ג לתואר ראשון / שני / תעודת הוראה / הנדסאי, רשום בספח ת״ז כתושב אחד מיישובי חבל יבנה. לא מקבל מלגת פיס נוספת. ראיון וועדת מלגות.",
    documentsHe: [...DOCS_BASIC, "ספח ת״ז ביישוב בחבל יבנה"],
    howToApplyHe: "טופס אינטרנטי בדף המלגות של המועצה, כולל כל המסמכים הנדרשים.",
    applyUrl: "https://www.hevel-yavne.org.il/%D7%9E%D7%9C%D7%92%D7%95%D7%AA/",
    notesHe:
      "הסכום בדף מלגת הפיס של אותו אתר; מועד הסגירה בדף המלגות המרכזי. שני הדפים רשמיים. מלגת פר״ח באותו אתר (10,000 ₪, פתיחה «ספטמבר 2026» בלי יום) לא נספרה.",
    lastVerified: VERIFIED_GATE,
    sourceUrls: [
      "https://www.hevel-yavne.org.il/%D7%9E%D7%9C%D7%92%D7%95%D7%AA/",
      "https://www.hevel-yavne.org.il/duplicated-1597050651/",
    ],
    treatment: "selective",
    eligibility: allOf(
      { type: "cityIn", values: ["חבל יבנה"] },
      { type: "degreeLevelIn", values: ["ba", "ma", "teaching_certificate", "practical_engineer"] },
      { type: "willingToVolunteer" },
    ),
  }),
  s({
    id: "tau-president-orphanhood",
    nameHe: "מלגות נשיא המדינה למצוינות וחדשנות מדעית — 2026",
    funderHe: "לשכת נשיא המדינה",
    types: ["research", "merit"],
    scope: "national",
    amounts: amount(
      "עד 15 מלגות קיום בסכום של 150,000 ₪ כל אחת (דף המזכירות האקדמית בתל אביב, מחזור 2026)",
      { min: 150000, max: 150000 },
    ),
    cadence: "multi_year",
    deadline: deadline("העברת טפסים ישירות ללשכת נשיא המדינה עד יום שלישי 31 במרץ 2026", {
      kind: "fixed",
      date: "2026-03-31",
    }),
    archivedReasonHe:
      "חלון ההגשה שפורסם נסגר ב־31.3.2026. הרשומה נשארת להתאמה למחזור הבא.",
    whoItsForHe:
      "דוקטורנטים מצטיינים במוסדות להשכלה גבוהה שעבודותיהם עוסקות בהשפעות תנאי מצוקה בכלל ויתמות בפרט על חיי ילדים. סיימו תואר שני בהצטיינות או בהצטיינות יתרה, או מסלול ישיר; תכנית המחקר אושרה לא יותר משנה לפני ההגשה. עד שלוש שנים או עד הגשת העבודה לשיפוט.",
    documentsHe: ["טופס בקשה לפי תקנון הלשכה", "נספח ג׳ חתום דרך מדור קרנות ומלגות באוניברסיטה"],
    howToApplyHe:
      "פנייה למדור קרנות ומלגות באוניברסיטה להכנת נספח ג׳; הגשה ישירה ללשכת נשיא המדינה בירושלים.",
    applyUrl: "https://acad-sec.tau.ac.il/scholarships/president",
    notesHe: "מיון: מכסה עד 15. פרסום גם ב־president.gov.il/awards — לא נמשך כאן בגלל חסימות gov.il.",
    lastVerified: VERIFIED_GATE,
    sourceUrls: ["https://acad-sec.tau.ac.il/scholarships/president"],
    treatment: "selective",
    eligibility: allOf({ type: "degreeLevelIn", values: ["phd"] }),
  }),
  s({
    id: "tau-azrieli-fellows",
    nameHe: "תכנית עמיתי עזריאלי לדוקטורנטים — תל אביב",
    funderHe: "קרן עזריאלי / אוניברסיטת תל אביב",
    types: ["research", "merit"],
    scope: "institution",
    amounts: amount(
      "108,000 ₪ לשנה עד שלוש שנים + עד 20,000 ₪ לשנה להוצאות מחקר (קול קורא למדעים, המזכירות האקדמית)",
      { min: 108000, max: 108000 },
    ),
    cadence: "multi_year",
    deadline: deadline(
      "מסמכים לדיקנים עד יום ראשון 18 בינואר 2026; דיקנים למדור קרנות עד 28 בינואר 2026",
      {
        kind: "fixed",
        date: "2026-01-18",
      },
    ),
    archivedReasonHe:
      "חלון ההגשה האוניברסיטאי שפורסם נסגר בינואר 2026. הרשומה נשארת להתאמה לקול הקורא הבא.",
    whoItsForHe:
      "דוקטורנטים בתל אביב במסלול מדעים (טבע, מדויקים, הנדסה, רפואה ועוד לפי הקול הקורא). קבלה על בסיס מצוינות אקדמית והישגים אישיים. 40 שעות התנדבות בשנה. לא עובדים מחוץ לאוניברסיטה מעבר ל־4 שעות הוראה.",
    documentsHe: ["טופס הגשה עזריאלי", "המלצות", "הצעת מחקר או הצהרת כוונה להגישה עד 23.2.2026"],
    howToApplyHe: "דרך לשכת הדיקן; התיק מועבר למדור קרנות ומלגות.",
    applyUrl:
      "https://acad-sec.tau.ac.il/sites/acadesc.tau.ac.il/files/media_server/acadsec/scholarships/%D7%A2%D7%96%D7%A8%D7%99%D7%90%D7%9C%D7%99/azrieli-east.pdf",
    notesHe:
      "מיון: תחרותי. מסלולי רוח/חברה/חינוך באותה תכנית לא פוצלו — אותו מועד הגשה אוניברסיטאי. אין כפל עם אדמס / קלור / רוטשילד / ות״ת מדעי נתונים וקוונטים.",
    lastVerified: VERIFIED_GATE,
    sourceUrls: [
      "https://acad-sec.tau.ac.il/sites/acadesc.tau.ac.il/files/media_server/acadsec/scholarships/%D7%A2%D7%96%D7%A8%D7%99%D7%90%D7%9C%D7%99/azrieli-east.pdf",
      "https://acad-sec.tau.ac.il/grantsite/phd-israel",
    ],
    institutionIds: ["tau"],
    treatment: "selective",
    excludes: ["adams-fellowship", "clore-fellowship", "rothschild-baroness-phd", "che-phd-data-science", "che-phd-quantum"],
    eligibility: allOf(
      { type: "institutionIn", values: ["tau"] },
      { type: "degreeLevelIn", values: ["phd"] },
      { type: "fieldOfStudyIn", values: STEM_PLUS_MED },
      { type: "willingToVolunteer" },
    ),
  }),
  s({
    id: "tau-bubis",
    nameHe: "מלגות ע״ש איגנאץ בוביס בלימודי יהדות — תל אביב",
    funderHe: "קרן איגנאץ בוביס / אוניברסיטת תל אביב",
    types: ["research", "merit"],
    scope: "institution",
    amounts: amount("3,000–15,000 ₪ לתלמידים מצטיינים לתואר שני או שלישי (קול קורא PDF של המזכירות האקדמית)", {
      min: 3000,
      max: 15000,
    }),
    cadence: "annual",
    deadline: deadline("משלוח PDF אחד ל־danaav@tauex.tau.ac.il עד יום ראשון 21 ביוני 2026", {
      kind: "fixed",
      date: "2026-06-21",
    }),
    archivedReasonHe: "חלון ההגשה שפורסם נסגר ב־21.6.2026. הרשומה נשארת להתאמה לקול הקורא הבא.",
    whoItsForHe:
      "סטודנטים בתל אביב במקרא, תלמוד, היסטוריה של עם ישראל, פילוסופיה יהודית, לשון עברית, בלשנות, ספרות עברית, ארכיאולוגיה ותרבויות המזרח הקדום. דוקטורט שהחל לא לפני 1.10.2023 והצעת מחקר הוגשה/אושרה; תואר שני שהחל לא לפני 1.10.2024. זוכי עבר באותו תואר אינם רשאים להגיש שוב.",
    documentsHe: ["טופס בקשה", "קורות חיים", "גיליונות ציונים", "המלצת מנחה", "תקציר מחקר"],
    howToApplyHe: "קובץ PDF אחד לפי סדר הקול הקורא ל־danaav@tauex.tau.ac.il.",
    applyUrl:
      "https://acad-sec.tau.ac.il/sites/acadesc.tau.ac.il/files/media_server/acadsec/scholarships/%D7%A7%D7%91%D7%A6%D7%99%D7%9D%20PDF/bobis.pdf",
    notesHe: "הקול הקורא מתויג תשפ״ו בדף; מועד ההגשה שפורסם הוא 21.6.2026. עדיפות למי בלי מלגת קיום מלאה.",
    lastVerified: VERIFIED_GATE,
    sourceUrls: [
      "https://acad-sec.tau.ac.il/sites/acadesc.tau.ac.il/files/media_server/acadsec/scholarships/%D7%A7%D7%91%D7%A6%D7%99%D7%9D%20PDF/bobis.pdf",
    ],
    institutionIds: ["tau"],
    treatment: "selective",
    eligibility: allOf(
      { type: "institutionIn", values: ["tau"] },
      { type: "degreeLevelIn", values: ["ma", "phd"] },
      { type: "fieldOfStudyIn", values: ["humanities"] },
    ),
  }),
  s({
    id: "weizmann-young-scholars",
    nameHe: "Young Weizmann Scholars",
    funderHe: "מכון ויצמן למדע — Feinberg Graduate School",
    types: ["research", "merit"],
    scope: "institution",
    amounts: amount("מענק של 15,000 ₪ בשני תשלומים שווים (דף ויצמן הרשמי)", {
      min: 15000,
      max: 15000,
    }),
    cadence: "annual",
    deadline: deadline("Yearly 2026–2027 application deadline: October 4, 2026 (Weizmann WSOS page)", {
      kind: "fixed",
      date: "2026-10-04",
      opensAt: "2026-02-18",
      windowHe: "מחזור קיץ: עד 19.4.2026; מחזור שנתי: עד 4.10.2026",
    }),
    whoItsForHe:
      "סטודנטים לתואר ראשון במדעים במוסד ישראלי להשכלה גבוהה: שנה ב׳ או ג׳ במסלול תלת־שנתי, או שנה ד׳ במסלול ארבע־שנתי, ממוצע 90+. השתלבות בקבוצת מחקר במכון.",
    documentsHe: ["Online application", "Academic transcript"],
    howToApplyHe: "Online application בדף Young Weizmann Scholars של Feinberg / WSOS.",
    applyUrl: "https://www.weizmann.ac.il/wsos/admissions/young-weizmann-scholars/about-program",
    notesHe: "בדף גם מחזור קיץ 2026 שנסגר ב־19.4.2026 — לא פוצל. הסכום המפורסם הוא NIS 15,000.",
    lastVerified: VERIFIED_GATE,
    sourceUrls: ["https://www.weizmann.ac.il/wsos/admissions/young-weizmann-scholars/about-program"],
    institutionIds: ["weizmann"],
    treatment: "selective",
    eligibility: allOf(
      { type: "degreeLevelIn", values: ["ba"] },
      { type: "yearOfStudyMin", value: 2 },
      { type: "fieldOfStudyIn", values: STEM },
      { type: "minAverage", value: 90 },
    ),
  }),
  s({
    id: "isef-recanati-6000",
    nameHe: "מלגות 6000 — הקרן למתלמדים ע״ש ליאון רקנאטי",
    funderHe: "קרן רקנאטי למתלמדים בשיתוף קרן אייסף",
    types: ["need", "population"],
    scope: "national",
    amounts: amount("6,000 ₪ לפי החלטת ועדת המלגות (דף מלגות 6000 באתר אייסף, תשפ״ז)", {
      min: 6000,
      max: 6000,
    }),
    cadence: "annual",
    deadline: deadline("ההרשמה לתשפ״ז תפתח ב־9.9.2026 עד 24.9.2026 (דף מלגות 6000)", {
      kind: "fixed",
      date: "2026-09-24",
      opensAt: "2026-09-09",
      windowHe: "9.9.2026–24.9.2026",
    }),
    whoItsForHe:
      "לומדים במקצועות הפרא־רפואיים, חינוך, פסיכולוגיה ועבודה סוציאלית, שלא זכאים למלגות ארוכות הטווח של אייסף וקרן רקנאטי. שירות צבאי או אזרחי מלא, או התנדבות משמעותית של שנתיים ומעלה. עדיפות לשנים ב׳–ג׳, למי שקיבל תמיכת רקנאטי בעבר, ולרקע של היעדר הזדמנויות. תואר ראשון, שני או שלישי במוסד מל״ג.",
    documentsHe: [...DOCS_BASIC, ...DOCS_SERVICE],
    howToApplyHe: "הרשמה בדף מלגות 6000 באתר אייסף בחלון 9.9–24.9.2026. שאלות: recanati@isef.org.il.",
    applyUrl:
      "https://www.isef.org.il/%D7%9E%D7%9C%D7%92%D7%95%D7%AA-5000-%D7%94%D7%A7%D7%A8%D7%9F-%D7%9C%D7%9E%D7%AA%D7%9C%D7%9E%D7%93%D7%99%D7%9D-%D7%A2%D7%A9-%D7%9C%D7%99%D7%90%D7%95%D7%9F-%D7%A8%D7%A7%D7%A0%D7%90%D7%98%D7%99/",
    notesHe: "קישור הגשה נפרד ממלגת אייסף הראשית. מיון: ועדת מלגות.",
    lastVerified: VERIFIED_GATE,
    sourceUrls: [
      "https://www.isef.org.il/%D7%9E%D7%9C%D7%92%D7%95%D7%AA-5000-%D7%94%D7%A7%D7%A8%D7%9F-%D7%9C%D7%9E%D7%AA%D7%9C%D7%9E%D7%93%D7%99%D7%9D-%D7%A2%D7%A9-%D7%9C%D7%99%D7%90%D7%95%D7%9F-%D7%A8%D7%A7%D7%A0%D7%90%D7%98%D7%99/",
    ],
    treatment: "selective",
    eligibility: allOf(
      { type: "degreeLevelIn", values: ["ba", "ma", "phd"] },
      {
        type: "fieldOfStudyIn",
        values: ["health", "nursing", "education", "social_work", "social_sciences"],
      },
      {
        op: "anyOf",
        labelHe: "שירות מלא או התנדבות משמעותית של שנתיים ומעלה",
        rules: [
          { type: "serviceIn", values: ["idf", "national", "civil"] },
          { type: "willingToVolunteer" },
        ],
      },
    ),
  }),
  s({
    id: "irgun-jeckes",
    nameHe: "מלגות ארגון יוצאי מרכז אירופה",
    funderHe: "המפעל לעזרה הדדית של ארגון יוצאי מרכז אירופה",
    types: ["need", "merit", "population"],
    scope: "national",
    amounts: amount(
      "מלגת סיוע כלכלי 7,500 ₪; מלגת מצטיינים 10,000 ₪ (דף מלגות וסיוע של הארגון, תשפ״ז)",
      { min: 7500, max: 10000 },
    ),
    cadence: "annual",
    deadline: deadline("הגשה לתשפ״ז מ־4.10.2026 עד 20.11.2026 (דף מלגות וסיוע, עדכון 30.7.2026)", {
      kind: "fixed",
      date: "2026-11-20",
      opensAt: "2026-10-04",
      windowHe: "4.10.2026–20.11.2026",
    }),
    whoItsForHe:
      "צאצאי יוצאי גרמניה, אוסטריה, שוויץ וצ׳כוסלובקיה. שירות צבאי מלא (30 חודשים לבנים / 24 לבנות) או שירות לאומי מלא (24 חודשים). מוסד מל״ג. מסלול סיוע: תואר ראשון משנה ב׳ ומעלה או שני/שלישי, עד גיל 50. מסלול מצטיינים: שני/שלישי, ממוצע 90+, עד גיל 45. בקשה אחת בשנה; מלגה אחת לתואר. 45 שעות למען הארגון.",
    documentsHe: [...DOCS_BASIC, ...DOCS_SERVICE, "אישור ייחוס לפי טופס הארגון"],
    howToApplyHe: "הגשה בדף מלגות וסיוע של הארגון בחלון אוקטובר–נובמבר 2026. בירורים: melagot.irgun.jeckes@gmail.com.",
    applyUrl: "https://irgun-jeckes.org/%D7%9E%D7%9C%D7%92%D7%95%D7%AA-%D7%95%D7%A1%D7%99%D7%95%D7%A2/",
    notesHe: "שני המסלולים באותו דף ובאותו חלון — לא פוצלו. טקס חלוקה צוין ל־25.3.2027.",
    lastVerified: VERIFIED_GATE,
    sourceUrls: ["https://irgun-jeckes.org/%D7%9E%D7%9C%D7%92%D7%95%D7%AA-%D7%95%D7%A1%D7%99%D7%95%D7%A2/"],
    treatment: "selective",
    eligibility: allOf(
      {
        op: "anyOf",
        rules: [
          allOf({ type: "degreeLevelIn", values: ["ba"] }, { type: "yearOfStudyMin", value: 2 }),
          { type: "degreeLevelIn", values: ["ma", "phd"] },
        ],
      },
      { type: "serviceIn", values: ["idf", "national"] },
      { type: "ageMax", value: 50 },
      { type: "willingToVolunteer" },
    ),
  }),
];
