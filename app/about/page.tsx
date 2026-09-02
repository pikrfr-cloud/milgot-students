import { CoverageNote } from "@/components/CoverageNote";
import { CATALOG_STATS } from "@/data/scholarships";
import Link from "next/link";
import type { Metadata } from "next";
import { HE } from "@/lib/i18n/he";
import { ExternalLink } from "@/components/ExternalLink";

export const metadata: Metadata = {
  title: "אודות ואיך זה עובד",
  description: "מנוע התאמה דטרמיניסטי מול קטלוג מלגות. הנתונים נשארים במכשיר.",
  alternates: { canonical: "/about/" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 leading-relaxed">
      <h1 className="font-display text-4xl text-forest-deep">אודות ואיך זה עובד</h1>
      <p className="mt-4">
        «מלגות לסטודנטים» הוא שירות להתאמת מלגות לסטודנטים בישראל. המטרה אינה «כמה הצעות יפות»
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
        פרט לאישור». כישלון בתנאי זהות (מוסד, קהילה, מגדר, עיר, תחום לימוד, שנת לימוד, מכינה, נתוני
        קבלה, עולה, סוג שירות, ימי מילואים שכבר נעשו) מופיע תחת «לא זכאים». כישלון בתנאים שניתן לשנות
        (התנדבות, היקף לימודים, ממוצע) — «כמעט זכאים». מצב כלכלי בקטלוג הוא הערכה לפי סדר גודל, לא נוסחת הקרן, ולכן חריגה מהסף מופיעה תחת «חסר פרט לאישור» ולא כפסילה. מועד שהסתיים למחזור שפורסם, כשהשאר מתאים או
        חסר פרט, מופיע תחת «נסגר למחזור זה — מתאים למחזור הבא» ולא מוסתר.
      </p>
      <h2 className="mt-8 font-display text-2xl">פרטיות</h2>
      <p className="mt-3">
        אין חשבון משתמש. הפרופיל נשמר ב־localStorage בדפדפן. הנתונים לא נשלחים לשרת ייעודי ולא לצד
        שלישי.
      </p>
      <h2 className="mt-8 font-display text-2xl">הקטלוג</h2>
      <p className="mt-3">
        כרגע {CATALOG_STATS.total} מלגות להתאמה מול הקטלוג, ועוד {CATALOG_STATS.guide} במדריך
        (דיקן / רשות בלי תנאי סף מאומתים). כולן מבוססות על מקורות פומביים. סכום או מועד לא ודאי
        מסומן במפורש. אימות אחרון: {CATALOG_STATS.lastVerifiedMonth}.
      </p>
      <p className="mt-3">
        רשומות דיקן / עירייה בלי תנאי סף מאומתים מופיעות בדוח תחת «מדריך» — לא כזכאות ולא כספירת מלגות להתאמה.
      </p>
      <CoverageNote className="mt-4" />
      <h2 className="mt-8 font-display text-2xl">קוד פתוח ויצירת קשר</h2>
      <p className="mt-3">{HE.legal.contactGithub}</p>
      <p className="mt-3">
        <ExternalLink className="underline underline-offset-4 ltr-isolate" href={HE.legal.githubRepoUrl}>
          {HE.legal.githubRepoUrl.replace(/^https?:\/\//, "")}
        </ExternalLink>
      </p>
      <p className="mt-4">
        <Link href="/accessibility" className="underline underline-offset-4">
          הצהרת נגישות
        </Link>
      </p>
    </div>
  );
}
