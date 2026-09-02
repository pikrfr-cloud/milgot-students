import { serve } from "@hono/node-server";
import { app } from "./app";

const port = Number(process.env.PORT || 8787);

if (!process.env.TWILIO_AUTH_TOKEN) {
  console.warn(
    "[whatsapp] TWILIO_AUTH_TOKEN is not set — signature checks skipped (dev mode).",
  );
}

serve({ fetch: app.fetch, port });
console.log(`[whatsapp] POST http://localhost:${port}/whatsapp`);
console.log("[whatsapp] Tunnel with cloudflared or ngrok, then set Twilio to POST https://<host>/whatsapp");
