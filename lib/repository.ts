import type {
  User,
  Tag,
  Announcement,
  Attachment,
  PublicUser,
  FilterPayload,
  DepartmentCode,
} from './types';
import {
  kvGet,
  kvSet,
  kvDel,
  kvSAdd,
  kvSRem,
  kvSMembers,
  kvDelMany,
  HAS_KV,
} from './db';
import { DEPARTMENT_INFO } from './types';

// ============== 內存備援 (本地開發用,無 KV 時用) ==============
type MemoryStore = {
  kv: Map<string, unknown>;
  sets: Map<string, Set<string>>;
};

declare global {
  // eslint-disable-next-line no-var
  var __memoryStore: MemoryStore | undefined;
}

function mem(): MemoryStore {
  if (!globalThis.__memoryStore) {
    globalThis.__memoryStore = { kv: new Map(), sets: new Map() };
  }
  return globalThis.__memoryStore;
}

async function gxGet<T>(key: string): Promise<T | null> {
  if (HAS_KV) return kvGet<T>(key);
  return (mem().kv.get(key) as T) ?? null;
}

async function gxSet<T>(key: string, value: T): Promise<void> {
  if (HAS_KV) return kvSet<T>(key, value);
  mem().kv.set(key, value);
}

async function gxDel(key: string): Promise<void> {
  if (HAS_KV) return kvDel(key);
  mem().kv.delete(key);
}

async function gxDelMany(keys: string[]): Promise<void> {
  if (HAS_KV) return kvDelMany(keys);
  for (const k of keys) mem().kv.delete(k);
}

async function gxSAdd(setKey: string, member: string): Promise<void> {
  if (HAS_KV) return kvSAdd(setKey, member);
  if (!mem().sets.has(setKey)) mem().sets.set(setKey, new Set());
  mem().sets.get(setKey)!.add(member);
}

async function gxSRem(setKey: string, member: string): Promise<void> {
  if (HAS_KV) return kvSRem(setKey, member);
  mem().sets.get(setKey)?.delete(member);
}

async function gxSMembers(setKey: string): Promise<string[]> {
  if (HAS_KV) return kvSMembers(setKey);
  return Array.from(mem().sets.get(setKey) ?? []);
}

// ============== 用戶 ==============
const K = {
  user: (id: string) => `user:${id}`,
  userByUsername: (u: string) => `user:by-username:${u}`,
  usersSet: () => 'set:users',
  tag: (id: string) => `tag:${id}`,
  tagsSet: () => 'set:tags',
  announcement: (id: string) => `announcement:${id}`,
  announcementsSet: () => 'set:announcements',
  attachment: (id: string) => `attachment:${id}`,
  attachmentsSet: () => 'set:attachments',
};

export async function createUser(u: User): Promise<void> {
  await gxSet(K.user(u.id), u);
  await gxSet(K.userByUsername(u.username), u.id);
  await gxSAdd(K.usersSet(), u.id);
}

export async function getUser(id: string): Promise<User | null> {
  return gxGet<User>(K.user(id));
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const id = await gxGet<string>(K.userByUsername(username));
  if (!id) return null;
  return getUser(id);
}

export async function listUsers(): Promise<User[]> {
  const ids = await gxSMembers(K.usersSet());
  const users: User[] = [];
  for (const id of ids) {
    const u = await getUser(id);
    if (u) users.push(u);
  }
  return users;
}

export async function updateUser(u: User): Promise<void> {
  await gxSet(K.user(u.id), u);
}

export async function deleteUser(id: string): Promise<void> {
  const u = await getUser(id);
  if (!u) return;
  await gxDelMany([K.user(id), K.userByUsername(u.username)]);
  await gxSRem(K.usersSet(), id);
}

export function toPublicUser(u: User): PublicUser {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    departmentCode: u.departmentCode,
    role: u.role,
  };
}

// ============== 標籤 ==============
export async function createTag(t: Tag): Promise<void> {
  await gxSet(K.tag(t.id), t);
  await gxSAdd(K.tagsSet(), t.id);
}

export async function getTag(id: string): Promise<Tag | null> {
  return gxGet<Tag>(K.tag(id));
}

