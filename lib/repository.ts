// Repository — Supabase Postgres 版
// 所有 CRUD 走 Supabase REST (service_role client)
// 對外 API 跟舊 KV 版完全相同,只換實作

import { getSupabaseAdmin, HAS_SUPABASE } from './db';
import type {
  User,
  Tag,
  Announcement,
  Attachment,
  PublicUser,
  FilterPayload,
  DepartmentCode,
  ReadReceipt,
  SignatureReceipt,
  UserRoleAssignment,
  AudienceFilter,
} from './types';
import { DEPARTMENT_INFO } from './types';

// ============== Row → Domain 轉換 ==============
// DB 用 snake_case,API 維持 camelCase
type UserRow = {
  id: string;
  username: string;
  display_name: string;
  department_code: DepartmentCode;
  role: 'dept_officer' | 'sysadmin';
  password_hash: string;
  must_change_password: boolean;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
};

type TagRow = {
  id: string;
  type: string;
  name: string;
  description: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
};

type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  publisher_id: string;
  publisher_name: string;
  publisher_dept: DepartmentCode;
  tag_ids: string[];
  attachment_ids: string[];
  require_signature: boolean;
  signature_deadline: string | null;
  publish_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type AttachmentRow = {
  id: string;
  announcement_id: string | null;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  uploaded_by: string;
  created_at: string;
};

function userFromRow(r: UserRow): User {
  return {
    id: r.id,
    username: r.username,
    displayName: r.display_name,
    departmentCode: r.department_code,
    role: r.role,
    passwordHash: r.password_hash,
    mustChangePassword: r.must_change_password,
    isActive: r.is_active,
    createdAt: r.created_at,
    lastLoginAt: r.last_login_at ?? undefined,
  };
}

function tagFromRow(r: TagRow): Tag {
  return {
    id: r.id,
    type: r.type as Tag['type'],
    name: r.name,
    description: r.description ?? undefined,
    color: r.color ?? undefined,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

function annFromRow(r: AnnouncementRow): Announcement {
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    publisherId: r.publisher_id,
    publisherName: r.publisher_name,
    publisherDept: r.publisher_dept,
    tagIds: r.tag_ids ?? [],
    attachmentIds: r.attachment_ids ?? [],
    requireSignature: r.require_signature,
    signatureDeadline: r.signature_deadline ?? undefined,
    publishAt: r.publish_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at ?? undefined,
  };
}

function attFromRow(r: AttachmentRow): Attachment {
  return {
    id: r.id,
    announcementId: r.announcement_id ?? undefined,
    fileName: r.file_name,
    mimeType: r.mime_type,
    sizeBytes: Number(r.size_bytes),
    storagePath: r.storage_path,
    uploadedBy: r.uploaded_by,
    createdAt: r.created_at,
  };
}

// 路線 A 新表 row 對應
type ReadReceiptRow = {
  id: string;
  announcement_id: string;
  user_id: string;
  read_at: string;
};

type SignatureReceiptRow = {
  id: string;
  announcement_id: string;
  user_id: string;
  signed_at: string;
  ip_address: string | null;
  user_agent: string | null;
};

type UserRoleAssignmentRow = {
  user_id: string;
  role_tag_id: string;
  created_at: string;
};

function readReceiptFromRow(r: ReadReceiptRow): ReadReceipt {
  return {
    id: r.id,
    announcementId: r.announcement_id,
    userId: r.user_id,
    readAt: r.read_at,
  };
}

function signatureReceiptFromRow(r: SignatureReceiptRow): SignatureReceipt {
  return {
    id: r.id,
    announcementId: r.announcement_id,
    userId: r.user_id,
    signedAt: r.signed_at,
    ipAddress: r.ip_address ?? undefined,
    userAgent: r.user_agent ?? undefined,
  };
}

function userRoleAssignmentFromRow(r: UserRoleAssignmentRow): UserRoleAssignment {
  return {
    userId: r.user_id,
    roleTagId: r.role_tag_id,
    createdAt: r.created_at,
  };
}

// ============== 用戶 ==============

export async function createUser(u: User): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('users').insert({
    id: u.id,
    username: u.username,
    display_name: u.displayName,
    department_code: u.departmentCode,
    role: u.role,
    password_hash: u.passwordHash,
    must_change_password: u.mustChangePassword ?? false,
    is_active: u.isActive ?? true,
    created_at: u.createdAt,
  });
  if (error) throw new Error(`createUser: ${error.message}`);
}

