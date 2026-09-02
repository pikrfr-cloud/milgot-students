import type { Scholarship } from "@/lib/types";
import {
  DOCS_BANK,
  DOCS_BASIC,
  DOCS_SERVICE,
  STEM,
  VERIFIED_GATE,
  allOf,
  anyOf,
  amount,
  deadline,
  s,
} from "./helpers";

/**
 * Third extra-catalog pass (official pages fetched 2026-09-02).
 * Each row has a numeric ₪ amount and a concrete 2026 calendar day.
 * No invented figures. Ids and applyUrls do not overlap main / PR #13 / PR #14.
 */
export const VERIFIED_EXTRA_3: Scholarship[] = [
  s({
    id: "loewenstein-iron-swords",
    nameHe: "מלגות לימודים לנפגעי חרבות ברזל — ידידי לוינשטיין",
    funderHe: "עמותת ידידי המרכז הרפואי לשיקום לוינשטיין",
    types: ["need", "service", "population"],
    scope: "national",
    amounts: amount(
      "עד 15,000 ₪ לשנת לימוד ועד 40,000 ₪ לאורך כל התואר, עד 4 שנים (דף המלגות של העמותה)",
      { min: 15000, max: 15000 },
    ),
    cadence: "annual",
    deadline: deadline("מועד אחרון להגשת בקשה לשנה זו: 30.10.2026 (דף המלגות של העמותה)", {
      kind: "fixed",
      date: "2026-10-30",
    }),
    whoItsForHe:
      "חיילים ואזרחים שנפגעו במלחמת חרבות ברזל החל מ־7.10.2023, ושעברו או שעוברים שיקום במרכז הרפואי לשיקום לוינשטיין. ניתן להגיש גם רטרואקטיבית לשנים 2024–2026 כנגד אישור לימודים ותשלום. יש להגיש בקשה חדשה לכל שנת לימוד.",
    documentsHe: [
      ...DOCS_BASIC,
      "אישור לימודים ואישור תשלום",
      "מסמכי שיקום בלוינשטיין לפי התקנון",
    ],
    howToApplyHe: "טופס מקוון בדף המלגות של העמותה, כולל כל המסמכים בעת הרישום. תקנון חובה לפני מילוי.",
    applyUrl: "https://foloewenstein.org.il/milga/",
    notesHe:
      "מיון: ועדת מלגות. המלגה משלימה מימון ציבורי (משרד הביטחון / מענקי שחרור) או מממנת במלואו כשאין זכאות אחרת. לא הומצא מספר זוכים.",
    lastVerified: VERIFIED_GATE,
    sourceUrls: ["https://foloewenstein.org.il/milga/"],
    treatment: "selective",
    eligibility: allOf({ type: "hasDisability" }),
  }),
  s({
    id: "galil-elion-council",
    nameHe: "מלגת מועצה — מועצה אזורית הגליל העליון",
    funderHe: "מועצה אזורית הגליל העליון",
    types: ["need", "periphery"],
    scope: "regional",
    amounts: amount("גובה המלגה המקסימלי 2,000 ₪; תקציב מאושר 220,000 ₪ (דף מלגת המועצה)", {
      min: 2000,
      max: 2000,
    }),
    cadence: "annual",
    deadline: deadline(
      "מועד אחרון להגשת הבקשה לשני המסלולים: 15.3.26 (דף מלגת מועצה תשפ״ו 2026)",
      {
        kind: "fixed",
        date: "2026-03-15",
      },
    ),
    archivedReasonHe:
      "חלון ההגשה שפורסם נסגר ב־15.3.2026. הרשומה נשארת להתאמה למחזור הבא. לא פוצלו מסלול תואר ראשון/הנדסאי ומסלול שני/שלישי — אותו יום ואותו דף.",
    whoItsForHe:
      "תושבי יישובי המועצה (רישום בת״ז ואישור מנהל/ת קהילה), תושב המועצה בחמש השנים האחרונות ו/או תושב המקום. מסלול א׳: תואר ראשון או הנדסאי במוסד מל״ג/מה״ט, לימודים מלאים, משנה ב׳ ואילך. מסלול ב׳: תואר שני או שלישי במוסד מל״ג. זכאות אחת לכל תואר. בני סגל אקדמי הזכאים ללימודים חינם אינם זכאים.",
    documentsHe: [...DOCS_BASIC, "ספח כתובת ביישוב במועצה", "אישור מנהל/ת קהילה"],
    howToApplyHe: "טופס מקוון בדף מלגת המועצה, לפי המסלול.",
    applyUrl: "https://www.galil-elion.org.il/%D7%9E%D7%9C%D7%92%D7%AA-%D7%9E%D7%95%D7%A2%D7%A6%D7%94-2021",
    notesHe:
      "הדף מתויג תשפ״ו 2026; מועד הסגירה שפורסם הוא 15.3.26. מי שקיבל מלגה שמקורה בכספי המועצה באותה שנה אינו זכאי. חריגים דרך מרכז הצעירים.",
    lastVerified: VERIFIED_GATE,
    sourceUrls: ["https://www.galil-elion.org.il/%D7%9E%D7%9C%D7%92%D7%AA-%D7%9E%D7%95%D7%A2%D7%A6%D7%94-2021"],
    treatment: "selective",
    eligibility: allOf(
      { type: "cityIn", values: ["גליל עליון"] },
      { type: "degreeLevelIn", values: ["ba", "ma", "phd", "practical_engineer"] },
    ),
  }),
  s({
    id: "hillel-yotzim",
    nameHe: "מלגת הלל ליוצאים בשאלה",
    funderHe: "עמותת הלל — יוצאים בשאלה",
    types: ["population", "volunteering", "need"],
    scope: "national",
    amounts: amount(
      "תואר ראשון: 6,000 ₪ (ממוצע 20 שעות שבועיות). גם: פסיכומטרי 2,500 ₪; תעודה 6,000 ₪; מכינה/בגרויות 7,000 ₪; קורס באו״פ 1,200 ₪ (דף מלגות הלל)",
      { min: 1200, max: 7000 },
    ),
    cadence: "annual",
    deadline: deadline(
      "מחזור תשפ״ו נפתח 23.11.25 ונסגר 15.08.2026 (סמסטר קיץ). תשפ״ז תיפתח בנובמבר (דף מלגות הלל)",
      {
        kind: "fixed",
        date: "2026-08-15",
        opensAt: "2025-11-23",
        windowHe: "23.11.2025–15.8.2026",
      },
    ),
    whoItsForHe:
      "חברי הלל שהתקבלו לעמותה ולומדים בתוכנית מוכרת מל״ג או משרד ממשלתי: תואר ראשון, מכינה, תעודה אקדמית, הכשרת הייטק או קורסים מוכרים. הזכאות מותנית בהצטרפות להלל. מקבלי המלגה מתנדבים 20 שעות שנתיות בפרויקט ארזים, עם פטורים להורים, מכינה/פסיכומטרי, מלגה עד 3,000 ₪ ומשרתי מילואים.",
    documentsHe: [...DOCS_BASIC, ...DOCS_BANK, "אישור חברות בהלל"],
    howToApplyHe: "הצטרפות להלל ואז הגשת בקשה למלגה בפורטל העמותה, לפי דף המלגות.",
    applyUrl: "https://hillel.org.il/hillel-4-u/education-2/scholarships/",
    notesHe:
      "לא פוצלו מסלולי סכום — אותו דף הגשה. מחזור תשפ״ו נסגר ב־15.8.2026; מחזור תשפ״ז טרם נפתח בנובמבר. מיון לפי קריטריוני העמותה.",
    lastVerified: VERIFIED_GATE,
    sourceUrls: ["https://hillel.org.il/hillel-4-u/education-2/scholarships/"],
    treatment: "selective",
    eligibility: allOf(
      { type: "degreeLevelIn", values: ["ba", "prep", "practical_engineer", "teaching_certificate"] },
      { type: "willingToVolunteer" },
    ),
  }),
  s({
    id: "vanleer-journeys",
    nameHe: "מסעות דעת — מכון ון ליר",
    funderHe: "מכון ון ליר בירושלים, בשיתוף האוניברסיטה העברית, אוניברסיטת תל אביב ובן־גוריון",
    types: ["leadership", "merit"],
    scope: "national",
    amounts: amount(
      "עד 10,000 ₪ במסלולי העברית ותל אביב; 5,000 ₪ במסלול בן־גוריון (דף ההרשמה למחזור ט׳)",
      { min: 5000, max: 10000 },
    ),
    cadence: "one_time",
    deadline: deadline("מועד אחרון להגשת מועמדות: 12 ביוני 2026 (דף מסעות דעת)", {
      kind: "fixed",
      date: "2026-06-12",
    }),
    archivedReasonHe:
      "חלון ההגשה שפורסם נסגר ב־12.6.2026. הרשומה נשארת להתאמה למחזור הבא. שלושת מסלולי האוניברסיטה לא פוצלו — אותו דף ואותו יום.",
    whoItsForHe:
      "צעירות וצעירים בתחילת לימודיהם האקדמיים באוניברסיטה העברית, באוניברסיטת תל אביב או באוניברסיטת בן־גוריון, העומדים ללמוד בתשפ״ז באחת מהן. תוכנית קיץ 16.8.2026–10.9.2026 במכון ון ליר, קורס שנתי בקמפוס, וקורס קיץ 2027 במסלולי העברית ותל אביב.",
    documentsHe: [...DOCS_BASIC, "מועמדות לפי הקול הקורא של האוניברסיטה"],
    howToApplyHe: "הרשמה בדף מסעות דעת, לפי הקול הקורא של האוניברסיטה שאליה נרשמים.",
    applyUrl: "https://journeys.vanleer.org.il/",
    notesHe:
      "השתתפות ללא תשלום; מגורים בקיץ על חשבון התוכנית. המלגה כפופה למילוי מטלות התוכנית. מיון: קבוצה קטנה ואיכותית.",
    lastVerified: VERIFIED_GATE,
    sourceUrls: ["https://journeys.vanleer.org.il/"],
    institutionIds: ["huji", "tau", "bgu"],
    treatment: "selective",
    eligibility: allOf(
      { type: "institutionIn", values: ["huji", "tau", "bgu"] },
      { type: "degreeLevelIn", values: ["ba"] },
    ),
  }),
  s({
    id: "che-ma-diversity",
    nameHe: "מלגות ות״ת לתואר שני מחקרי — אוכלוסיות גיוון ופריפריה",
    funderHe: "ות״ת / מל״ג",
    types: ["research", "population", "periphery"],
    scope: "national",
    amounts: amount("42,000 ₪ לשנה במשך שנתיים (דף המזכירות האקדמית בתל אביב; דף מל״ג לתשפ״ז)", {
      min: 42000,
      max: 42000,
    }),
    cadence: "multi_year",
    deadline: deadline("בתל אביב: תיקי מועמדים למדור קרנות ומלגות עד 8.9.2026", {
      kind: "fixed",
      date: "2026-09-08",
    }),
    whoItsForHe:
      "סטודנטים מצטיינים לתואר שני מחקרי (עם תזה) מאוכלוסיות הגיוון (חברה ערבית, חרדית, יוצאי אתיופיה) ומהפריפריה החברתית־כלכלית, במוסדות מתוקצבים. עד 60 מלגות דו־שנתיות בארץ. צפויים להתחיל בתשפ״ז או שהתחילו בסמסטר ב׳ תשפ״ו; סיום תואר ראשון עד שלוש שנים לפני ההגשה.",
    documentsHe: [
      "טופס בקשה פנימי וטופס ות״ת",
      "קורות חיים ומכתב אישי",
      "גיליון ציונים ותעודת תואר ראשון",
      "אישור רישום/קבלה לתואר שני מחקרי",
      "שתי המלצות מסגל בכיר",
    ],
    howToApplyHe: "דרך האוניברסיטה / מדור קרנות ומלגות. המועד כאן הוא מועד תל אביב; בחיפה פורסם 8.10.2026.",
    applyUrl: "https://acad-sec.tau.ac.il/scholarships/adams_1701_1707_1708_1710_1806",
    notesHe:
      "מיון: מכסה ארצית + סל תחרותי. אזרחות ישראלית או תושבות קבע. היקף מלא. אין כפל מלגה מתקציב ציבורי ישראלי.",
    lastVerified: VERIFIED_GATE,
    sourceUrls: [
      "https://acad-sec.tau.ac.il/scholarships/adams_1701_1707_1708_1710_1806",
      "https://che.org.il/scholarships/%D7%AA%D7%9B%D7%A0%D7%99%D7%AA-%D7%9E%D7%9C%D7%92%D7%95%D7%AA-%D7%95%D7%AA%D7%AA-%D7%9C%D7%A1%D7%98%D7%95%D7%93%D7%A0%D7%98%D7%99%D7%95%D7%AA-%D7%95%D7%A1%D7%98%D7%95%D7%93%D7%A0%D7%98%D7%99%D7%9D/",
    ],
    treatment: "selective",
    eligibility: allOf(
      { type: "degreeLevelIn", values: ["ma"] },
      { type: "studyLoadFull" },
      {
        op: "anyOf",
        labelHe: "פריפריה או אוכלוסיית גיוון",
        rules: [
          { type: "periphery", of: "either" },
          { type: "sectorIn", values: ["arab", "druze", "bedouin", "circassian", "haredi", "ethiopian"] },
          { type: "firstGeneration" },
        ],
      },
    ),
  }),
  s({
    id: "che-ma-women-hightech",
    nameHe: "מלגות ות״ת למסטרנטיות מצטיינות בהייטק",
    funderHe: "ות״ת / מל״ג",
    types: ["research", "merit", "population"],
    scope: "national",
    amounts: amount(
      "62,000 ₪ לשנה לשנתיים: 42,000 ₪ ות״ת + 20,000 ₪ מלגת קיום מהיחידה/מנחה (דף המזכירות האקדמית בתל אביב לתשפ״ז–תשפ״ח)",
      { min: 62000, max: 62000 },
    ),
    cadence: "multi_year",
    deadline: deadline("בתל אביב: מסמכים למדור קרנות ומלגות עד 8 בספטמבר 2026", {
      kind: "fixed",
      date: "2026-09-08",
    }),
    whoItsForHe:
      "סטודנטיות בשנה האחרונה לתואר ראשון או בעלות תואר ראשון (עד שלוש שנים מהזכאות) שהגישו מועמדות לתואר שני מחקרי בתשפ״ז, או שהתחילו בסמסטר ב׳ תשפ״ו, בהנדסת חשמל/מחשבים/תוכנה/תקשורת/מערכות מידע, מדעי המחשב, פיזיקה ומתמטיקה. עד 10 מלגות ארציות; האוניברסיטה רשאית להמליץ על 4.",
    documentsHe: [
      "טופס בקשה",
      "קורות חיים ומכתב אישי",
      "גיליון ציונים ותעודת תואר ראשון",
      "אסמכתא על קבלה לתואר שני מחקרי",
      "שתי המלצות",
      "אישור היחידה לרכישת מלגת קיום 20,000 ₪",
    ],
    howToApplyHe: "דרך מדור קרנות ומלגות באוניברסיטה. המועד כאן הוא מועד תל אביב.",
    applyUrl: "https://acad-sec.tau.ac.il/scholarships/adams_1723_1724_1725",
    notesHe: "מיון: מכסה. אזרחות ישראלית או תושבות קבע. אין כפל מלגה מתקציב ציבורי ישראלי.",
    lastVerified: VERIFIED_GATE,
    sourceUrls: ["https://acad-sec.tau.ac.il/scholarships/adams_1723_1724_1725"],
    treatment: "selective",
    eligibility: allOf(
      { type: "degreeLevelIn", values: ["ma"] },
      { type: "genderIn", values: ["female"] },
      { type: "fieldOfStudyIn", values: STEM },
    ),
  }),
  s({
    id: "che-ma-data-science",
    nameHe: "מלגות ות״ת לתואר שני מחקרי בבינה מלאכותית ומדעי הנתונים",
    funderHe: "ות״ת / מל״ג",
    types: ["research", "merit"],
    scope: "national",
    amounts: amount(
      "לפחות 75,000 ₪ לשנה למשך שנתיים: 60,000 ₪ ות״ת + לפחות 25% מהמוסד (קול קורא ות״ת מחזור תשפ״ז)",
      { min: 75000, max: 75000 },
    ),
    cadence: "multi_year",
    deadline: deadline("הגשת תיקי המועמדים על ידי המוסדות עד 15.9.2026 (קול קורא ות״ת תשפ״ז)", {
      kind: "fixed",
      date: "2026-09-15",
    }),
    whoItsForHe:
      "סטודנטים מצטיינים לתואר שני מחקרי בבינה מלאכותית ומדעי הנתונים (ליבה, לא יישום כלים קיימים למעטפת בלבד), במוסדות מתוקצבים. סיום תואר ראשון עד שלוש שנים לפני ההגשה. עד 18 מלגות דו־שנתיות; כל מוסד עד 6 מועמדים. הגשה דרך המוסד בלבד.",
    documentsHe: [
      "קורות חיים",
      "גיליונות ציונים לתואר ראשון",
      "שני מכתבי המלצה",
      "פירוט מימון נוסף",
      "התחייבות חתומה לעמידה בתנאי התכנית",
    ],
    howToApplyHe: "דרך רכז/ת המלגות במוסד, במערכת הממוחשבת של ות״ת. המוסד קובע לוח זמנים פנימי עד 15.9.2026.",
    applyUrl:
      "https://acad-sec.tau.ac.il/sites/acadesc.tau.ac.il/files/media_server/acadsec/scholarships/%D7%95%D7%AA%22%D7%AA/data-ma-taka.pdf",
    notesHe:
      "מיון: ועדת שיפוט ארצית. אזרחות ישראלית או תושבות קבע. עבודה עד 8 שעות שבועיות רלוונטיות למחקר, באישור המנחה. אין כפל מלגה מתקציב ציבורי ישראלי.",
    lastVerified: VERIFIED_GATE,
    sourceUrls: [
      "https://acad-sec.tau.ac.il/sites/acadesc.tau.ac.il/files/media_server/acadsec/scholarships/%D7%95%D7%AA%22%D7%AA/data-ma-taka.pdf",
    ],
    treatment: "selective",
    eligibility: allOf(
      { type: "degreeLevelIn", values: ["ma"] },
      { type: "fieldOfStudyIn", values: ["computer_science", "exact_sciences", "engineering", "stem"] },
      { type: "maxEmploymentHours", value: 8 },
    ),
  }),
];
