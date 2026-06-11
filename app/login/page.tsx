import { LoginForm } from './LoginForm';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const me = await getCurrentUser();
  if (me) redirect('/');

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card overflow-hidden">
        <div className="border-b border-ink-200 bg-gradient-to-br from-ink-800 to-ink-900 px-6 py-8 text-white">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-white/10 text-base font-bold backdrop-blur">
            校
          </div>
          <h1 className="text-xl font-semibold tracking-tight">處室登入</h1>
          <p className="mt-1 text-sm text-ink-200">
            學校各處室統一公告管理入口
          </p>
        </div>

        <div className="p-6">
          <LoginForm />
        </div>

        <div className="border-t border-ink-200 bg-ink-50 px-6 py-4 text-xs text-ink-600">
          <p className="mb-2 font-semibold text-ink-800">預設 6 個處室帳號</p>
          <p className="mb-2 text-[11px] text-ink-500">
            密碼統一為 <span className="font-mono text-ink-700">School@2026</span>,首次登入後建議變更
          </p>
          <ul className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
            <li><span className="text-ink-500">teaching</span> · 教務處</li>
            <li><span className="text-ink-500">student</span> · 學務處</li>
            <li><span className="text-ink-500">general</span> · 總務處</li>
            <li><span className="text-ink-500">counsel</span> · 輔導處</li>
            <li><span className="text-ink-500">it</span> · 資訊組</li>
            <li><span className="text-ink-500">principal</span> · 校長室</li>
          </ul>
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-ink-500">
        首次部署? <Link href="/api/seed-demo" className="text-accent-600 hover:underline" target="_blank">點此初始化示範資料</Link>
      </div>
    </div>
  );
}
