// 密碼修改 — 處室用戶自改密碼
// 需要登入 + 輸入目前密碼 (避免 session 被偷走時被改)

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFull, hashPassword, verifyPassword } from '@/lib/auth';
import { getUser, updateUser } from '@/lib/repository';

export const runtime = 'nodejs';

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: NextRequest) {
  // 1. 驗登入
  const me = await getCurrentUserFull();
  if (!me || !me.isActive) {
    return NextResponse.json(
      { error: { code: 'UNAUTHENTICATED', message: '請先登入' } },
      { status: 401 },
    );
  }

  // 2. parse body
  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: '無效的請求格式' } },
      { status: 400 },
    );
  }

  const { currentPassword, newPassword } = body;

  if (!currentPassword || typeof currentPassword !== 'string') {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: '請輸入目前密碼' } },
      { status: 400 },
    );
  }
  if (!newPassword || typeof newPassword !== 'string') {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: '請輸入新密碼' } },
      { status: 400 },
    );
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: { code: 'WEAK_PASSWORD', message: `新密碼至少需 ${MIN_PASSWORD_LENGTH} 個字元` } },
      { status: 400 },
    );
  }
  if (newPassword === currentPassword) {
    return NextResponse.json(
      { error: { code: 'SAME_PASSWORD', message: '新密碼不可與目前密碼相同' } },
      { status: 400 },
    );
  }

  // 3. 重新從 DB 撈最新 user (確保 hash 沒過期)
  const fresh = await getUser(me.id);
  if (!fresh) {
    return NextResponse.json(
      { error: { code: 'USER_NOT_FOUND', message: '帳號不存在' } },
      { status: 404 },
    );
  }

  // 4. 驗證目前密碼
  const ok = await verifyPassword(currentPassword, fresh.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: { code: 'WRONG_PASSWORD', message: '目前密碼不正確' } },
      { status: 401 },
    );
  }

  // 5. 雜湊新密碼 + 寫回
  const newHash = await hashPassword(newPassword);
  const updated = { ...fresh, passwordHash: newHash, mustChangePassword: false };
  await updateUser(updated);

  return NextResponse.json({
    data: { ok: true, message: '密碼已更新' },
  });
}
