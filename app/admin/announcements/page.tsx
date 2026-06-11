import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUserFull } from '@/lib/auth';
import { listAnnouncements } from '@/lib/repository';
import { DEPARTMENT_INFO } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function MyAnnouncementsPage() {
  const me = await getCurrentUserFull();
  if (!me) redirect('/login');

  const all = await listAnnouncements({ groups: [] });
  const mine = all.filter((a) => a.publisherId === me.id);

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
          {mine.map((a) => (
            <li key={a.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/announcements/${a.id}`}
                    className="text-base font-medium text-ink-900 hover:text-accent-600"
                  >
                    {a.title}
                  </Link>
                  <div className="mt-1 text-xs text-ink-500">
                    <time dateTime={a.publishAt}>
                      {new Date(a.publishAt).toLocaleString('zh-TW')}
                    </time>
                    {a.attachmentIds.length > 0 && ` · 附件 ${a.attachmentIds.length} 個`}
                    {a.requireSignature && ' · 需簽收'}
                  </div>
                </div>
                <Link
                  href={`/announcements/${a.id}`}
                  className="btn-outline text-xs"
                >
                  查看
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
