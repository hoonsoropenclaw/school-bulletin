// Seed 6 處室帳號 + 預設標籤 (5 種類型)
// 跑法: npm run seed
//
// 帳號 = 處室 code,密碼統一 = School@2026(首次登入可改)
// 之後若已 seed 過會跳過,不重複建

import { createTag, createUser, getUserByUsername, listUsers } from '../lib/repository';
import { hashPassword, newId } from '../lib/auth';
import type { Tag, TagType, User, DepartmentCode } from '../lib/types';

const DEFAULT_PASSWORD = 'School@2026';

const DEPT_ACCOUNTS: Array<{ code: DepartmentCode; role: 'dept_officer' | 'sysadmin' }> = [
  { code: 'teaching', role: 'dept_officer' },
  { code: 'student', role: 'dept_officer' },
  { code: 'general', role: 'dept_officer' },
  { code: 'counsel', role: 'dept_officer' },
  { code: 'it', role: 'dept_officer' },
  { code: 'principal', role: 'sysadmin' },
];

const DEPT_NAMES: Record<DepartmentCode, string> = {
  teaching: '教務處',
  student: '學務處',
  general: '總務處',
  counsel: '輔導處',
  it: '資訊組',
  principal: '校長室',
};

const TAGS: Array<{ type: TagType; name: string; color: string; description?: string }> = [
  // 年級
  { type: 'grade', name: '高一', color: '#3b82f6' },
  { type: 'grade', name: '高二', color: '#3b82f6' },
  { type: 'grade', name: '高三', color: '#3b82f6' },
  // 班級 (示意,只建幾個)
  { type: 'class', name: '一年一班', color: '#8b5cf6' },
  { type: 'class', name: '二年三班', color: '#8b5cf6' },
  { type: 'class', name: '三年五班', color: '#8b5cf6' },
  // 處室
  { type: 'department', name: '教務處', color: '#0ea5e9' },
  { type: 'department', name: '學務處', color: '#0ea5e9' },
  { type: 'department', name: '總務處', color: '#0ea5e9' },
  { type: 'department', name: '輔導處', color: '#0ea5e9' },
  { type: 'department', name: '資訊組', color: '#0ea5e9' },
  { type: 'department', name: '校長室', color: '#0ea5e9' },
  // 活動類型
  { type: 'activity', name: '模擬考', color: '#e87919' },
  { type: 'activity', name: '升學', color: '#e87919' },
  { type: 'activity', name: '研習', color: '#e87919' },
  { type: 'activity', name: '競賽', color: '#e87919' },
  { type: 'activity', name: '課表異動', color: '#e87919' },
  { type: 'activity', name: '收費', color: '#e87919' },
  { type: 'activity', name: '營隊', color: '#e87919' },
  { type: 'activity', name: '防疫', color: '#e87919' },
  // 角色 (受眾)
  { type: 'role', name: '學生', color: '#10b981' },
  { type: 'role', name: '家長', color: '#10b981' },
  { type: 'role', name: '教師', color: '#10b981' },
  { type: 'role', name: '訪客', color: '#10b981' },
];

async function seedUsers() {
  const existing = await listUsers();
  if (existing.length > 0) {
    console.log(`✓ Users already seeded (${existing.length} found), skip`);
    return;
  }
  const passwordHash = await hashPassword(DEFAULT_PASSWORD);
  for (const a of DEPT_ACCOUNTS) {
    const u: User = {
      id: newId('u'),
      username: a.code,
      displayName: DEPT_NAMES[a.code],
      departmentCode: a.code,
      role: a.role,
      passwordHash,
      mustChangePassword: true,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    await createUser(u);
    console.log(`✓ User: ${a.code} / ${DEFAULT_PASSWORD} (${DEPT_NAMES[a.code]})`);
  }
}

async function seedTags() {
  // 檢查第一個是否已存在,存在就跳過
  const probe = await getUserByUsername('teaching');
  if (!probe) {
    console.log('  (no users yet, will still seed tags)');
  }
  for (const t of TAGS) {
    const tag: Tag = {
      id: newId('t'),
      type: t.type,
      name: t.name,
      color: t.color,
      description: t.description,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    await createTag(tag);
  }
  console.log(`✓ Seeded ${TAGS.length} tags across 5 types`);
}

async function main() {
  console.log('=== School Bulletin seed ===\n');
  await seedUsers();
  await seedTags();
  console.log('\n=== Done ===');
  console.log('\n登入帳號 = 處室 code:');
  DEPT_ACCOUNTS.forEach((a) => {
    console.log(`  ${a.code.padEnd(10)} / ${DEFAULT_PASSWORD}  (${DEPT_NAMES[a.code]})`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
