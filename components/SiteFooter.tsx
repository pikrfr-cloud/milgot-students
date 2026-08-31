import Link from "next/link";
import { CATALOG_STATS } from "@/data/scholarships";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-forest-deep text-white mt-16">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 sm:grid-cols-3 text-sm">
        <div>
          <p className="font-display text-lg">מלגות לסטודנטים</p>
          <p className="mt-2 text-white/75 leading-relaxed">
            הדוח שלם ביחס לקטלוג זה בלבד. הקטלוג גדל, והנתונים מסומנים לפי מועד אימות.
          </p>
        </div>
        <div>
          <p className="font-medium">פרטיות</p>
          <p className="mt-2 text-white/75 leading-relaxed">
            אין התחברות. הפרופיל נשמר במכשיר שלכם בלבד ואינו נשלח לצד שלישי.
          </p>
        </div>
        <div>
          <p className="font-medium">קטלוג</p>
          <p className="mt-2 text-white/75">{CATALOG_STATS.total} מלגות · עודכן {CATALOG_STATS.lastVerifiedMonth}</p>
          <Link href="/about" className="mt-2 inline-block underline underline-offset-4 text-white/90">
            איך ההתאמה עובדת
          </Link>
          <br />
          <Link href="/accessibility" className="mt-2 inline-block underline underline-offset-4 text-white/90">
            הצהרת נגישות
          </Link>
        </div>
      </div>
    </footer>
  );
}
