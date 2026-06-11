import { NextRequest, NextResponse } from 'next/server';
import {
  getAnnouncement,
  updateAnnouncement,
  softDeleteAnnouncement,
  getAttachments,
  getTag,
  listTags,
} from '@/lib/repository';
import { getCurrentUserFull } from '@/lib/auth';
import type { Announcement } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await getAnnouncement(id);
  if (!a || a.deletedAt) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: '公告不存在' } },
      { status: 404 },
    );
  }
  const allTags = await listTags();
  const tagMap = new Map(allTags.map((t) => [t.id, t]));
  const tags = a.tagIds.map((tid) => tagMap.get(tid)).filter(Boolean);
  const attachments = await getAttachments(a.attachmentIds);
  return NextResponse.json({ data: { ...a, tags, attachments } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      { error: { code: 'FORBIDDEN', message: '只能編輯自己發布的公告' } },
      { status: 403 },
    );
  }
  let body: Partial<Announcement> & { tagIds?: string[]; attachmentIds?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_JSON', message: '請求格式錯誤' } },
      { status: 400 },
    );
  }
  if (body.title !== undefined) {
    if (body.title.length < 1 || body.title.length > 200) {
      return NextResponse.json(
        { error: { code: 'INVALID_TITLE', message: '標題需 1-200 字' } },
        { status: 400 },
      );
    }
    a.title = body.title.trim();
  }
  if (body.content !== undefined) a.content = body.content;
  if (Array.isArray(body.tagIds)) {
    if (body.tagIds.length < 1) {
      return NextResponse.json(
        { error: { code: 'NO_TAGS', message: '至少需 1 個標籤' } },
        { status: 422 },
      );
    }
    for (const tid of body.tagIds) {
      const t = await getTag(tid);
      if (!t || !t.isActive) {
        return NextResponse.json(
          { error: { code: 'INVALID_TAG', message: `標籤 ${tid} 不存在或已停用` } },
          { status: 422 },
        );
      }
    }
    a.tagIds = body.tagIds;
  }
  if (Array.isArray(body.attachmentIds)) a.attachmentIds = body.attachmentIds;
  if (body.requireSignature !== undefined) a.requireSignature = !!body.requireSignature;
  if (body.signatureDeadline !== undefined)
    a.signatureDeadline = body.signatureDeadline || undefined;
  a.updatedAt = new Date().toISOString();
  await updateAnnouncement(a);
  return NextResponse.json({ data: a });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      { error: { code: 'FORBIDDEN', message: '只能刪除自己發布的公告' } },
      { status: 403 },
    );
  }
  await softDeleteAnnouncement(id);
  return NextResponse.json({ data: { ok: true } });
}
