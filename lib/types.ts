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

export type TagType = 'grade' | 'class' | 'department' | 'activity' | 'role';

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

export interface Attachment {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  blobUrl: string;        // Vercel Blob URL
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
}
