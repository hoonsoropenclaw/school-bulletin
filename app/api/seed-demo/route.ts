// /api/seed-demo - 一次性 demo 資料 seed (公開端點,idempotent)
// 用法: GET /api/seed-demo  → 自動偵測空 DB,建帳號 + 標籤 + 3 則示範公告
//
// 注意:這是 demo 端點,生產環境應加 auth 或在 build script 跑

import { NextResponse } from 'next/server';
import {
  assignUserRoleTag,
  createAnnouncement,
  createTag,
  createUser,
  getUserByUsername,
  listAnnouncements,
  listTags,
  listUsers,
} from '@/lib/repository';
import { hashPassword, newId } from '@/lib/auth';
import type { Announcement, Tag, User, DepartmentCode, TagType } from '@/lib/types';

export const runtime = 'nodejs';

const DEFAULT_PASSWORD = 'School@2026';

const DEPT_ACCOUNTS: Array<{ code: DepartmentCode; role: 'dept_officer' | 'sysadmin'; name: string }> = [
  { code: 'teaching', role: 'dept_officer', name: '教務處' },
  { code: 'student', role: 'dept_officer', name: '學務處' },
  { code: 'general', role: 'dept_officer', name: '總務處' },
  { code: 'counsel', role: 'dept_officer', name: '輔導處' },
  { code: 'it', role: 'dept_officer', name: '資訊組' },
  { code: 'principal', role: 'sysadmin', name: '校長室' },
];

// 路線 A 補 2 (M-06):3 個非處室 demo 帳號
// departmentCode 借用既有部門 + role 標籤分群 → 用 username 區分
// teacher_lin 歸 teaching 處室(便於 dept_officer 處室隔離測試時 dept_officer 看得到 teacher_lin 發的公告)、parent_chen 歸 student、student_wang 歸 student
const NON_DEPT_ACCOUNTS: Array<{
  username: string;
  displayName: string;
  departmentCode: DepartmentCode;
  roleTagName: string;
}> = [
  { username: 'teacher_lin', displayName: '林老師', departmentCode: 'teaching', roleTagName: '教師' },
  { username: 'parent_chen', displayName: '陳媽媽', departmentCode: 'student', roleTagName: '家長' },
  { username: 'student_wang', displayName: '王同學', departmentCode: 'student', roleTagName: '學生' },
];

const TAGS: Array<{ type: TagType; name: string; color: string }> = [
  { type: 'grade', name: '高一', color: '#3b82f6' },
  { type: 'grade', name: '高二', color: '#3b82f6' },
  { type: 'grade', name: '高三', color: '#3b82f6' },
  { type: 'class', name: '一年一班', color: '#8b5cf6' },
  { type: 'class', name: '二年三班', color: '#8b5cf6' },
  { type: 'class', name: '三年五班', color: '#8b5cf6' },
  { type: 'department', name: '教務處', color: '#0ea5e9' },
  { type: 'department', name: '學務處', color: '#0ea5e9' },
  { type: 'department', name: '總務處', color: '#0ea5e9' },
  { type: 'department', name: '輔導處', color: '#0ea5e9' },
  { type: 'department', name: '資訊組', color: '#0ea5e9' },
  { type: 'department', name: '校長室', color: '#0ea5e9' },
  { type: 'activity', name: '模擬考', color: '#e87919' },
  { type: 'activity', name: '升學', color: '#e87919' },
  { type: 'activity', name: '研習', color: '#e87919' },
  { type: 'activity', name: '競賽', color: '#e87919' },
  { type: 'activity', name: '課表異動', color: '#e87919' },
  { type: 'activity', name: '收費', color: '#e87919' },
  { type: 'activity', name: '營隊', color: '#e87919' },
  { type: 'activity', name: '防疫', color: '#e87919' },
  { type: 'role', name: '學生', color: '#10b981' },
  { type: 'role', name: '家長', color: '#10b981' },
  { type: 'role', name: '教師', color: '#10b981' },
  { type: 'role', name: '訪客', color: '#10b981' },
];

