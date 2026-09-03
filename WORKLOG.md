# WO1 worklog

Work order on `main` (live site GitHub Pages, `output: "export"`, `basePath: "/milgot-students"`). Four section commits plus this log. `lib/matcher.ts` and the scholarship data shape were not changed.

## WO1-1 Homepage

- H1 is the exact required sentence. The old two-line H1 and the intro that mixed counts into marketing copy were replaced.
- Trust line uses real `data/counts.json` values: `matchable` is 104; `lastVerifiedMonth` is `2026-09-02` (already present from the counts pipeline / PR #21). Mapped `YYYY-MM` / `YYYY-MM-DD` → `ספטמבר 2026` via `hebrewMonthYear`. The field was not missing, so nothing was derived from catalog age.
- «הקוד פתוח» is the same phrase as specified; it links to the public GitHub repo (already in `HE.legal.githubRepoUrl`) so the open-source claim is checkable.
- Three bullets use the required phrases only. No new colors.

## WO1-2 Results + amount legend

- The duplicate was `HE.results.completeToUnlock` as both `<h2>` and the paragraph under it. Heading kept; body is now `completeToUnlockHint` («אם תענו על עוד שאלות, נדע אם עוד מלגות מתאימות לכם.»).
- `HE.chat.needInfoHuman` («עוד שאלה אחת תפתח עוד מלגות») is still the need-info bucket label, not a second sentence under the same heading.
- Amount legend chips stay the same colors. Each is a focusable button with `aria-describedby` + `role="tooltip"`. Tooltips open on hover/focus (CSS, no extra client bundle) so they work in the static export. One sentence per label, no invented amounts.

## WO1-3 `/closing/`

- Filter lives in `lib/closing.ts` (not matcher): known `deadline.date` only, `0…30` days in Asia/Jerusalem, soonest first. Undated rows are dropped, never filled in.
- List is unique-by-`applyUrl` matchable records, same student-facing catalog as the homepage counts.
- The page is SSG: the 30-day window is computed at build/`new Date()` so GitHub Pages HTML includes the list without JS. ICS download still needs a click handler (`downloadIcs` / `downloadCombinedIcs`). WhatsApp is a `wa.me` link via the existing `WhatsAppShareLink` + `whatsappShareHref` (no Business API).
- SEO title uses the Hebrew month/year of build «now», not a made-up deadline: `מלגות שנסגרות ב-{month} {year} — רשימה מעודכנת` (`title.absolute` so the layout template does not rewrite it).
- Nav label «נסגר בקרוב»; homepage `UrgentNowStrip` heading links to `/closing/`. Sitemap via `STATIC_PAGES`.
- Combined ICS filename is optional `milgot-closing.ics` (default for my-list stays `milgot-my-list.ics`). Per-row label is the requested «הוסף ליומן».
- Volunteering comes from existing `volunteeringChipHe` (structured flags, not free-text guessing).

## WO1-4 Scholarship OG

- `generateMetadata` now sets unique `title` / `description` / `openGraph` / `twitter` per id. Amount is `amountHeadlineHe` (published number or existing short text). Deadline is `formatHebrewLongDate` when `deadline.date` exists, otherwise «לא ודאי».
- Two חבל מודיעין records share name + amount + date; funderHe is included in the title so OG titles stay unique without inventing copy.

### Skipped: per-scholarship OG images

`next/og` `ImageResponse` at build would need an embedded Hebrew font and would generate ~160 PNGs on every GitHub Pages export. That is a real complication for `output: "export"`. Layout still serves the existing default `og.png`. Unique title + description are in the HTML meta tags. Skip documented here as the work order allows.

## Also skipped / not in scope

- No operator name, photo, ח.פ., or payments.
- No new scholarships, amounts, or close dates.
- Did not push directly to `main` (no assumption of write access to default branch); PR against `main` instead.
- `/closing/` window is as of deploy, not a live server clock, because the site is a static export. Same constraint as other SSG pages. Client ICS/share still run in the browser.
