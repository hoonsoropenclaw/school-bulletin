import { ChangePasswordForm } from './ChangePasswordForm';
import { getCurrentUserFull } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DEPARTMENT_INFO } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const me = await getCurrentUserFull();
  if (!me) redirect('/login');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">帳號設定</h1>
        <p className="mt-1 text-sm text-ink-500">管理你的帳號資訊與安全性</p>
      </div>

      {/* 帳號資訊 */}
      <div className="card p-6">
        <h2 className="mb-4 text-base font-semibold text-ink-900">帳號資訊</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink-500">帳號</dt>
            <dd className="mt-1 font-medium text-ink-900">{me.username}</dd>
          </div>
          <div>
            <dt className="text-ink-500">顯示名稱</dt>
            <dd className="mt-1 font-medium text-ink-900">{me.displayName}</dd>
          </div>
          <div>
            <dt className="text-ink-500">所屬處室</dt>
            <dd className="mt-1 font-medium text-ink-900">
              {DEPARTMENT_INFO[me.departmentCode].name}
            </dd>
          </div>
          <div>
            <dt className="text-ink-500">角色</dt>
            <dd className="mt-1 font-medium text-ink-900">
              {me.role === 'sysadmin' ? '系統管理員' : '處室承辦'}
            </dd>
          </div>
        </dl>
      </div>

      {/* 變更密碼 */}
      <div className="card p-6">
        <h2 className="mb-1 text-base font-semibold text-ink-900">變更密碼</h2>
        <p className="mb-4 text-sm text-ink-500">
          為了帳號安全，建議定期更換密碼。新密碼至少 8 個字元。
        </p>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
