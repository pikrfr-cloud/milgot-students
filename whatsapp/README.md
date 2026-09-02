# WhatsApp webhook (Twilio)

Same conversational intake as the site chat
([`/chat/`](https://pikrfr-cloud.github.io/milgot-students/chat/)):
`lib/chat-intake.ts` question order, skip, and `StudentProfile` mapping, then
the existing `lib/matcher.ts` over `data/scholarships`.

GitHub Pages stays a **static export**. This server is separate so Twilio can
`POST` here.

Sessions are keyed by WhatsApp `From` and stored **in memory**. That is enough
for a single Node process or one Worker isolate. After `wrangler deploy`,
Cloudflare may route the next message to another isolate — add KV or a Durable
Object before treating production as durable.

## Twilio sandbox

1. Join the sandbox from the student’s phone (Twilio console shows the join
   code).
2. Console → Messaging → Try it out → Send a WhatsApp message →
   **When a message comes in** =
   `POST https://<host>/whatsapp`
   (form-encoded; no `/api` route on the Pages site).
3. Optional: `npx wrangler secret put TWILIO_AUTH_TOKEN` so inbound signatures
   are checked. If the token is missing, the server logs a warning and still
   replies (dev / first sandbox test).

Sandbox keywords `join` and `stop` are ignored and do not reset the
questionnaire. `התחלה` / `start` / `התחל מחדש` start over.

## Deploy (Cloudflare Worker)

```bash
npx wrangler deploy
```

Then set Twilio to `POST https://<worker-host>/whatsapp`.

If Twilio sits behind a tunnel whose public URL differs from the request URL
the Worker sees, set `TWILIO_WEBHOOK_URL` to the exact public `https://…/whatsapp`
Twilio calls (Worker: `wrangler secret` / `[vars]`; local: environment).

## Run locally

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
ship that mode.

## What students get

Hebrew replies as TwiML `<Response><Message>`. Choice questions list numbered
options plus `דלג`. After the same completion rule as the site (`3` filled
wizard fields, or the short question list is done), a compact catalog summary:
bucket counts, a few top matches with ₪ / deadline **when the catalog has
them**, and a link to `/results/` on the site. The link carries the answers
just given (`#p=` hash — not sent to GitHub Pages as a query) so the browser
can hydrate `localStorage` and show the same matcher report. No fund decision
is claimed.

There is no payment flow and no operator identity on this endpoint.
