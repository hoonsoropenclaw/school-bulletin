import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { createAttachment, listAttachments } from '@/lib/repository';
import { getCurrentUserFull, newId } from '@/lib/auth';
import { HAS_BLOB } from '@/lib/storage';
import type { Attachment } from '@/lib/types';

export const runtime = 'nodejs';

const MAX_BYTES = 50 * 1024 * 1024; // 50MB

export async function POST(req: NextRequest) {
  const me = await getCurrentUserFull();
  if (!me || !me.isActive) {
    return NextResponse.json(
      { error: { code: 'UNAUTHENTICATED', message: '請先登入' } },
      { status: 401 },
    );
  }
  if (!HAS_BLOB) {
    return NextResponse.json(
      { error: { code: 'BLOB_NOT_CONFIGURED', message: '附件儲存未配置 (需 BLOB_READ_WRITE_TOKEN)' } },
      { status: 503 },
    );
  }
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: { code: 'NO_FILE', message: '請選擇檔案' } },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: { code: 'FILE_TOO_LARGE', message: '檔案不可超過 50MB' } },
      { status: 413 },
    );
  }
  const blob = await put(file.name, file, {
    access: 'public',
    addRandomSuffix: true,
  });
  const a: Attachment = {
    id: newId('att'),
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    blobUrl: blob.url,
    uploadedBy: me.id,
    createdAt: new Date().toISOString(),
  };
  await createAttachment(a);
  return NextResponse.json({ data: a }, { status: 201 });
}

export async function GET() {
  // MVP 簡化:列出所有附件(可後續加 ?uploadedBy=me 等 filter)
  const atts = await listAttachments();
  return NextResponse.json({ data: atts });
}