export async function listTags(): Promise<Tag[]> {
  const ids = await gxSMembers(K.tagsSet());
  const tags: Tag[] = [];
  for (const id of ids) {
    const t = await getTag(id);
    if (t) tags.push(t);
  }
  return tags.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
}

export async function updateTag(t: Tag): Promise<void> {
  await gxSet(K.tag(t.id), t);
}

export async function deleteTag(id: string): Promise<void> {
  await gxDel(K.tag(id));
  await gxSRem(K.tagsSet(), id);
}

// ============== 附件 ==============
export async function createAttachment(a: Attachment): Promise<void> {
  await gxSet(K.attachment(a.id), a);
  await gxSAdd(K.attachmentsSet(), a.id);
}

export async function getAttachment(id: string): Promise<Attachment | null> {
  return gxGet<Attachment>(K.attachment(id));
}

export async function getAttachments(ids: string[]): Promise<Attachment[]> {
  const out: Attachment[] = [];
  for (const id of ids) {
    const a = await getAttachment(id);
    if (a) out.push(a);
  }
  return out;
}

export async function listAttachments(): Promise<Attachment[]> {
  const ids = await gxSMembers(K.attachmentsSet());
  const out: Attachment[] = [];
  for (const id of ids) {
    const a = await getAttachment(id);
    if (a) out.push(a);
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteAttachment(id: string): Promise<void> {
  await gxDel(K.attachment(id));
  await gxSRem(K.attachmentsSet(), id);
}

// ============== 公告 ==============
export async function createAnnouncement(a: Announcement): Promise<void> {
  await gxSet(K.announcement(a.id), a);
  await gxSAdd(K.announcementsSet(), a.id);
}

export async function getAnnouncement(id: string): Promise<Announcement | null> {
  return gxGet<Announcement>(K.announcement(id));
}

export async function updateAnnouncement(a: Announcement): Promise<void> {
  await gxSet(K.announcement(a.id), a);
}

export async function softDeleteAnnouncement(id: string): Promise<void> {
  const a = await getAnnouncement(id);
  if (!a) return;
  a.deletedAt = new Date().toISOString();
  await updateAnnouncement(a);
}

export async function listAnnouncements(filter: FilterPayload): Promise<Announcement[]> {
  const ids = await gxSMembers(K.announcementsSet());
  const all: Announcement[] = [];
  for (const id of ids) {
    const a = await getAnnouncement(id);
    if (a && !a.deletedAt) all.push(a);
  }

  // 篩選邏輯:每個 group 內 OR (include)、群組內 NOT (exclude)、
  //           group 之間 AND。
  // MVP 簡化:在記憶體內 filter(公告量 < 10,000 可承受;規模上 v2 改 Postgres+UNNEST)
  const filtered = all.filter((a) => matchAnnouncement(a, filter));

  // 排序:新到舊
  filtered.sort((a, b) => b.publishAt.localeCompare(a.publishAt));
  return filtered;
}

function matchAnnouncement(a: Announcement, f: FilterPayload): boolean {
  // 全文搜尋
  if (f.search && f.search.trim()) {
    const q = f.search.trim().toLowerCase();
    const hay = `${a.title} ${a.content}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }

  if (!f.groups || f.groups.length === 0) return true;

  // 群組之間 AND;每個 group 內 includeTagIds 是 OR、excludeTagIds 是 NOT
  for (const g of f.groups) {
    const includeEmpty = g.tagIds.length === 0;
    const excludeEmpty = g.excludeTagIds.length === 0;
    if (includeEmpty && excludeEmpty) continue; // 空 group 不影響

    if (!includeEmpty) {
      // 公告必須具備至少一個 include tag
      const hit = g.tagIds.some((tid) => a.tagIds.includes(tid));
      if (!hit) return false;
    }
    if (!excludeEmpty) {
      // 公告不可具備任何 exclude tag
      const banned = g.excludeTagIds.some((tid) => a.tagIds.includes(tid));
      if (banned) return false;
    }
  }
  return true;
}

export { DEPARTMENT_INFO };
export type { DepartmentCode };
