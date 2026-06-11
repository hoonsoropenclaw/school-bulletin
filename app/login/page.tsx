import { LoginForm } from './LoginForm';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const me = await getCurrentUser();
  if (me) redirect('/');

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="card p-6">
        <h1 className="mb-1 text-2xl font-semibold text-ink-900">處室登入</h1>
        <p className="mb-6 text-sm text-ink-500">
          帳號為處室英文代碼,首次登入建議變更密碼。
        </p>
        <LoginForm />
        <div className="mt-6 border-t border-ink-200 pt-4 text-xs text-ink-500">
          <p className="mb-1 font-medium text-ink-700">預設帳號:</p>
          <ul className="space-y-0.5 font-mono text-[11px]">
            <li>teaching / *** — 教務處</li>
            <li>student / *** — 學務處</li>
            <li>general / *** — 總務處</li>
            <li>counsel / *** — 輔導處</li>
            <li>it / *** — 資訊組</li>
            <li>principal / *** — 校長室</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
