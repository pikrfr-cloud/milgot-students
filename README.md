# מלגות לסטודנטים / Scholarships for Students

כלי עברי (RTL) לסטודנטים בישראל: ממלאים פרופיל פעם אחת ומקבלים **דוח מול הקטלוג** — כולל מי שעומד בתנאי הסף, חסר פרט לאישור, כמעט־זכאות, בדיקה במוסד, ולא־זכאים.

Hebrew RTL web app for Israeli students. Fill a profile once and get a **complete eligibility report** against a catalog of real scholarships: meet the catalog thresholds, need more info, near-misses, check at the institution, and not eligible.

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
| כל הכללים עוברים והמועד פתוח | **עומדים בתנאי הסף** |
| הכללים עוברים אבל המועד שפורסם למחזור זה כבר עבר | **נסגר למחזור זה — מתאים למחזור הבא** (גלוי, לא מוסתר) |
| אין כישלון, אבל שדה שדולג נדרש; או מלגת ניקוד | **חסר פרט לאישור** (תמיד עם שם השדה, חוץ מניקוד השוואתי) |
| רשומת דיקן / עירייה / רשות בלי תנאי סף מאומתים | **יש לבדוק במוסד/ברשות** (לא מעורבב עם זכאים או חסר פרט) |
| כישלון רק בתנאים שניתן לשנות (התנדבות, היקף, ממוצע) | **כמעט זכאים** |
| כישלון בתנאי זהות (מוסד, קהילה, מגדר, עיר, תחום לימוד, שנת לימוד, מכינה, נתוני קבלה, עולה, סוג שירות, ימי מילואים) | **לא זכאים** |

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

הכלי אינו מחליף את תנאי הקרן. תמיד יש לאמת זכאות, סכום ומועד באתר הרשמי לפני הגשה. האתר לא מגיש בקשות בשם הסטודנט.

קוד: [https://github.com/pikrfr-cloud/milgot-students](https://github.com/pikrfr-cloud/milgot-students).

---

## WhatsApp (Twilio)

The static GitHub Pages export cannot receive Twilio POSTs. A separate Hono
server (Cloudflare Worker or `npm run whatsapp`) implements `POST /whatsapp`
with the same intake + matcher as `/chat/`. Students can answer in ordinary
Hebrew (numbers, synonyms, or an optional cheap Groq/OpenAI model). The
catalog report is split into several WhatsApp messages so Twilio does not
reject bodies over 1600 characters. Deadline reminders use Worker cron + KV
after deploy — not GitHub Pages and not `npm run whatsapp`.
See [`whatsapp/README.md`](whatsapp/README.md).
