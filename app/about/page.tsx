import { CoverageNote } from "@/components/CoverageNote";
import { CATALOG_STATS } from "@/data/scholarships";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 leading-relaxed">
      <h1 className="font-display text-4xl text-forest-deep">אודות ואיך זה עובד</h1>
      <p className="mt-4">
        «מלגות לסטודנטים» הוא כלי ציבורי להתאמת מלגות לסטודנטים בישראל. המטרה אינה «כמה הצעות יפות»
        אלא שלמות: אחרי מילוי פרופיל אחד, אפשר לראות כל מלגה בקטלוג — כולל כאלה שלא מתאימות, עם
        הסיבה.
      </p>
      <h2 className="mt-8 font-display text-2xl">מנוע ההתאמה</h2>
      <p className="mt-3">
        אין חיפוש סמנטי ואין מילות מפתח. לכל מלגה יש עץ כללים (all-of / any-of / not) עם תנאים
        מטיפוסים: מוסד, תואר, ממוצע מינימלי, פריפריה, שירות, קהילה, הכנסה ועוד. ההערכה דטרמיניסטית
        מול הפרופיל.
      </p>
      <p className="mt-3">
        שדה שדולג בפרופיל לעולם לא נחשב לכישלון. אם הכלל דורש את השדה — המלגה עוברת לקטגוריית «חסר
        פרט לאישור». כישלון של קריטריון אחד או שניים מופיע תחת «כמעט זכאים». שלושה כישלונות ומעלה —
        «לא זכאים», מוסתר כברירת מחדל וניתן לחיפוש.
      </p>
      <h2 className="mt-8 font-display text-2xl">פרטיות</h2>
      <p className="mt-3">
        אין חשבון משתמש. הפרופיל נשמר ב־localStorage בדפדפן. הנתונים לא נשלחים לשרת ייעודי ולא לצד
        שלישי.
      </p>
      <h2 className="mt-8 font-display text-2xl">הקטלוג</h2>
      <p className="mt-3">
        כרגע {CATALOG_STATS.total} רשומות, כולן מבוססות על מקורות פומביים. סכום או מועד לא ודאי
        מסומן במפורש. אימות אחרון: {CATALOG_STATS.lastVerifiedMonth}.
      </p>
      <CoverageNote className="mt-4" />
      <h2 className="mt-8 font-display text-2xl">הוספת מלגה</h2>
      <p className="mt-3">
        מוסיפים אובייקט בקובץ המתאים תחת <code>data/scholarships/</code> עם מזהה ייחודי, שם בעברית,
        קרן, סכומים, מועד, מסמכים, קישור, ומבנה <code>eligibility</code>. ראו README.
      </p>
    </div>
  );
}
