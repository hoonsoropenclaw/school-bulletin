// POST /api/announcements/[id]/sign - 簽收公告
// M-07 補完:寫入 signature_receipts 表(去重),idempotent

import { NextRequest, NextResponse } from 'next/server';
import {
  getAnnouncement,
  createSignatureReceipt,
  getSignatureReceipt,
} from '@/lib/repository';
import { getCurrentUserFull, newId } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
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
  if (!a.requireSignature) {
    return NextResponse.json(
      { error: { code: 'NOT_REQUIRED', message: '此公告不需簽收' } },
      { status: 422 },
    );
  }

  // 已簽收?回傳既有紀錄(idempotent,使用者按多次不重複建)
  const existing = await getSignatureReceipt(id, me.id);
  if (existing) {
    return NextResponse.json({ data: existing, alreadySigned: true });
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    undefined;
  const ua = req.headers.get('user-agent') || undefined;

  const sig = {
    id: newId('sig'),
    announcementId: id,
    userId: me.id,
    signedAt: new Date().toISOString(),
    ipAddress: ip,
    userAgent: ua,
  };
  await createSignatureReceipt(sig);
  return NextResponse.json({ data: sig }, { status: 201 });
}
