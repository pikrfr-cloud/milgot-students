# מלגות לסטודנטים / Scholarships for Students

כלי עברי (RTL) לסטודנטים בישראל: ממלאים פרופיל פעם אחת ומקבלים **דוח זכאות מלא** מול קטלוג מלגות אמיתי — כולל זכאים עכשיו, חסר פרט לאישור, כמעט־זכאות, ולא־זכאים.

Hebrew RTL web app for Israeli students. Fill a profile once and get a **complete eligibility report** against a catalog of real scholarships: eligible now, need more info, near-misses, and not eligible.

אין התחברות. הפרופיל נשמר ב־`localStorage` במכשיר בלבד ואינו נשלח לצד שלישי.

---

## הרצה / Run

```bash
npm install
npm run dev
```

פתחו [http://localhost:3000/milgot-students/](http://localhost:3000/milgot-students/).

```bash
npm test          # Vitest — matcher + catalog integrity
npm run build     # static export → out/
```

דרישות: Node 20+.

האתר מפורסם כ־GitHub Pages מ־`out/` בכתובת
[https://pikrfr-cloud.github.io/milgot-students/](https://pikrfr-cloud.github.io/milgot-students/).
ב־Settings → Pages יש לבחור Source: GitHub Actions.

---

## איך ההתאמה עובדת / How matching works

**לא** לפי מילות מפתח או embeddings.

כל מלגה מקודדת כעץ כללים (`allOf` / `anyOf` / `not`) עם פרדיקטים מטיפוס, למשל:

- `institutionIn`, `degreeLevelIn`, `yearOfStudyIn`
- `minAverage`, `fieldOfStudyIn`, `studyLoadFull`
- `periphery`, `nationalPriority`, `cityIn`
- `serviceIn`, `combatRole`, `reservistDaysMin`
- `sectorIn`, `isOleh`, `hasDisability`
- `incomeAtMost`, `familyFlagIn`, `willingToVolunteer`

ההערכה דטרמיניסטית מול הפרופיל:

| מצב | משמעות |
| --- | --- |
| כל הכללים עוברים והמועד פתוח | **זכאים עכשיו** |
| אין כישלון, אבל שדה שדולג נדרש; או מלגת ניקוד / דיקן-שלד | **חסר פרט לאישור** |
| כישלון רק בתנאים שניתן לשנות (התנדבות, היקף, ממוצע, מילואים, מכינה…) | **כמעט זכאים** |
| כישלון בתנאי זהות (מוסד, קהילה, מגדר, עיר, עולה, סוג שירות) או מועד שעבר | **לא זכאים** |

שדה `null` / דילוג **לעולם לא נחשב לכישלון**.

הקוד: `lib/matcher.ts`. הבדיקות: `tests/matcher.test.ts` (פרופילים: שנה א׳ בתל אביב מהפריפריה; תואר שני STEM בטכניון; סטודנט ערבי בחיפה; סטודנט חרדי במכללה; עולה).

---

## הקטלוג / Catalog

הרשומות ב־`data/scholarships/` (לאומי, אוניברסיטאות, מכללות, עירוני, קרנות). כל רשומה כוללת:

`id`, `nameHe`, `funderHe`, `amounts`, `cadence`, `deadline`, `applyUrl`, `documentsHe`, `eligibility`, `lastVerified`, `sourceUrls`.

אם סכום או מועד לא ודאי — זה מסומן ב־`uncertain: true` ובטקסט. **אין מלגות בדויות.**

הדוח שלם ביחס לקטלוג זה; הקטלוג גדל.

### הוספת מלגה / Adding a scholarship

1. בחרו קובץ לפי סוג: `national.ts`, `universities.ts`, `colleges.ts`, `municipal.ts`, `foundations.ts`.
2. הוסיפו אובייקט עם `s({ ... })` ועזרי `allOf` / `anyOf` / `amount` / `deadline` מ־`helpers.ts`.
3. מזהה `id` באנגלית, ייחודי.
4. צרפו `sourceUrls` אמיתיים. אם חסר סכום — כתבו זאת במפורש, אל תמציאו.
5. הרכיבו `eligibility` מפרדיקטים, לא מ־if ייעודי במנוע.
6. הוסיפו בדיקה ב־`tests/matcher.test.ts` אם זו מלגה שחשוב שלא תיפול מהדוח.

דוגמה:

```ts
s({
  id: "example-fund",
  nameHe: "מלגת דוגמה",
  funderHe: "שם הקרן",
  types: ["need"],
  scope: "national",
  amounts: amount("עד 5,000 ₪", { max: 5000, uncertain: true }),
  cadence: "annual",
  deadline: CHECK_ANNUALLY,
  whoItsForHe: "…",
  documentsHe: ["צילום תעודת זהות"],
  howToApplyHe: "באתר הקרן",
  applyUrl: "https://…",
  lastVerified: VERIFIED,
  sourceUrls: ["https://…"],
  eligibility: allOf(
    { type: "degreeLevelIn", values: ["ba"] },
    { type: "incomeAtMost", value: "low" },
  ),
})
```

---

## מחסנית / Stack

Next.js (App Router) static export + TypeScript + Tailwind CSS v4. ממשק עברית מלא, `dir="rtl"`, מחסנית פונטים עברית (Segoe UI / Times New Roman / Arial Hebrew).

ייצוא הדוח: הדפסה לדפדפן / שמירה כ־PDF (גיליון הדפסה עברי).

---

## הבהרה

הכלי אינו מחליף את תנאי הקרן. תמיד יש לאמת זכאות, סכום ומועד באתר הרשמי לפני הגשה.
