// 附件下載 — 從 Supabase Storage 抓 bytes 再串流回去
// 不直接 302 (保留 hook 給未來加權限檢查 / 稽核)

import { NextRequest, NextResponse } from 'next/server';
import { getAttachment } from '@/lib/repository';
import { getSupabaseAdmin } from '@/lib/db';

export const runtime = 'nodejs';

const BUCKET = 'attachments';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await getAttachment(id);
  if (!a) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: '附件不存在' } },
      { status: 404 },
    );
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(a.storagePath);
  if (error || !data) {
    return NextResponse.json(
      { error: { code: 'DOWNLOAD_FAILED', message: error?.message ?? '下載失敗' } },
      { status: 502 },
    );
  }
  const arrayBuffer = await data.arrayBuffer();
  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': a.mimeType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(a.fileName)}`,
      'Content-Length': String(a.sizeBytes),
    },
  });
}
