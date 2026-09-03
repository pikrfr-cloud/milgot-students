import type { Metadata } from "next";
import { HE } from "@/lib/i18n/he";
import { LEGAL_UPDATED_HE } from "@/data/scholarships";
import { ExternalLink } from "@/components/ExternalLink";

export const metadata: Metadata = {
  title: "הצהרת נגישות",
  description: "מצב הנגישות של האתר — בלי הצהרה מוסמכת.",
  alternates: { canonical: "/accessibility/" },
};

export default function AccessibilityPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 leading-relaxed">
      <h1 className="font-display text-4xl text-forest-deep">הצהרת נגישות</h1>
      <p className="mt-2 text-sm text-ink-soft">עודכן לאחרונה: {LEGAL_UPDATED_HE}</p>

      <p className="mt-6">
        אתר «מלגות לסטודנטים» הוא שירות להתאמת מלגות. אנו שואפים לאפשר שימוש גם לאנשים עם מוגבלות,
        בהתאם לרוח{' '}
        <span className="whitespace-nowrap">תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), תשע״ג–2013</span>
        {' '}ול־WCAG 2.2 ברמה AA — אך האתר <strong>אינו מוסמך</strong> כרגע כעומד במלוא התקן, ולא נערך
        בו סקר נגישות פורמלי על ידי מכון מוסמך.
      </p>

      <h2 className="mt-8 font-display text-2xl">מה כבר קיים</h2>
      <ul className="mt-3 list-disc pr-5 space-y-2">
        <li>ממשק בעברית, מימין לשמאל.</li>
        <li>קישור «דילוג לתוכן» בראש העמוד.</li>
        <li>סימון פוקוס גלוי לשדות, כפתורים וקישורים.</li>
        <li>
          שדות האשף מקושרים לתווית באמצעות <code>htmlFor</code> ו־<code>aria-labelledby</code> על תיבות
          הבחירה, השדות התלת־מצביים (כן / לא / לא יודע) והקלט. קבוצות תיבות סימון משתמשות ב־
          <code>fieldset</code>/<code>legend</code> במקום <code>htmlFor</code> לשדה יחיד. אין לכל שדה
          מאפיין <code>name</code> — הטופס לא נשלח לשרת, והשמירה היא מקומית במכשיר.
        </li>
        <li>בחירת עיר: ניווט במקלדת (חצים), <code>aria-activedescendant</code>, והרשימה לא נסגרת כשהפוקוס עובר אליה.</li>
        <li>מעבר לשלב הבא באשף מעביר את הפוקוס לכותרת השלב.</li>
        <li>יעדי הקשה של כ־44 פיקסלים בפקדים עיקריים.</li>
        <li>
          מסלול השאלות הקצרות (<code>/chat/</code>): מתחיל בכפתורי בחירה גדולים, שאלה אחת בכל פעם,
          ודילוג שלא מוחק מלגה.
        </li>
        <li>כיבוד <code>prefers-reduced-motion</code> לגלילה חלקה ולאנימציות.</li>
        <li>הדפסה / שמירת PDF שפותחת את פירוט הקריטריונים.</li>
        <li>קישורים חיצוניים מסומנים כנפתחים בחלון חדש.</li>
      </ul>

      <h2 className="mt-8 font-display text-2xl">מגבלות ידועות (כנות)</h2>
      <ul className="mt-3 list-disc pr-5 space-y-2">
        <li>אין עדיין הצהרת נגישות מאושרת על ידי מורשה נגישות שירות, ואין רכז נגישות בשם.</li>
        <li>אין כרגע חלופת שפה פשוטה, תרגום לערבית, או תמלול/כתב חרשים לסרטונים (אין סרטונים באתר).</li>
        <li>
          בחירת עיר מבוססת הקלדה ורשימה; ייתכן שעדיין תדרוש עזרה בטכנולוגיה מסייעת במכשירים או דפדפנים
          מסוימים, גם אחרי תמיכת החצים.
        </li>
        <li>ניגודיות הצבעים מכוונת לקריאות, אך לא נבדקה בכל צירופי ערכות הנושא של מערכת ההפעלה.</li>
        <li>האתר סטטי ופועל בדפדפן בלבד; אין התחברות ואין פרופיל בענן — הנתונים נשמרים במכשיר.</li>
        <li>לא נערכה בדיקת קורא מסך מלאה על כל שלבי האשף בכל המכשירים.</li>
      </ul>

      <h2 className="mt-8 font-display text-2xl">פנייה בנושא נגישות</h2>
      <p className="mt-3">
        {HE.legal.contactIssuesA11y}{" "}
        <ExternalLink className="underline underline-offset-4 ltr-isolate" href={HE.legal.githubIssuesUrl}>
          כתבו לנו
        </ExternalLink>
        .
      </p>
      <p className="mt-3 text-sm text-ink-soft">
        הצהרה זו מתארת את מצב האתר במועד העדכון. היא אינה מחליפה ייעוץ משפטי ואינה מהווה אישור
        שהשירות נגיש במלואו.
      </p>
    </div>
  );
}
