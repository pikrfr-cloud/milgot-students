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

## WO2-1-fix City slug 404

- Next static export passes `params.slug` percent-encoded (`%D7...`). `cityFromSlug` compared that to the raw Hebrew slug, so every `/catalog/city/<slug>/` page called `notFound()` («העמוד לא נמצא») in `out/` and on GitHub Pages.
- Decode `decodeURIComponent` (including a double-encoded pass) before city lookup. Same decode on institution / sector / group dynamic params so they cannot 404 the same way.
- Vitest: encoded `תל-אביב-יפו` resolves and the landing has ItemList JSON-LD. `postbuild` / export test assert **`<title>` and `<h1>` only** (good page: «מלגות לסטודנטים ב… תשפ״ז»; 404: «העמוד לא נמצא»). Never search the raw HTML — Next puts the layout notFound string in every RSC payload.

# WO3 worklog

Work order on `main` (live GitHub Pages, `output: "export"`, `basePath: "/milgot-students"`). Three section commits plus this log. `lib/matcher.ts` and the scholarship data shape were not changed. No scholarships, amounts, or dates were invented. No real API keys, tokens, or phone numbers.

## WO3-1 WhatsApp reminders

- Hash: `f6bead72843a794bc69f03e3e245e42c8383a5c9`
- Worker now exports `{ fetch, scheduled }`. Cron `0 4 * * *` UTC is meant as morning Asia/Jerusalem (IDT = UTC+3 → 07:00). Date math uses the Asia/Jerusalem calendar day, not the isolate UTC date. Seven days before catalog `deadline.date` only; no `opensAt`, prose, or invented dates.
- Subscriptions and sent-keys live in Cloudflare KV binding `REMINDERS` with placeholder id `00000000000000000000000000000000`. README has `wrangler kv namespace create` and paste-the-id steps. `npm run whatsapp` (Node) has no cron and no KV — reminders fire only after `wrangler deploy`.
- «תזכורת» after a completed report (WhatsApp session or a `#p=` results URL in the message) stores From + matcher-**eligible** ids that have `deadline.date`. No completed report → Hebrew “finish the questions first”, no empty subscribe. «הפסק» / «stop» cancel the KV subscription and confirm in Hebrew; they do not wipe the questionnaire. Twilio-level STOP/opt-out is a separate carrier setting.
- Outbound send uses `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` (never hardcoded). Missing secrets → skip send and log. Inbound signature checks unchanged. Dedup: same From + scholarship id + deadline date at most once.
- **בטיפול:** share URLs (`encodeSharedProfile` / `sharedResultsUrl` / CopyReportLink) encode the student profile only. List status is `localStorage` (`milgot-tracking-v1`) on the site. Reminders do not cover «בטיפול».

## WO3-2 Results WhatsApp button

- Hash: `9f291a392dd350741f9ad0b277237d180f3affea`
- Button copy: «שלחו לי תזכורת בוואטסאפ». Number from `NEXT_PUBLIC_WHATSAPP_BOT_NUMBER` only. Empty/whitespace (GitHub Pages default) hides the button — no broken wa.me. Hidden also when `encodeSharedProfile` is null (same as CopyReportLink).
- When set to placeholder `9725XXXXXXXX`, href is `wa.me/9725XXXXXXXX` with prefilled `תזכורת` plus the existing `#p=` report URL. Does not reuse `WhatsAppShareLink`. `.env.example` is committed (`!.env.example`); placeholder only.

## WO3-3 Privacy analytics

- Hash: `215aef135c7045d1c014d047cf313c801efcfdd7`
- Plausible-compatible loader: both `NEXT_PUBLIC_ANALYTICS_URL` and `NEXT_PUBLIC_ANALYTICS_SITE_ID` required. Either empty → no `<script>`, `trackEvent` is a no-op, no outbound analytics request. Default Pages/CI build is off.
- Events (name only, no cookies, no phone, no profile fields): `chat_start`, `chat_complete`, `report_view`, `apply_click` («קישור להגשה»). Native `<script defer data-domain>` in the root layout; it renders `null` when env is empty so the export never embeds it.
- Privacy page (and `HE.legal`): what is counted when on; currently off when env is empty; no cookies; answers stay on-device.
- `postbuild` + vitest assert **real `<script src>` / `data-domain` / `data-website-id` attributes** on `out/` HTML (home, privacy, chat, results, about). Not a raw-string search of RSC payloads.

## Skipped / not in scope

- Did not push directly to `main`; PR against `main`. Did not merge. Did not deploy the Worker. Did not add GitHub secrets.
- No «בטיפול» reminders — there is no per-scholarship in-progress list in the share URL or WhatsApp session.
- No operator name, photo, or ח.פ. No live Twilio join code or real phone number.
- Questionnaire sessions remain in-memory (pre-existing). Reminder subscriptions are the KV piece; a lost in-memory session still cannot subscribe without a report or `#p=` URL.
- Native analytics `<script>` kept (returns null when off). `next/script` not needed for the empty-env export.

