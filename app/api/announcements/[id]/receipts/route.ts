// GET /api/announcements/[id]/receipts - 後台看此公告的已讀 / 已簽名單
// M-07 補完:後台統計用
// 權限:只有原發布者或 sysadmin 可看

import { NextRequest, NextResponse } from 'next/server';
import {
  getAnnouncement,
  listReadReceipts,
  listSignatureReceipts,
  getUsersRoleTagIdsMap,
  listUsers,
  listTags,
} from '@/lib/repository';
import { getCurrentUserFull } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const me = await getCurrentUserFull();
  if (!me || !me.isActive) {
    return NextResponse.json(
      { error: { code: 'UNAUTHENTICATED', message: '請先登入' } },
      { status: 401 },
    );
  }

  const a = await getAnnouncement(id);
  if (!a || a.deletedAt) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: '公告不存在' } },
      { status: 404 },
    );
  }
  if (a.publisherId !== me.id && me.role !== 'sysadmin') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: '只能查看自己發布公告的簽收回條' } },
      { status: 403 },
    );
  }

  const [read, signed, allUsers, allTags] = await Promise.all([
    listReadReceipts(id),
    listSignatureReceipts(id),
    listUsers(),
    listTags(),
  ]);

  // 把 user_id → displayName / role_tag 對應做出來(後台顯示用)
  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  const roleTagByName = new Map(
    allTags.filter((t) => t.type === 'role').map((t) => [t.id, t]),
  );
  const userIds = Array.from(new Set([...read, ...signed].map((r) => r.userId)));
  const roleMap = await getUsersRoleTagIdsMap(userIds);

  const enrich = (r: { userId: string; signedAt?: string; readAt?: string }) => {
    const u = userMap.get(r.userId);
    const roleTagIds = roleMap.get(r.userId) ?? [];
    const roleNames = roleTagIds
      .map((tid) => roleTagByName.get(tid)?.name)
      .filter((n): n is string => Boolean(n));
    return {
      ...r,
      displayName: u?.displayName ?? '(已刪除使用者)',
      departmentCode: u?.departmentCode,
      roleNames,
    };
  };

  return NextResponse.json({
    data: {
      announcementId: id,
      readCount: read.length,
      signedCount: signed.length,
      reads: read.map(enrich),
      signatures: signed.map(enrich),
    },
  });
}