export async function getUser(id: string): Promise<User | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`getUser: ${error.message}`);
  return data ? userFromRow(data as UserRow) : null;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .maybeSingle();
  if (error) throw new Error(`getUserByUsername: ${error.message}`);
  return data ? userFromRow(data as UserRow) : null;
}

export async function listUsers(): Promise<User[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw new Error(`listUsers: ${error.message}`);
  return (data as UserRow[]).map(userFromRow);
}

export async function updateUser(u: User): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('users')
    .update({
      display_name: u.displayName,
      department_code: u.departmentCode,
      role: u.role,
      password_hash: u.passwordHash,
      must_change_password: u.mustChangePassword ?? false,
      is_active: u.isActive ?? true,
      last_login_at: u.lastLoginAt ?? null,
    })
    .eq('id', u.id);
  if (error) throw new Error(`updateUser: ${error.message}`);
}

export async function deleteUser(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw new Error(`deleteUser: ${error.message}`);
}

export function toPublicUser(u: User, roleTagIds: string[] = []): PublicUser {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    departmentCode: u.departmentCode,
    role: u.role,
    roleTagIds,
  };
}

// ============== 標籤 ==============

export async function createTag(t: Tag): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('tags').insert({
    id: t.id,
    type: t.type,
    name: t.name,
    description: t.description ?? null,
    color: t.color ?? null,
    is_active: t.isActive ?? true,
    created_at: t.createdAt,
  });
  if (error) throw new Error(`createTag: ${error.message}`);
}

export async function getTag(id: string): Promise<Tag | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`getTag: ${error.message}`);
  return data ? tagFromRow(data as TagRow) : null;
}

export async function listTags(): Promise<Tag[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('type', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw new Error(`listTags: ${error.message}`);
  return (data as TagRow[]).map(tagFromRow);
}

export async function updateTag(t: Tag): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('tags')
    .update({
      type: t.type,
      name: t.name,
      description: t.description ?? null,
      color: t.color ?? null,
      is_active: t.isActive ?? true,
    })
    .eq('id', t.id);
  if (error) throw new Error(`updateTag: ${error.message}`);
}

export async function deleteTag(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('tags').delete().eq('id', id);
  if (error) throw new Error(`deleteTag: ${error.message}`);
}

// ============== 公告 ==============

export async function createAnnouncement(a: Announcement): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('announcements').insert({
    id: a.id,
    title: a.title,
    content: a.content,
    publisher_id: a.publisherId,
    publisher_name: a.publisherName,
    publisher_dept: a.publisherDept,
    tag_ids: a.tagIds ?? [],
    attachment_ids: a.attachmentIds ?? [],
    require_signature: a.requireSignature ?? false,
    signature_deadline: a.signatureDeadline ?? null,
    publish_at: a.publishAt,
    updated_at: a.updatedAt ?? a.publishAt,
    deleted_at: a.deletedAt ?? null,
  });
  if (error) throw new Error(`createAnnouncement: ${error.message}`);
}

export async function getAnnouncement(id: string): Promise<Announcement | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`getAnnouncement: ${error.message}`);
  return data ? annFromRow(data as AnnouncementRow) : null;
}

export async function updateAnnouncement(a: Announcement): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('announcements')
    .update({
      title: a.title,
      content: a.content,
      tag_ids: a.tagIds ?? [],
      attachment_ids: a.attachmentIds ?? [],
      require_signature: a.requireSignature ?? false,
      signature_deadline: a.signatureDeadline ?? null,
      updated_at: a.updatedAt ?? new Date().toISOString(),
      deleted_at: a.deletedAt ?? null,
    })
    .eq('id', a.id);
  if (error) throw new Error(`updateAnnouncement: ${error.message}`);
}

