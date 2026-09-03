# WO2 worklog

Work order on `main` (live GitHub Pages, `output: "export"`, `basePath: "/milgot-students"`). Four section commits plus this log. `lib/matcher.ts` and the scholarship data shape were not changed. No scholarships, amounts, or dates were invented.

## WO2-1 City / institution / sector landings + OG funder dedupe

- Reused existing `app/catalog/city`, `institution`, and `sector` routes from the overnight catalog PR. Shared copy lives in `lib/landing-pages.ts`; the pages render `CatalogLandingPage`.
- H1/title shapes are the required תשפ״ז strings. `title.absolute` so the layout template does not append «מלגות לסטודנטים».
- Intro is three sentences from the listed rows only: count, published ₪ range (`minIls`/`maxIls` and not `uncertain`), nearest known `deadline.date`. Missing amount or date → «לא ודאי».
- Chat CTA: city → `?city=`, institution → `?institution=`. ChatIntake hydrates via existing `loadProfileHydratingShare` after `readChatSeedFromLocation` learned those query keys. Empty URL does not wipe a filled stored profile (`mergeUrlSeedWithStored`).
- Sector CTA uses existing `#p=` profile-share (`sectors: [id]`). No second encoding.
- **WO1 polish (same commit):** `scholarshipOgCopy` skips `funderHe` when that token already appears in `nameHe`. Achva is no longer «מלגות — המכללה האקדמית אחוה — המכללה האקדמית אחוה — משתנה · לא ודאי». Catalog OG titles stay unique.
- Qualifying landings (≥2 catalog rows): 4 cities, 30 institutions, 6 sectors. One-row city/institution pages from overnight were kept and upgraded (same component) so existing URLs do not 404.

## WO2-2 No-volunteering and miluim

- Upgraded `app/catalog/group/[id]` for `without-volunteering` and `miluim` (slugs already existed). Same intro + list + chat button.
- Titles: «מלגות ללא התנדבות תשפ״ז» / «מלגות למילואימניקים תשפ״ז».
- Chat seeds via `#p=`: `{ willingToVolunteer: false }` and `{ service: "idf", reservistDaysLastYear: 1 }`. The day count is the smallest filled reservist flag — not a typical-service invention — so the miluim question is skipped without claiming 30 days.
- Periphery uses the same group page, so it received the same structure and «מלגות לפריפריה תשפ״ז» rather than a leftover old H1. Not requested; kept for one component.

## WO2-3 ItemList JSON-LD + sitemap

- Every collection landing emits schema.org `ItemList` with a `ListItem` per listed scholarship (`position`, `name`, `url`). Sort matches the visible list (soonest known deadline first).
- Sitemap already listed city/institution/sector/group URLs (`sitemapEntries`). Vitest checks every collection landing href is present, and that JSON-LD parses and contains every listed item.

## WO2-4 About + report-an-error

- About explains official-source verification in student Hebrew. Last verification date is `COUNTS.lastVerifiedMonth` (same value as `CATALOG_STATS.lastVerifiedMonth`: `2026-09-02` → «2 בספטמבר 2026»).
- Public repo link is `HE.legal.githubRepoUrl`.
- «דווחו על טעות» is `IssuesLink` with `template` / `title` / `body` / `labels`. Template file: `.github/ISSUE_TEMPLATE/report-error.yml`. Label is existing `bug` (did not invent a `data` label). No operator name, photo, ח.פ., or payments.

## Skipped / not in scope

- Did not push directly to `main` (no assumption of write access to the default branch); PR against `main`.
- Did not add per-scholarship OG images (already skipped in WO1; static export still uses default `og.png`).
- City index follows existing `collectCityValues` eligibility walk — only four cities currently have ≥2 rows, so institution pages carry most of the 15+ landing requirement. Municipal funds whose city is not in eligibility do not get a city landing from this work order.
- `jewish_general` has no sector landing (empty in `catalogSectors()`).
- Chat does not apply `applyChatAction` for URL seeds; filled profile fields already skip those questions in `nextChatQuestion`. Overlay merge is enough and avoids wiping stored answers.
- No operator identity, payments, or new catalog rows.
