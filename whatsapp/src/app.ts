import { Hono } from "hono";
import type { Context } from "hono";
import { handleWhatsAppPost, type WhatsAppEnv } from "./handler";

export type Bindings = WhatsAppEnv;

export const app = new Hono<{ Bindings: Bindings }>();

const HELP =
  "milgot-students WhatsApp webhook. Set Twilio «When a message comes in» to POST this URL.";

async function postWhatsApp(c: Context<{ Bindings: Bindings }>) {
  const result = await handleWhatsAppPost({
    rawBody: await c.req.text(),
    requestUrl: c.req.url,
    signature: c.req.header("X-Twilio-Signature") ?? undefined,
    env: c.env,
  });
  return new Response(result.xml, {
    status: result.status,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

app.get("/", (c) => c.text("ok"));
app.get("/whatsapp", (c) => c.text(HELP));
app.get("/whatsapp/", (c) => c.text(HELP));
app.post("/whatsapp", postWhatsApp);
app.post("/whatsapp/", postWhatsApp);
