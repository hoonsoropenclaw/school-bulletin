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

import { kv } from '@vercel/kv';

export const HAS_KV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

export async function kvGet<T>(key: string): Promise<T | null> {
  if (!HAS_KV) return null;
  return (await kv.get<T>(key)) ?? null;
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  if (!HAS_KV) return;
  await kv.set(key, value);
}

export async function kvDel(key: string): Promise<void> {
  if (!HAS_KV) return;
  await kv.del(key);
}

export async function kvSAdd(setKey: string, member: string): Promise<void> {
  if (!HAS_KV) return;
  await kv.sadd(setKey, member);
}

export async function kvSRem(setKey: string, member: string): Promise<void> {
  if (!HAS_KV) return;
  await kv.srem(setKey, member);
}

export async function kvSMembers(setKey: string): Promise<string[]> {
  if (!HAS_KV) return [];
  return (await kv.smembers(setKey)) as string[];
}

export async function kvDelMany(keys: string[]): Promise<void> {
  if (!HAS_KV || keys.length === 0) return;
  await kv.del(...keys);
}
