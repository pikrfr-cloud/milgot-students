import {
  parseSubscriptionJson,
  sentReminderKey,
  subscriptionKey,
  type ReminderItem,
  type ReminderSubscription,
} from "../../lib/whatsapp-reminders";

/** Minimal KV surface used by reminders (Cloudflare KV compatible). */
export type ReminderKv = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; cursor?: string }): Promise<{
    keys: { name: string }[];
    list_complete?: boolean;
    cursor?: string;
  }>;
};

export function memoryKv(): ReminderKv {
  const data = new Map<string, string>();
  return {
    async get(key) {
      return data.get(key) ?? null;
    },
    async put(key, value) {
      data.set(key, value);
    },
    async delete(key) {
      data.delete(key);
    },
    async list({ prefix = "" } = {}) {
      const keys = [...data.keys()]
        .filter((name) => name.startsWith(prefix))
        .map((name) => ({ name }));
      return { keys, list_complete: true };
    },
  };
}

export async function putSubscription(
  kv: ReminderKv,
  from: string,
  items: ReminderItem[],
): Promise<void> {
  const sub: ReminderSubscription = { from, items };
  await kv.put(subscriptionKey(from), JSON.stringify(sub));
}

export async function getSubscription(kv: ReminderKv, from: string): Promise<ReminderSubscription | null> {
  return parseSubscriptionJson(await kv.get(subscriptionKey(from)));
}

export async function deleteSubscription(kv: ReminderKv, from: string): Promise<void> {
  await kv.delete(subscriptionKey(from));
}

export async function listSubscriptions(kv: ReminderKv): Promise<ReminderSubscription[]> {
  const names: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await kv.list({ prefix: "sub:", cursor });
    for (const k of page.keys) names.push(k.name);
    cursor = page.list_complete === false ? page.cursor : undefined;
  } while (cursor);

  const out: ReminderSubscription[] = [];
  for (const name of names) {
    const sub = parseSubscriptionJson(await kv.get(name));
    if (sub) out.push(sub);
  }
  return out;
}

export async function wasReminderSent(
  kv: ReminderKv,
  from: string,
  scholarshipId: string,
  deadlineDate: string,
): Promise<boolean> {
  const existing = await kv.get(sentReminderKey(from, scholarshipId, deadlineDate));
  return existing != null;
}

export async function markReminderSent(
  kv: ReminderKv,
  from: string,
  scholarshipId: string,
  deadlineDate: string,
): Promise<void> {
  await kv.put(sentReminderKey(from, scholarshipId, deadlineDate), "1");
}
