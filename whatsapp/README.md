# WhatsApp webhook (Twilio)

Same conversational intake as the site chat
([`/chat/`](https://pikrfr-cloud.github.io/milgot-students/chat/)):
`lib/chat-intake.ts` question order, skip, and `StudentProfile` mapping, then
the existing `lib/matcher.ts` over `data/scholarships`.

GitHub Pages is a **static export**. It cannot receive Twilio POSTs. This
Worker is required for inbound WhatsApp.

Questionnaire sessions are keyed by WhatsApp `From` and stored **in memory**.
That is enough for a single Node process or one Worker isolate. After
`wrangler deploy`, Cloudflare may route the next message to another isolate —
add KV or a Durable Object for the questionnaire before treating chat as
durable. **Reminder subscriptions** are stored in Cloudflare KV (`REMINDERS`).

`npm run whatsapp` (Node) has **no cron and no KV**. Deadline reminders only
fire after `wrangler deploy` with the cron trigger in `wrangler.toml`.

## 1. Twilio account + WhatsApp sender

1. Create a Twilio account. Start with the **WhatsApp sandbox**, then a real
   sender when ready.
2. The sandbox join code and the sender number are **only in the Twilio
   console**. Do not put a live join code or a real phone number in this repo.
3. Console → Messaging → Try it out → Send a WhatsApp message →
   **When a message comes in** =
   `POST https://<worker-host>/whatsapp`
   (form-encoded; no `/api` route on GitHub Pages).

Sandbox keyword `join` is ignored and does not reset the questionnaire.
`התחלה` / `start` / `התחל מחדש` start over.

`הפסק` / `stop` (trim, case-insensitive) **cancels the reminder
subscription**. It does not wipe the questionnaire. **Twilio-level STOP /
opt-out** (carrier opt-out) is separate: Twilio may still block further
messages even after our KV subscription is deleted, and our handler cannot
undo that.

## 2. Env / secrets

Never commit real SID, tokens, or phone numbers. Placeholders only
(`ACxxxxxxxx`, `whatsapp:+9725XXXXXXXX`).

| Name | Secret? | Where | Purpose |
| --- | --- | --- | --- |
| `TWILIO_ACCOUNT_SID` | yes | `wrangler secret put` | Outbound reminder send |
| `TWILIO_AUTH_TOKEN` | yes | `wrangler secret put` | Inbound signature check + outbound send |
| `TWILIO_WHATSAPP_FROM` | yes | `wrangler secret put` | From, `whatsapp:+…` as shown in Twilio |
| `TWILIO_WEBHOOK_URL` | if the public URL differs from what the Worker sees | `wrangler secret put` or `[vars]` | Exact public `https://…/whatsapp` Twilio calls |
| `WHATSAPP_LLM_API_KEY` | yes | `wrangler secret put` | Optional cheap NLU (Groq / OpenAI). Empty → numbers + synonyms only |
| `WHATSAPP_LLM_BASE_URL` | no | `[vars]` or env | OpenAI-compatible base. Default `https://api.groq.com/openai/v1` |
| `WHATSAPP_LLM_MODEL` | no | `[vars]` or env | Default `llama-3.1-8b-instant` (cheap/fast). Or `gpt-4o-mini` on OpenAI |

```bash
npx wrangler secret put TWILIO_ACCOUNT_SID
npx wrangler secret put TWILIO_AUTH_TOKEN
npx wrangler secret put TWILIO_WHATSAPP_FROM
# optional:
npx wrangler secret put TWILIO_WEBHOOK_URL
# optional free-text understanding (Groq is cheapest for this bot):
npx wrangler secret put WHATSAPP_LLM_API_KEY
```

Without `WHATSAPP_LLM_API_KEY` the bot still works: numbered choices, Hebrew
synonyms («תואר ראשון», «הפתוחה», «שנה שלישית», «לראות מלגות»), and skip/reset.
The LLM is a fallback only after the deterministic parser returns unparsed.

The counselor report is several sequential TwiML `<Message>` bodies (each under
1500 characters). One concatenated WhatsApp body over 1600 is rejected by
Twilio (error 21617) and the student never sees the report. Do not collapse
chunks into a single URL-only fallback — send the ✅ / «אין מתאים» lead first,
then the 🔗 results URL. Cap at about six `<Message>` nouns by dropping
near-miss/closed sections before eligible + URL.

`[vars]` in `wrangler.toml` is only for non-secrets. Do not put tokens there.
Local Node: the same names as environment variables. If outbound secrets are
missing, reminder send is skipped and logged (no crash).

## 3. KV namespace for reminders

```bash
npx wrangler kv namespace create REMINDERS
```

Copy the printed **id** into `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "REMINDERS"
id = "PASTE_ID_FROM_CREATE_HERE"
```

The checked-in id `00000000000000000000000000000000` is a **placeholder**, not
a live namespace.

## 4. Deploy

```bash
npx wrangler deploy
# or
npm run whatsapp:deploy
```

Confirm the Worker URL. Then in Twilio set **When a message comes in** to:

`POST https://<worker-host>/whatsapp`

After deploy, open the Worker in the Cloudflare dashboard and confirm the
cron `0 4 * * *` is listed under Triggers. That slot is 04:00 UTC, intended
as morning Asia/Jerusalem (IDT = UTC+3 → 07:00).

## 5. Run locally (intake only)

```bash
npm run whatsapp
```

Listens on `http://localhost:8787/whatsapp` (`PORT` overrides the port).
Expose it:

```bash
cloudflared tunnel --url http://localhost:8787
# or
ngrok http 8787
```

Set Twilio **When a message comes in** to `POST https://<tunnel-host>/whatsapp`.

Dev without a token: signature validation is skipped (warning only). Do not
ship that mode. Local Node **will not** send deadline reminders (no cron).

## Reminders

A student who already received a report and then sends **«תזכורת»** is stored
in KV (From + scholarship ids). The daily cron sends one WhatsApp message
**seven Asia/Jerusalem calendar days before** each stored item’s catalog
`deadline.date` (ISO day only). No `deadline.date` → never queued or sent.
`opensAt`, window prose, and invented dates are not used.

Dedup: the same From + scholarship id + deadline date is sent at most once
(KV `sent:` keys).

«הפסק» / «stop» deletes the KV subscription and confirms in Hebrew.

If they have no completed report yet (and the message has no shareable
results URL), the bot tells them to finish the questions first and does not
subscribe empty.

### Limitation: no «בטיפול»

Report-share URLs (`encodeSharedProfile` / `sharedResultsUrl` / CopyReportLink)
encode the **student profile only**. «בטיפול» / in-progress list status lives
in `localStorage` on the site (`milgot-tracking-v1`) and is **not** in the
share link or the WhatsApp session.

Reminders therefore cover matcher-**eligible** («מתאים») scholarships from
the last completed report in that WhatsApp session (or from a `#p=` results
URL in the «תזכורת» message, same profile as the site report). There is no
in-progress list on the bot.

## What students get

Hebrew replies as TwiML `<Response><Message>`. Choice questions list numbered
options plus `דלג`. Students can answer in ordinary Hebrew or send a number.
«לראות מלגות» / «דוח» asks for the catalog summary. After the same completion
rule as the site (`3` filled wizard fields, or the short question list is done),
the report is several short WhatsApp messages: ✅ eligible, 🟡 need-info,
🟠 near-miss, 🏫 institution, 📅 closed, then the full-report URL. Amounts and
dates appear **only when the catalog has them**. No fund decision is claimed.

There is no payment flow and no operator identity on this endpoint.
