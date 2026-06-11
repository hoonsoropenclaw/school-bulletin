import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUserFull } from '@/lib/auth';
import { listAnnouncements, countSignatureReceipts } from '@/lib/repository';
import { DEPARTMENT_INFO } from '@/lib/types';
import { AnnouncementActions } from './AnnouncementActions';

export const dynamic = 'force-dynamic';

export default async function MyAnnouncementsPage() {
  const me = await getCurrentUserFull();
  if (!me) redirect('/login');

  const all = await listAnnouncements({ groups: [] });
  const mine = all.filter((a) => a.publisherId === me.id);

  // 路線 A 補 3 (M-07):後台加「簽收 X/Y」統計
  // 平行撈所有公告的簽收數(避免 N+1)
  const sigCounts = await Promise.all(
    mine.map(async (a) => [a.id, await countSignatureReceipts(a.id)] as const),
  );
  const sigCountMap = new Map(sigCounts);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">我發布的公告</h1>
          <p className="mt-1 text-sm text-ink-500">{DEPARTMENT_INFO[me.departmentCode].name} · 共 {mine.length} 則</p>
        </div>
        <Link href="/admin/announcements/new" className="btn-primary text-sm">
          + 發布新公告
        </Link>
      </div>

      {mine.length === 0 ? (
        <div className="card p-12 text-center text-ink-500">
          <p>尚未發布任何公告</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {mine.map((a) => {
            const sigCount = sigCountMap.get(a.id) ?? 0;
            return (
              <li key={a.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/announcements/${a.id}`}
                      className="text-base font-medium text-ink-900 hover:text-accent-600"
                    >
                      {a.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500">
                      <time dateTime={a.publishAt}>
                        {new Date(a.publishAt).toLocaleString('zh-TW')}
                      </time>
                      {a.attachmentIds.length > 0 && ` · 附件 ${a.attachmentIds.length} 個`}
                      {a.requireSignature && (
                        <span className="chip bg-accent-100 text-accent-700">需簽收</span>
                      )}
                      {a.requireSignature && (
                        <span className="text-accent-700">
                          · 簽收 {sigCount} 人
                        </span>
                      )}
                    </div>
                  </div>
                  <AnnouncementActions
                    announcementId={a.id}
                    title={a.title}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