export async function GET() {
  const report = { users: 0, nonDeptUsers: 0, roleAssignments: 0, tags: 0, announcements: 0, skipped: false };

  // 1. 處室帳號 (idempotent)
  const existingUsers = await listUsers();
  if (existingUsers.length === 0) {
    const passwordHash = await hashPassword(DEFAULT_PASSWORD);
    for (const a of DEPT_ACCOUNTS) {
      const u: User = {
        id: newId('u'),
        username: a.code,
        displayName: a.name,
        departmentCode: a.code,
        role: a.role,
        passwordHash,
        mustChangePassword: true,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      await createUser(u);
      report.users++;
    }
  } else {
    report.skipped = true;
  }

  // 1b. 路線 A:非處室 demo 帳號 (M-06 受眾分流)
  for (const a of NON_DEPT_ACCOUNTS) {
    const existing = await getUserByUsername(a.username);
    if (existing) continue;
    const passwordHash = await hashPassword(DEFAULT_PASSWORD);
    const u: User = {
      id: newId('u'),
      username: a.username,
      displayName: a.displayName,
      departmentCode: a.departmentCode,
      role: 'dept_officer', // 沿用既有 role enum(沒有 teacher/parent/student 的 enum 值,先用 dept_officer)
      passwordHash,
      mustChangePassword: true,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    await createUser(u);
    report.nonDeptUsers++;
  }

  // 2. 標籤 (idempotent: 用 name 查重)
  const existingTags = await listTags();
  const existingTagNames = new Set(existingTags.map((t) => t.name));
  for (const t of TAGS) {
    if (existingTagNames.has(t.name)) continue;
    const tag: Tag = {
      id: newId('t'),
      type: t.type,
      name: t.name,
      color: t.color,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    await createTag(tag);
    report.tags++;
  }

  // 2b. 路線 A:user_role_assignments 對應
  const tagList = await listTags();
  const roleTagByName = new Map(
    tagList.filter((t) => t.type === 'role').map((t) => [t.name, t.id]),
  );
  for (const a of NON_DEPT_ACCOUNTS) {
    const u = await getUserByUsername(a.username);
    if (!u) continue;
    const roleTagId = roleTagByName.get(a.roleTagName);
    if (!roleTagId) continue;
    await assignUserRoleTag(u.id, roleTagId);
    report.roleAssignments++;
  }

  // 3. 示範公告 (idempotent: 沒公告時才建)
  const existingAnnouncements = await listAnnouncements({ groups: [], search: undefined });
  if (existingAnnouncements.length === 0) {
    const fullTagList = await listTags();
    const tagByName = new Map(fullTagList.map((t) => [t.name, t]));

    const pickTags = (...names: string[]) =>
      names.map((n) => tagByName.get(n)?.id).filter((id): id is string => Boolean(id));

    const teachingUser = await getUserByUsername('teaching');
    const studentUser = await getUserByUsername('student');
    const generalUser = await getUserByUsername('general');

    type Sample = Omit<Announcement, 'id' | 'createdAt' | 'publishAt' | 'updatedAt'>;

    const samples: Sample[] = [
      {
        title: '114 學年度下學期高一高二第三次模擬考',
        content: '第三次模擬考訂於 6 月 23 日至 25 日舉行,考試日程表如附件。請同學於考前一周至教務處領取准考證,當日攜帶身分證、2B 鉛筆、橡皮擦應試。各科考試範圍請見附件 PDF。',
        publisherId: teachingUser?.id ?? 'u_teaching',
        publisherName: teachingUser?.displayName ?? '教務處',
        publisherDept: 'teaching',
        // 路線 A:加 role 標籤 → 受眾分流 (學生+教師 可看,處室承辦可看自己處室)
        tagIds: pickTags('模擬考', '高一', '高二', '學生', '教師'),
        attachmentIds: [],
        requireSignature: true,
      },
      {
        title: '114 學年度暑假營隊報名開始',
        content: '本校今年暑假共開設 8 個營隊,包含資訊科學營、自然探索營、領袖訓練營等。報名自即日起至 6/30 截止,請家長與同學至學務處網站下載報名表,填妥後繳回學務處。詳情請見附件簡章。',
        publisherId: studentUser?.id ?? 'u_student',
        publisherName: studentUser?.displayName ?? '學務處',
        publisherDept: 'student',
        // 受眾:學生+家長(不是教師)
        tagIds: pickTags('營隊', '高一', '高二', '高三', '學生', '家長'),
        attachmentIds: [],
        requireSignature: false,
      },
      {
        title: '6 月份校園水電維護通知',
        content: '6/15 (週日) 上午 8:00 至下午 5:00 進行全校水電管線年度維護,期間將分區停水停電。各辦公室請於 6/14 前完成重要文件備份,並關閉非必要電源。詳細停水停電時段如附件。',
        publisherId: generalUser?.id ?? 'u_general',
        publisherName: generalUser?.displayName ?? '總務處',
        publisherDept: 'general',
        // 受眾:教師+家長+學生(全校人員)
        tagIds: pickTags('課表異動', '教師', '家長', '學生'),
        attachmentIds: [],
        requireSignature: false,
      },
    ];

    const now = Date.now();
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      const ts = new Date(now - (i + 1) * 86400_000).toISOString();
      const a: Announcement = {
        id: newId('a'),
        title: s.title,
        content: s.content,
        publisherId: s.publisherId,
        publisherName: s.publisherName,
        publisherDept: s.publisherDept,
        tagIds: s.tagIds,
        attachmentIds: s.attachmentIds,
        requireSignature: s.requireSignature,
        publishAt: ts,
        updatedAt: ts,
      };
      await createAnnouncement(a);
      report.announcements++;
    }
  }

  return NextResponse.json({
    ok: true,
    message: report.skipped
      ? '已有帳號資料,跳過 user 建置;tag/announcement 已 idempotent 補齊'
      : '完整 seed 完成',
    report,
    accounts: [
      ...DEPT_ACCOUNTS.map((a) => ({
        username: a.code,
        password: DEFAULT_PASSWORD,
        dept: a.name,
        type: '處室',
      })),
      ...NON_DEPT_ACCOUNTS.map((a) => ({
        username: a.username,
        password: DEFAULT_PASSWORD,
        dept: a.displayName,
        type: '受眾',
      })),
    ],
  });
}
