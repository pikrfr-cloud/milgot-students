import { app, type Bindings } from "./app";
import { handleScheduled, type ScheduledEventLike } from "./scheduled";

/**
 * Cloudflare Worker entry: Hono fetch + daily reminder cron.
 * Node (`npm run whatsapp`) uses `app.fetch` only — no cron there.
 */
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEventLike, env: Bindings): Promise<void> {
    await handleScheduled(event, env);
  },
};
