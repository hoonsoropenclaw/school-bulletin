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

export async function listAnnouncements(filter: FilterPayload): Promise<Announcement[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('announcements')
    .select('*')
    .is('deleted_at', null)
    .order('publish_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(`listAnnouncements: ${error.message}`);

  const all = (data as AnnouncementRow[]).map(annFromRow);

  // 篩選 — 群組之間 AND、每個 group 內 include OR、exclude NOT
  // 用 Postgres @> 操作符可推到 DB 但我們用記憶體 filter(MVP < 10k 筆可承受)
  const filtered = all.filter((a) => matchAnnouncement(a, filter));
  return filtered;
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
    const includeEmpty = g.tagIds.length === 0;
    const excludeEmpty = g.excludeTagIds.length === 0;
    if (includeEmpty && excludeEmpty) continue;

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

export { DEPARTMENT_INFO };
export type { DepartmentCode };
export { HAS_SUPABASE };
