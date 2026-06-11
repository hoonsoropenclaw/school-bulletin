
import { NextResponse } from 'next/server';
import { kvGet, kvSet, HAS_KV } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const before = await kvGet<string>('test:hello');
  await kvSet('test:hello', 'world-' + Date.now());
  const after = await kvGet<string>('test:hello');
  return NextResponse.json({ HAS_KV, before, after });
}