export async function softDeleteAnnouncement(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('announcements')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(`softDeleteAnnouncement: ${error.message}`);
}

export async function listAnnouncements(
  filter: FilterPayload,
  audience?: AudienceFilter,
): Promise<Announcement[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('announcements')
    .select('*')
    .is('deleted_at', null)
    .order('publish_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(`listAnnouncements: ${error.message}`);

  const all = (data as AnnouncementRow[]).map(annFromRow);

  // 受眾過濾(M-05 處室隔離 + M-06 受眾分流)
  // 2026-06-11 v2:未登入(無 audience)走訪客邏輯、也跑 matchAudience
  // 不再 bypass — 訪客只能看公開公告
  const roleSet = await getRoleTagIdsSet();
  const effectiveAudience: AudienceFilter = audience ?? {
    viewerDept: '' as DepartmentCode,
    viewerIsSysadmin: false,
    viewerIsDeptOfficer: false,
    viewerRoleTagIds: [],
  };
  const audienced = all.filter((a) => matchAudience(a, effectiveAudience, roleSet));

  // 篩選 — 群組之間 AND、每個 group 內 include OR、exclude NOT
  // 用 Postgres @> 操作符可推到 DB 但我們用記憶體 filter(MVP < 10k 筆可承受)
  const filtered = audienced.filter((a) => matchAnnouncement(a, filter));
  return filtered;
}

// 受眾匹配規則(M-05 + M-06 + 訪客預設公開整合,2026-06-11 v3 修訂):
// - 訪客(未登入)→ 看全部(公告預設對外,在還沒建立「內部公告」機制前應該這樣設定)
// - sysadmin → 看全部
// - dept_officer(處室承辦)→ 看全部(處室互通是工作所需,不該被 audience 阻擋)
// - teacher/parent/student(已登入受眾)→ 看「自己 audience 命中」或「公開」(無 role 標籤)
//
// 設計原則(2026-06-11 v3 反轉):
// - 訪客 = 沒登入 = 公告預設對外 = 看全部(未登入者更需要「什麼都看得到」才能信任這是公開的學校網站)
// - 受眾(老師/家長/學生) = 已登入 = 看到 audience 命中 + 公開(登入後的體驗更聚焦)
// - 處室承辦 = 系統管理員級 = 應該看到所有公告
function matchAudience(
  a: Announcement,
  aud: AudienceFilter,
  roleTagIdSet: Set<string>,
): boolean {
  // 訪客(未登入,viewerIsDeptOfficer + viewerRoleTagIds + viewerIsSysadmin 都空)→ 看全部
  // 這是 v3 的反轉決定: 公告預設對外
  if (
    !aud.viewerIsSysadmin &&
    !aud.viewerIsDeptOfficer &&
    (aud.viewerRoleTagIds ?? []).length === 0
  ) {
    return true;
  }

  // 處室承辦(已登入) / 系統管理員 → 看全部
  if (aud.viewerIsSysadmin || aud.viewerIsDeptOfficer) {
    return true;
  }

  // 受眾(老師/家長/學生):audience 命中 或 公開(無 role 標籤)
  const audienceRoleTagIds = a.tagIds.filter((tid) => roleTagIdSet.has(tid));
  if (audienceRoleTagIds.length === 0) return true; // 公開公告
  const viewerTags = aud.viewerRoleTagIds ?? [];
  return audienceRoleTagIds.some((tid) => viewerTags.includes(tid));
}

// 取得 type='role' 的 tag id 集合(用 listTags() cache,30 秒 TTL 避免每次都打 DB)
let _roleTagIdCache: Set<string> | null = null;
let _roleTagIdCacheAt = 0;
const ROLE_CACHE_TTL_MS = 30_000;

export async function getRoleTagIdsSet(): Promise<Set<string>> {
  const now = Date.now();
  if (_roleTagIdCache && now - _roleTagIdCacheAt < ROLE_CACHE_TTL_MS) {
    return _roleTagIdCache;
  }
  const all = await listTags();
  _roleTagIdCache = new Set(all.filter((t) => t.type === 'role' && t.isActive).map((t) => t.id));
  _roleTagIdCacheAt = now;
  return _roleTagIdCache;
}

function matchAnnouncement(a: Announcement, f: FilterPayload): boolean {
  // 全文搜尋(title + content)
  if (f.search && f.search.trim()) {
    const q = f.search.trim().toLowerCase();
    const hay = `${a.title} ${a.content}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }

  if (!f.groups || f.groups.length === 0) return true;

  for (const g of f.groups) {
    // 雙向容錯:支援 {tagIds, excludeTagIds} (前端真實格式)
    // 跟 {tags, logic} (prompt 測試格式)
    const gAny = g as unknown as { tagIds?: string[]; excludeTagIds?: string[]; tags?: string[] };
    const includeIds = gAny.tagIds ?? gAny.tags ?? [];
    const excludeIds = gAny.excludeTagIds ?? [];
    const includeEmpty = includeIds.length === 0;
    const excludeEmpty = excludeIds.length === 0;
    if (includeEmpty && excludeEmpty) continue;

    if (!includeEmpty) {
      // 公告必須具備至少一個 include tag
      const hit = includeIds.some((tid: string) => a.tagIds.includes(tid));
      if (!hit) return false;
    }
    if (!excludeEmpty) {
      // 公告不可具備任何 exclude tag
      const banned = excludeIds.some((tid: string) => a.tagIds.includes(tid));
      if (banned) return false;
    }
  }
  return true;
}

// ============== 附件 ==============

export async function createAttachment(a: Attachment): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('attachments').insert({
    id: a.id,
    announcement_id: a.announcementId ?? null,
    file_name: a.fileName,
    mime_type: a.mimeType,
    size_bytes: a.sizeBytes,
    storage_path: a.storagePath,
    uploaded_by: a.uploadedBy,
    created_at: a.createdAt,
  });
  if (error) throw new Error(`createAttachment: ${error.message}`);
}

export async function getAttachment(id: string): Promise<Attachment | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`getAttachment: ${error.message}`);
  return data ? attFromRow(data as AttachmentRow) : null;
}

export async function getAttachments(ids: string[]): Promise<Attachment[]> {
  if (ids.length === 0) return [];
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .in('id', ids);
  if (error) throw new Error(`getAttachments: ${error.message}`);
  return (data as AttachmentRow[]).map(attFromRow);
}

export async function listAttachments(): Promise<Attachment[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`listAttachments: ${error.message}`);
  return (data as AttachmentRow[]).map(attFromRow);
}

export async function deleteAttachment(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('attachments').delete().eq('id', id);
  if (error) throw new Error(`deleteAttachment: ${error.message}`);
}

// ============== 路線 A 新表 (M-05/M-06/M-07) ==============

// ============== user_role_assignments (M-06 受眾分流) ==============

export async function getUserRoleTagIds(userId: string): Promise<string[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('user_role_assignments')
    .select('role_tag_id')
    .eq('user_id', userId);
  if (error) throw new Error(`getUserRoleTagIds: ${error.message}`);
  return (data ?? []).map((r: { role_tag_id: string }) => r.role_tag_id);
}

export async function getUsersRoleTagIdsMap(userIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (userIds.length === 0) return map;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('user_role_assignments')
    .select('user_id, role_tag_id')
    .in('user_id', userIds);
  if (error) throw new Error(`getUsersRoleTagIdsMap: ${error.message}`);
  for (const r of data ?? []) {
    const uid = (r as { user_id: string }).user_id;
    const tid = (r as { role_tag_id: string }).role_tag_id;
    if (!map.has(uid)) map.set(uid, []);
    map.get(uid)!.push(tid);
  }
  return map;
}

export async function assignUserRoleTag(userId: string, roleTagId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('user_role_assignments')
    .insert({ user_id: userId, role_tag_id: roleTagId });
  // 23505 = unique_violation(已存在)→ 靜默忽略,idempotent
  if (error && !error.message.includes('23505') && !error.message.includes('duplicate')) {
    throw new Error(`assignUserRoleTag: ${error.message}`);
  }
}

export async function listUserRoleAssignments(): Promise<UserRoleAssignment[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('user_role_assignments').select('*');
  if (error) throw new Error(`listUserRoleAssignments: ${error.message}`);
  return (data as UserRoleAssignmentRow[]).map(userRoleAssignmentFromRow);
}

// ============== read_receipts (M-07 已讀追蹤) ==============

export async function createReadReceipt(r: ReadReceipt): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('read_receipts').insert({
    id: r.id,
    announcement_id: r.announcementId,
    user_id: r.userId,
    read_at: r.readAt,
  });
  // unique violation → 已記錄過(去重,靜默忽略)
  if (error && !error.message.includes('23505') && !error.message.includes('duplicate')) {
    throw new Error(`createReadReceipt: ${error.message}`);
  }
}

export async function getReadReceipt(
  announcementId: string,
  userId: string,
): Promise<ReadReceipt | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('read_receipts')
    .select('*')
    .eq('announcement_id', announcementId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(`getReadReceipt: ${error.message}`);
  return data ? readReceiptFromRow(data as ReadReceiptRow) : null;
}

export async function listReadReceipts(announcementId: string): Promise<ReadReceipt[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('read_receipts')
    .select('*')
    .eq('announcement_id', announcementId)
    .order('read_at', { ascending: false });
  if (error) throw new Error(`listReadReceipts: ${error.message}`);
  return (data as ReadReceiptRow[]).map(readReceiptFromRow);
}

export async function countReadReceipts(announcementId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('read_receipts')
    .select('*', { count: 'exact', head: true })
    .eq('announcement_id', announcementId);
  if (error) throw new Error(`countReadReceipts: ${error.message}`);
  return count ?? 0;
}

// ============== signature_receipts (M-07 簽收追蹤) ==============

export async function createSignatureReceipt(s: SignatureReceipt): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('signature_receipts').insert({
    id: s.id,
    announcement_id: s.announcementId,
    user_id: s.userId,
    signed_at: s.signedAt,
    ip_address: s.ipAddress ?? null,
    user_agent: s.userAgent ?? null,
  });
  if (error && !error.message.includes('23505') && !error.message.includes('duplicate')) {
    throw new Error(`createSignatureReceipt: ${error.message}`);
  }
}

export async function getSignatureReceipt(
  announcementId: string,
  userId: string,
): Promise<SignatureReceipt | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('signature_receipts')
    .select('*')
    .eq('announcement_id', announcementId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(`getSignatureReceipt: ${error.message}`);
  return data ? signatureReceiptFromRow(data as SignatureReceiptRow) : null;
}

export async function listSignatureReceipts(
  announcementId: string,
): Promise<SignatureReceipt[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('signature_receipts')
    .select('*')
    .eq('announcement_id', announcementId)
    .order('signed_at', { ascending: false });
  if (error) throw new Error(`listSignatureReceipts: ${error.message}`);
  return (data as SignatureReceiptRow[]).map(signatureReceiptFromRow);
}

export async function listMySignatures(userId: string): Promise<SignatureReceipt[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('signature_receipts')
    .select('*')
    .eq('user_id', userId)
    .order('signed_at', { ascending: false });
  if (error) throw new Error(`listMySignatures: ${error.message}`);
  return (data as SignatureReceiptRow[]).map(signatureReceiptFromRow);
}

export async function countSignatureReceipts(announcementId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('signature_receipts')
    .select('*', { count: 'exact', head: true })
    .eq('announcement_id', announcementId);
  if (error) throw new Error(`countSignatureReceipts: ${error.message}`);
  return count ?? 0;
}

export { DEPARTMENT_INFO };
export type { DepartmentCode };
export { HAS_SUPABASE };
