// GET /api/me/signatures - 我簽收過的公告列表
// M-07 補完:個人簽收紀錄

import { NextResponse } from 'next/server';
import {
  listMySignatures,
  getAnnouncement,
  listAnnouncements,
} from '@/lib/repository';
import { getCurrentUserFull } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const me = await getCurrentUserFull();
  if (!me || !me.isActive) {
    return NextResponse.json(
      { error: { code: 'UNAUTHENTICATED', message: '請先登入' } },
      { status: 401 },
    );
  }

  const mySigs = await listMySignatures(me.id);
  // 一次撈公告拿標題(避免 N+1)
  const all = await listAnnouncements({ groups: [] });
  const byId = new Map(all.map((a) => [a.id, a]));

  const enriched = mySigs.map((s) => ({
    id: s.id,
    announcementId: s.announcementId,
    announcementTitle: byId.get(s.announcementId)?.title ?? '(已刪除)',
    signedAt: s.signedAt,
  }));

  return NextResponse.json({ data: enriched, total: enriched.length });
}
