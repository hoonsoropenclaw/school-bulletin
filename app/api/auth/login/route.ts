import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsername, updateUser } from '@/lib/repository';
import { createSession, verifyPassword } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_JSON', message: '請求格式錯誤' } },
      { status: 400 },
    );
  }
  const { username, password } = body;
  if (!username || !password) {
    return NextResponse.json(
      { error: { code: 'MISSING_FIELDS', message: '請輸入帳號與密碼' } },
      { status: 400 },
    );
  }
  const u = await getUserByUsername(username);
  if (!u || !u.isActive) {
    return NextResponse.json(
      { error: { code: 'INVALID_CREDENTIALS', message: '帳號或密碼錯誤' } },
      { status: 401 },
    );
  }
  const ok = await verifyPassword(password, u.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: { code: 'INVALID_CREDENTIALS', message: '帳號或密碼錯誤' } },
      { status: 401 },
    );
  }
  u.lastLoginAt = new Date().toISOString();
  await updateUser(u);
  await createSession(u.id);
  return NextResponse.json({
    data: {
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      departmentCode: u.departmentCode,
      role: u.role,
    },
  });
}
