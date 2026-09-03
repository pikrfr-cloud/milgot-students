import { SCHOLARSHIPS } from "@/data/scholarships";
import {
  reminderMessageHe,
  shouldSendReminder,
  type ReminderItem,
} from "../../lib/whatsapp-reminders";
import {
  listSubscriptions,
  markReminderSent,
  wasReminderSent,
  type ReminderKv,
} from "./reminders-kv";
import { sendWhatsAppMessage, type TwilioSendEnv } from "./twilio-send";
import { maskFrom } from "./twilio";

export type ScheduledEnv = TwilioSendEnv & {
  REMINDERS?: ReminderKv;
};

export type ScheduledEventLike = {
  scheduledTime: number;
  cron?: string;
};

export type ReminderSendFn = (args: {
  to: string;
  body: string;
  env: TwilioSendEnv;
}) => Promise<boolean>;

export type ReminderCronResult = {
  attempted: number;
  sent: number;
  skipped: number;
};

function catalogItem(id: string): ReminderItem | null {
  const row = SCHOLARSHIPS.find((s) => s.id === id);
  if (!row?.deadline.date) return null;
  return {
    id: row.id,
    nameHe: row.nameHe,
    deadlineDate: row.deadline.date,
  };
}

/**
 * Daily cron: for each KV subscription, send a WhatsApp reminder on
 * (deadline.date − 7 Asia/Jerusalem days). Node (`npm run whatsapp`) never
 * calls this — only `wrangler deploy` with the cron trigger.
 */
export async function runReminderCron(args: {
  env: ScheduledEnv;
  now?: Date;
  send?: ReminderSendFn;
}): Promise<ReminderCronResult> {
  const result: ReminderCronResult = { attempted: 0, sent: 0, skipped: 0 };
  const kv = args.env.REMINDERS;
  if (!kv) {
    console.warn("[whatsapp] reminder cron skipped — REMINDERS KV is not bound");
    return result;
  }

  const now = args.now ?? new Date();
  const send = args.send ?? ((a) => sendWhatsAppMessage({ to: a.to, body: a.body, env: a.env }));
  const subs = await listSubscriptions(kv);

  for (const sub of subs) {
    for (const stored of sub.items) {
      const live = catalogItem(stored.id);
      const deadlineDate = live?.deadlineDate ?? stored.deadlineDate;
      const nameHe = live?.nameHe ?? stored.nameHe;

      if (!shouldSendReminder({ deadlineDate, now })) {
        result.skipped += 1;
        continue;
      }

      result.attempted += 1;
      if (await wasReminderSent(kv, sub.from, stored.id, deadlineDate)) {
        result.skipped += 1;
        continue;
      }

      const ok = await send({
        to: sub.from,
        body: reminderMessageHe(nameHe, deadlineDate),
        env: args.env,
      });
      if (ok) {
        await markReminderSent(kv, sub.from, stored.id, deadlineDate);
        result.sent += 1;
      } else {
        console.warn(`[whatsapp] reminder not marked sent for ${maskFrom(sub.from)}`);
        result.skipped += 1;
      }
    }
  }

  return result;
}

export async function handleScheduled(event: ScheduledEventLike, env: ScheduledEnv): Promise<void> {
  const now = new Date(event.scheduledTime);
  await runReminderCron({ env, now });
}
