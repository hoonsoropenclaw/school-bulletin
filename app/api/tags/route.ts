import { NextResponse } from 'next/server';
import { createTag, listTags } from '@/lib/repository';
import { getCurrentUser } from '@/lib/auth';
import { newId } from '@/lib/auth';
import type { Tag, TagType } from '@/lib/types';

export const runtime = 'nodejs';

const VALID_TYPES: TagType[] = ['grade', 'class', 'department', 'activity', 'role', 'custom'];

export async function GET() {
  const tags = await listTags();
  return NextResponse.json({ data: tags });
}

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '請先登入' } }, { status: 401 });
  }

  let body: { name?: string; type?: string; color?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'JSON 格式錯誤' } }, { status: 400 });
  }

  const name = (body.name ?? '').trim().slice(0, 20);
  const type = (body.type ?? 'custom') as TagType;
  const color = (body.color ?? '#94a3b8').slice(0, 16);

  if (!name) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: '標籤名稱不可為空' } }, { status: 400 });
  }
  if (name.length < 1 || name.length > 20) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: '標籤名稱需 1-20 字' } }, { status: 400 });
  }
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: '標籤類型無效' } }, { status: 400 });
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: '顏色格式錯誤' } }, { status: 400 });
  }

  // 檢查同 type 內 name 是否重複
  const existing = await listTags();
  const dup = existing.find((t) => t.type === type && t.name === name);
  if (dup) {
    return NextResponse.json({ error: { code: 'CONFLICT', message: '同類型已有此標籤名稱' } }, { status: 409 });
  }

  const tag: Tag = {
    id: newId('t'),
    type,
    name,
    color,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  await createTag(tag);
  return NextResponse.json({ data: tag });
}
