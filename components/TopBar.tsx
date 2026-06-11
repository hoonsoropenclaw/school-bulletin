import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { DEPARTMENT_INFO } from '@/lib/types';

export async function TopBar() {
  const me = await getCurrentUser();
  return (
    <header className="border-b border-ink-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-ink-900">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-ink-800 text-sm font-bold text-white">
            校
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold">校園公告系統</div>
            <div className="text-[10px] text-ink-500">School Bulletin</div>
          </div>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/" className="btn-ghost text-sm">
            公告列表
          </Link>
          {me ? (
            <>
              <Link href="/admin/announcements/new" className="btn-outline text-sm">
                發布公告
              </Link>
              <span className="hidden text-sm text-ink-500 sm:inline">
                {DEPARTMENT_INFO[me.departmentCode].name} · {me.displayName}
              </span>
              <form action="/api/auth/logout" method="post" className="inline">
                <button type="submit" className="btn-ghost text-sm">
                  登出
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="btn-primary text-sm">
              處室登入
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
