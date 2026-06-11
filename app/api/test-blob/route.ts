
import { NextResponse } from 'next/server';
import { list as listBlobs } from '@vercel/blob';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const result = await listBlobs({ limit: 5 });
    return NextResponse.json({
      HAS_BLOB: !!process.env.BLOB_READ_WRITE_TOKEN,
      ok: true,
      blobCount: result.blobs.length,
      sample: result.blobs[0] || null
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg, stack: e instanceof Error ? e.stack : null });
  }
}
