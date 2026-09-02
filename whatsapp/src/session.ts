import type { WhatsAppSession } from "../../lib/chat-reply";

const TTL_MS = 24 * 60 * 60 * 1000;

type Entry = { session: WhatsAppSession; updatedAt: number };

/**
 * In-memory sessions keyed by WhatsApp From.
 *
 * v1 is single-process. A Cloudflare Worker has many isolates — after
 * `wrangler deploy`, use a KV namespace or Durable Object so the same
 * phone does not lose the questionnaire mid-chat.
 */
const store = new Map<string, Entry>();

export function getSession(from: string): WhatsAppSession | undefined {
  prune();
  const entry = store.get(from);
  if (!entry) return undefined;
  if (Date.now() - entry.updatedAt > TTL_MS) {
    store.delete(from);
    return undefined;
  }
  return entry.session;
}

export function putSession(from: string, session: WhatsAppSession): void {
  store.set(from, { session, updatedAt: Date.now() });
}

export function clearSession(from: string): void {
  store.delete(from);
}

export function sessionCount(): number {
  return store.size;
}

export function resetSessionStore(): void {
  store.clear();
}

function prune(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.updatedAt > TTL_MS) store.delete(key);
  }
}
