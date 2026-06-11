import { NextRequest, NextResponse } from 'next/server';
import { createAttachment, listAttachments } from '@/lib/repository';
import { getCurrentUserFull, newId } from '@/lib/auth';
import { getSupabaseAdmin, HAS_SUPABASE } from '@/lib/db';
import type { Attachment } from '@/lib/types';

export const runtime = 'nodejs';

const MAX_BYTES = 50 * 1024 * 1024; // 50MB
const BUCKET = 'attachments';

export async function POST(req: NextRequest) {
  const me = await getCurrentUserFull();
  if (!me || !me.isActive) {
    return NextResponse.json(
      { error: { code: 'UNAUTHENTICATED', message: '請先登入' } },
      { status: 401 },
    );
  }
  if (!HAS_SUPABASE) {
    return NextResponse.json(
      { error: { code: 'STORAGE_NOT_CONFIGURED', message: '附件儲存未配置' } },
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
  // Supabase Storage 上傳
  const supabase = getSupabaseAdmin();
  const fileId = newId('att');
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${me.id}/${fileId}-${safeName}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buf, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });
  if (upErr) {
    return NextResponse.json(
      { error: { code: 'UPLOAD_FAILED', message: upErr.message } },
      { status: 500 },
    );
  }
  const a: Attachment = {
    id: fileId,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    storagePath: path,
    uploadedBy: me.id,
    createdAt: new Date().toISOString(),
  };
  await createAttachment(a);
  return NextResponse.json({ data: a }, { status: 201 });
}

export async function GET() {
  const atts = await listAttachments();
  return NextResponse.json({ data: atts });
}
