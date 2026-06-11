// 共用型別 - 在 client/server 共用
// 簡化版:扁平 JSON 結構,用 Vercel KV (Redis) 當主資料庫

export type DepartmentCode = 'teaching' | 'student' | 'general' | 'counsel' | 'it' | 'principal';

export const DEPARTMENT_INFO: Record<DepartmentCode, { name: string; short: string }> = {
  teaching: { name: '教務處', short: '教' },
  student: { name: '學務處', short: '學' },
  general: { name: '總務處', short: '總' },
  counsel: { name: '輔導處', short: '輔' },
  it: { name: '資訊組', short: '資' },
  principal: { name: '校長室', short: '校' },
};

export type TagType = 'grade' | 'class' | 'department' | 'activity' | 'role' | 'custom';

export interface Tag {
  id: string;
  type: TagType;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;       // = 處室 code (e.g. "teaching")
  displayName: string;    // "教務處"
  departmentCode: DepartmentCode;
  role: 'dept_officer' | 'sysadmin';
  passwordHash: string;
  mustChangePassword: boolean;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

// 受眾標籤類型(對應 tags.type='role' 的 name 常見值)
export type RoleTagName = 'student' | 'parent' | 'teacher' | 'guest';
// 對應中文顯示
export const ROLE_TAG_NAME_TO_CN: Record<RoleTagName, string> = {
  student: '學生',
  parent: '家長',
  teacher: '教師',
  guest: '訪客',
};

export interface Attachment {
  id: string;
  announcementId?: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;    // Supabase Storage path: <userId>/<fileId>-<name>
  uploadedBy: string;     // user id
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  publisherId: string;
  publisherDept: DepartmentCode;
  publisherName: string;
  tagIds: string[];
  attachmentIds: string[];
  requireSignature: boolean;
  signatureDeadline?: string;
  publishAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// 篩選條件結構 (前端送到後端)
export interface FilterGroup {
  // 群組內 OR
  tagIds: string[];
  // 群組內 NOT (排除)
  excludeTagIds: string[];
}

export interface FilterPayload {
  groups: FilterGroup[];
  search?: string;
}

export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  departmentCode: DepartmentCode;
  role: User['role'];
  // 該使用者具備的受眾角色 tag id 陣列(來自 user_role_assignments 對應到 tags.type='role')
  // 給前端 UI 顯示 + 後端 listAnnouncements 過濾用
  roleTagIds?: string[];
}

// ============== 路線 A 補完 (M-05/M-06/M-07) — 3 張新表型別 ==============

// 已讀紀錄 (進入公告詳情頁時自動寫入,去重)
export interface ReadReceipt {
  id: string;
  announcementId: string;
  userId: string;
  readAt: string;
}

// 簽收回條 (使用者點「我已簽收」觸發)
export interface SignatureReceipt {
  id: string;
  announcementId: string;
  userId: string;
  signedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

// User → 受眾 role tag 多對多對應
export interface UserRoleAssignment {
  userId: string;
  roleTagId: string;
  createdAt: string;
}

// Audience 過濾選項(listAnnouncements 接收)
export interface AudienceFilter {
  // 觀看者所屬處室(用於 dept_officer 處室隔離)
  viewerDept?: DepartmentCode;
  // 觀看者是否為系統管理員(sysadmin 看全部)
  viewerIsSysadmin?: boolean;
  // 觀看者的受眾角色 tag id 陣列(命中任一即符合)
  viewerRoleTagIds?: string[];
  // 觀看者是否為處室承辦(dept_officer)
  viewerIsDeptOfficer?: boolean;
}
