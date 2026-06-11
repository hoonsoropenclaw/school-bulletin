import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUserFull } from '@/lib/auth';
import { DEPARTMENT_INFO } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentUserFull();
  if (!me) redirect('/login');

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="card p-4">
            <p className="mb-2 text-xs font-medium text-ink-500">後台</p>
            <p className="mb-3 text-sm text-ink-900">
              {DEPARTMENT_INFO[me.departmentCode].name}
            </p>
            <nav className="space-y-1">
              <Link
                href="/admin/announcements"
                className="block rounded px-2 py-1.5 text-sm text-ink-700 hover:bg-ink-50"
              >
                我發布的公告
              </Link>
              <Link
                href="/admin/announcements/new"
                className="block rounded px-2 py-1.5 text-sm text-ink-700 hover:bg-ink-50"
              >
                發布新公告
              </Link>
            </nav>
          </div>
        </aside>
        <section>{children}</section>
      </div>
    </div>
  );
}
