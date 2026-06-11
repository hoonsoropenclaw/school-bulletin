import { NextResponse } from 'next/server';
import { listTags } from '@/lib/repository';

export const runtime = 'nodejs';

export async function GET() {
  const tags = await listTags();
  return NextResponse.json({ data: tags });
}
