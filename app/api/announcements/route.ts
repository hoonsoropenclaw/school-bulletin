import { NextRequest, NextResponse } from 'next/server';
import {
  createAnnouncement,
  listAnnouncements,
  getAnnouncement,
  updateAnnouncement,
  softDeleteAnnouncement,
  getAttachments,
  getTag,
  listTags,
  getUserRoleTagIds,
} from '@/lib/repository';
import { getCurrentUserFull, newId } from '@/lib/auth';
import type { Announcement, FilterPayload } from '@/lib/types';

export const runtime = 'nodejs';

function parseFilter(searchParams: URLSearchParams): FilterPayload {
  const groupsParam = searchParams.get('groups');
  const search = searchParams.get('q') || undefined;
  if (groupsParam) {
    try {
      const parsed = JSON.parse(Buffer.from(groupsParam, 'base64url').toString('utf8'));
      if (Array.isArray(parsed?.groups)) {
        return { groups: parsed.groups, search };
      }
    } catch {
      // 忽略 parse 錯誤,當作無篩選
    }
  }
  return { groups: [], search };
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const filter = parseFilter(sp);
  const limit = Math.min(parseInt(sp.get('limit') || '50', 10) || 50, 200);

  // 路線 A 補 1 (M-05) + 補 2 (M-06):從 session 撈 audience,套到 listAnnouncements
  const me = await getCurrentUserFull();
  let audience;
  if (me) {
    const roleTagIds = await getUserRoleTagIds(me.id);
    audience = {
      viewerDept: me.departmentCode,
      viewerIsSysadmin: me.role === 'sysadmin',
      viewerIsDeptOfficer: me.role === 'dept_officer',
      viewerRoleTagIds: roleTagIds,
    };
  }
  const items = await listAnnouncements(filter, audience);
  const limited = items.slice(0, limit);

  // 展開標籤 + 附件 (給前端用,一次拿)
  const allTags = await listTags();
  const tagMap = new Map(allTags.map((t) => [t.id, t]));

  const enriched = await Promise.all(
    limited.map(async (a) => {
      const tags = a.tagIds.map((id) => tagMap.get(id)).filter(Boolean);
      const attachments = await getAttachments(a.attachmentIds);
      return { ...a, tags, attachments };
    }),
  );

  return NextResponse.json({ data: enriched, total: items.length });
}

export async function POST(req: NextRequest) {
  const me = await getCurrentUserFull();
  if (!me || !me.isActive) {
    return NextResponse.json(
      { error: { code: 'UNAUTHENTICATED', message: '請先登入' } },
      { status: 401 },
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
  if (!body.title || body.title.length < 1 || body.title.length > 200) {
    return NextResponse.json(
      { error: { code: 'INVALID_TITLE', message: '標題需 1-200 字' } },
      { status: 400 },
    );
  }
  if (!body.content || body.content.trim().length === 0) {
    return NextResponse.json(
      { error: { code: 'INVALID_CONTENT', message: '內文不可為空' } },
      { status: 400 },
    );
  }
  const tagIds = Array.isArray(body.tagIds) ? body.tagIds : [];
  if (tagIds.length < 1) {
    return NextResponse.json(
      { error: { code: 'NO_TAGS', message: '至少需 1 個標籤' } },
      { status: 422 },
    );
  }
  if (tagIds.length > 10) {
    return NextResponse.json(
      { error: { code: 'TOO_MANY_TAGS', message: '標籤最多 10 個' } },
      { status: 422 },
    );
  }
  // 確認所有 tag 都存在
  for (const tid of tagIds) {
    const t = await getTag(tid);
    if (!t || !t.isActive) {
      return NextResponse.json(
        { error: { code: 'INVALID_TAG', message: `標籤 ${tid} 不存在或已停用` } },
        { status: 422 },
      );
    }
  }
  const now = new Date().toISOString();
  const a: Announcement = {
    id: newId('a'),
    title: body.title.trim(),
    content: body.content,
    publisherId: me.id,
    publisherDept: me.departmentCode,
    publisherName: me.displayName,
    tagIds,
    attachmentIds: Array.isArray(body.attachmentIds) ? body.attachmentIds : [],
    requireSignature: !!body.requireSignature,
    signatureDeadline: body.signatureDeadline || undefined,
    publishAt: now,
    updatedAt: now,
  };
  await createAnnouncement(a);
  return NextResponse.json({ data: a }, { status: 201 });
}
