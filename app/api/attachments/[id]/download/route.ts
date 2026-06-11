// 附件下載 proxy
// 不直接吐 R2/Blob URL(讓前端 redirect 過去),由後端 fetch 再串流回前端
// 好處:可以加權限檢查(雖然 MVP 公告已是公開,但仍保留 hook)

import { NextRequest, NextResponse } from 'next/server';
import { getAttachment } from '@/lib/repository';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await getAttachment(id);
  if (!a) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: '附件不存在' } },
      { status: 404 },
    );
  }
  // 簡化:直接 302 到 Blob URL
  // v2 可加權限檢查、稽核記錄
  return NextResponse.redirect(a.blobUrl, { status: 302 });
}
