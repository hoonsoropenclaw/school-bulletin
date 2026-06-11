import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST() {
  await destroySession();
  return NextResponse.redirect(new URL('/', 'http://localhost:3000'), { status: 303 });
}

// 對 form-action GET 也支援,有些瀏覽器/客戶端用 GET
export async function GET(req: Request) {
  await destroySession();
  return NextResponse.redirect(new URL('/', req.url), { status: 303 });
}
