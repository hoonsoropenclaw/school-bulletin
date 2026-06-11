// Vercel KV 適配器 - 模擬簡單的 collection 操作
// 鍵設計:
//   user:<id> = User JSON
//   user:by-username:<username> = userId
//   tag:<id> = Tag JSON
//   announcement:<id> = Announcement JSON
//   attachment:<id> = Attachment JSON
//   set:users = [userId, ...]
//   set:tags = [tagId, ...]
//   set:announcements = [announcementId, ...]
//   set:attachments = [attachmentId, ...]

// Lazy import: 只在真的有 KV env 時才載入 SDK,避免在沒 env 的環境 import 噴錯
type KvLike = {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<unknown>;
  del(...keys: string[]): Promise<unknown>;
  sadd(key: string, ...members: string[]): Promise<unknown>;
  srem(key: string, ...members: string[]): Promise<unknown>;
  smembers(key: string): Promise<string[]>;
};

let kvPromise: Promise<KvLike | null> | null = null;

export const HAS_KV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

async function getKv(): Promise<KvLike | null> {
  if (!HAS_KV) return null;
  if (!kvPromise) {
    kvPromise = import('@vercel/kv')
      .then((m) => m.kv as unknown as KvLike)
      .catch(() => null);
  }
  return kvPromise;
}

export async function kvGet<T>(key: string): Promise<T | null> {
  const kv = await getKv();
  if (!kv) return null;
  return (await kv.get<T>(key)) ?? null;
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  const kv = await getKv();
  if (!kv) return;
  await kv.set(key, value);
}

export async function kvDel(key: string): Promise<void> {
  const kv = await getKv();
  if (!kv) return;
  await kv.del(key);
}

export async function kvSAdd(setKey: string, member: string): Promise<void> {
  const kv = await getKv();
  if (!kv) return;
  await kv.sadd(setKey, member);
}

export async function kvSRem(setKey: string, member: string): Promise<void> {
  const kv = await getKv();
  if (!kv) return;
  await kv.srem(setKey, member);
}

export async function kvSMembers(setKey: string): Promise<string[]> {
  const kv = await getKv();
  if (!kv) return [];
  return (await kv.smembers(setKey)) as string[];
}

export async function kvDelMany(keys: string[]): Promise<void> {
  const kv = await getKv();
  if (!kv || keys.length === 0) return;
  await kv.del(...keys);
}
