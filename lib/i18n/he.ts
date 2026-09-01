/** Hebrew UI copy. Single locale — do not add a second language here. */

export const HE = {
  siteName: "מלגות לסטודנטים",
  tagline: "דוח זכאות מלא",
  skipToContent: "דילוג לתוכן",
  serviceNotPublicTool: "שירות",

  nav: {
    home: "ראשי",
    profile: "פרופיל",
    results: "הדוח שלי",
    catalog: "קטלוג",
    about: "אודות",
    accessibility: "נגישות",
    terms: "תנאי שימוש",
    privacy: "פרטיות",
    menu: "תפריט",
    close: "סגור",
  },

  buckets: {
    eligible: "עומדים בתנאי הסף",
    eligibleHint: "התנאים שבקטלוג מתקיימים — לא אישור זכייה ולא הגשה בשמכם.",
    selective: "מיון תחרותי",
    closedCycle: "נסגר למחזור זה",
    closedCycleLong: "נסגר למחזור זה — מתאים למחזור הבא",
    needInfo: "חסר פרט לאישור",
    nearMiss: "כמעט זכאים",
    checkAtInstitution: "לבדוק במוסד",
    checkAtInstitutionLong: "יש לבדוק במוסד/ברשות",
    ineligible: "לא זכאים",
    myList: "הרשימה שלי",
    tips: "טיפים והפניות",
  },

  actions: {
    continue: "המשך",
    back: "הקודם",
    edit: "עריכה",
    print: "הדפסה / שמירה כ‑PDF",
    exportJson: "ייצוא פרופיל (JSON)",
    importJson: "ייבוא פרופיל",
    deleteAll: "מחק את כל הנתונים שלי",
    addToCalendar: "הוספה ליומן (ICS)",
    exportMyListIcs: "ייצוא הרשימה ליומן (ICS)",
    showDetails: "הצג פרטים",
    hideDetails: "הסתר פרטים",
    showIneligible: "הצג את כל מה שנבדק",
    hide: "הסתר",
    tryAgain: "נסו שוב",
    startProfile: "להתחיל את הפרופיל",
    toCatalog: "לעיין בקטלוג",
    toHome: "לעמוד הראשי",
    produceReport: "להפקת דוח הזכאות",
    skip: "לא יודע/ת — דלג",
    showFilters: "סינון",
  },

  profile: {
    loading: "טוען את הפרופיל…",
    emptyTitle: "אין עדיין פרופיל",
    emptyBody: "כדי לקבל דוח זכאות יש למלא את הפרטים פעם אחת.",
    fillProfile: "למילוי הפרופיל",
    exportWarn:
      "הקובץ מכיל את פרטי הפרופיל שמילאתם (כולל מצב כלכלי ושיוך קהילתי). שמרו אותו במקום בטוח ואל תשלחו אותו בלי צורך.",
    deleteConfirm: "למחוק את כל הנתונים השמורים במכשיר זה? לא ניתן לשחזר.",
    importFail: "לא הצלחנו לקרוא את הקובץ. ודאו שזה ייצוא JSON מהאתר.",
    unknownCity:
      "העיר לא ברשימה — נשמור את מה שהקלדתם. ייתכן שיופיעו פחות התאמות עירוניות.",
  },

  results: {
    title: "דוח הזכאות",
    editProfile: "לערוך פרופיל",
    iphonePrint: "באייפון: שתפו → הדפסה, או בחרו «שמירה כ‑PDF» בתיבת ההדפסה.",
    afterFilter: " (לפי הסינון הנוכחי)",
    printSummary: "סיכום להדפסה",
    urgentTitle: "הדחופות ביותר להגשה",
    urgentNone: "אין כרגע מלגות עם מועד הגשה מפורסם שעדיין פתוח.",
    fillFieldUnlock: "מלא שדה {field} ותפתח ~{n} מלגות",
    catalogAge: "הקטלוג אומת לפני {n} חודשים",
  },

  legal: {
    notOfficial:
      "הדוח אינו החלטת זכאות רשמית של הקרן או של רשות. תמיד יש לאמת באתר המלגה לפני הגשה.",
    localOnly: "הנתונים נשמרים ב־localStorage במכשיר זה בלבד ואינם נשלחים לשרת.",
    deletionRight: "אפשר למחוק את כל הנתונים השמורים במכשיר בכל עת.",
    identityUnpublished:
      "פרטי זהות של מפעיל האתר וכתובת דוא״ל ליצירת קשר עדיין לא פורסמו. אין חשבון משתמש, והנתונים נשארים במכשיר זה בלבד.",
    githubRepoUrl: "https://github.com/pikrfr-cloud/milgot-students",
    githubIssuesUrl: "https://github.com/pikrfr-cloud/milgot-students/issues",
    contactGithub:
      "פניות, דיווחי תקלות ונגישות: Issues במאגר GitHub הציבורי. פרטי זהות של המפעיל עדיין לא פורסמו, ואין דוא״ל באתר.",
  },

  errors: {
    title: "משהו השתבש",
    body: "לא הצלחנו להציג את העמוד. הנתונים השמורים במכשיר לא נמחקו.",
    notFoundTitle: "העמוד לא נמצא",
    notFoundBody: "אין עמוד בכתובת הזו. אפשר לחזור לראשי או לקטלוג.",
  },

  review: {
    ctaHint: "אפשר להפיק את הדוח עכשיו, או לתקן שדות למטה.",
    filled: "שדות שמולאו",
    skipped: "שדות שדולגו",
    topUnblock: "שלושת השדות שיפתחו הכי הרבה מלגות תחת «חסר פרט»",
  },
} as const;

export type HeKey = typeof HE;
