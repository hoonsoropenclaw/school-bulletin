import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getAnnouncement,
  getAttachments,
  listTags,
  getSignatureReceipt,
} from '@/lib/repository';
import { getCurrentUserFull } from '@/lib/auth';
import { DEPARTMENT_INFO } from '@/lib/types';
import { sanitizeHtml } from '@/lib/sanitize';
import { SignatureButton } from './SignatureButton';

function normalizeHtmlColors(html: string): string {
  return html.replace(
    /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g,
    (_, r, g, b) => {
      const hex = (n: string) => Number(n).toString(16).padStart(2, '0');
      return '#' + hex(r) + hex(g) + hex(b);
    },
  );
}

export const dynamic = 'force-dynamic';

export default async function AnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const a = await getAnnouncement(id);
  if (!a || a.deletedAt) notFound();
  const allTags = await listTags();
  const tagMap = new Map(allTags.map((t) => [t.id, t]));
  const tags = a.tagIds.map((tid) => tagMap.get(tid)).filter(Boolean);
  const attachments = await getAttachments(a.attachmentIds);

  // 路線 A 補 3 (M-07):撈登入者對此公告的簽收狀態
  const me = await getCurrentUserFull();
  let existingSignedAt: string | undefined;
  if (me && a.requireSignature) {
    const sig = await getSignatureReceipt(id, me.id);
    existingSignedAt = sig?.signedAt;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link href="/" className="mb-4 inline-flex items-center text-sm text-ink-500 hover:text-ink-700">
        ← 返回公告列表
      </Link>

      <article className="card p-6">
        <header className="mb-4 border-b border-ink-200 pb-4">
          <h1 className="text-2xl font-semibold text-ink-900">{a.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink-500">
            <span className="chip bg-ink-800 text-white">
              {DEPARTMENT_INFO[a.publisherDept]?.name ?? a.publisherDept}
            </span>
            <span>{a.publisherName}</span>
            <span>·</span>
            <time dateTime={a.publishAt}>
              {new Date(a.publishAt).toLocaleString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </time>
            {a.requireSignature && (
              <span className="chip bg-accent-100 text-accent-700">需簽收</span>
            )}
          </div>
          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {tags.map((t) =>
                t ? (
                  <Link
                    key={t.id}
                    href={`/?q=${encodeURIComponent(t.name)}`}
                    className="chip"
                    style={{
                      backgroundColor: (t.color || '#94a3b8') + '20',
                      color: t.color || '#475569',
                    }}
                  >
                    {t.name}
                  </Link>
                ) : null,
              )}
            </div>
          )}
        </header>

        <div
          className="prose prose-sm max-w-none text-ink-800 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(normalizeHtmlColors(a.content)) }}
        />

        {attachments.length > 0 && (
          <div className="mt-6 border-t border-ink-200 pt-4">
            <h2 className="mb-2 text-sm font-semibold text-ink-700">附件 ({attachments.length})</h2>
            <ul className="space-y-2">
              {attachments.map((att) => (
                <li key={att.id}>
                  <a
                    href={`/api/attachments/${att.id}/download`}
                    className="flex items-center gap-2 rounded border border-ink-200 bg-ink-50 px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-ink-100"
                  >
                    <span className="text-accent-600">📎</span>
                    <span className="flex-1 truncate">{att.fileName}</span>
                    <span className="text-xs text-ink-500">
                      {(att.sizeBytes / 1024).toFixed(1)} KB
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 路線 A 補 3:簽收按鈕(只在 requireSignature=true 時顯示) */}
        {a.requireSignature && (
          <SignatureButton
            announcementId={a.id}
            existingSignedAt={existingSignedAt}
            isLoggedIn={!!me}
          />
        )}
      </article>
    </div>
  );
}
