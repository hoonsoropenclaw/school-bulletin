'use client';

import { useState, useTransition } from 'react';

interface Props {
  announcementId: string;
  // 伺服器端已撈過的簽收時間(若已簽收,顯示這個;不顯示按鈕)
  existingSignedAt?: string;
  // 是否登入
  isLoggedIn: boolean;
}

/**
 * 公告詳情頁底部的「我已簽收」按鈕
 * - 未登入:不顯示
 * - 已登入未簽收:顯示按鈕,按下 POST /api/announcements/[id]/sign
 * - 已登入已簽收:顯示「✅ 已於 X 時間簽收」
 */
export function SignatureButton({ announcementId, existingSignedAt, isLoggedIn }: Props) {
  const [signedAt, setSignedAt] = useState<string | undefined>(existingSignedAt);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isLoggedIn) return null;

  async function handleSign() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/announcements/${announcementId}/sign`, {
          method: 'POST',
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error?.message ?? '簽收失敗');
          return;
        }
        setSignedAt(data.data.signedAt);
      } catch {
        setError('網路錯誤,請稍後再試');
      }
    });
  }

  if (signedAt) {
    return (
      <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
        <p className="text-sm font-medium text-emerald-700">
          ✅ 已於 {new Date(signedAt).toLocaleString('zh-TW')} 完成簽收
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-md border border-accent-200 bg-accent-50 p-4">
      <p className="mb-2 text-sm text-ink-700">此公告需簽收確認</p>
      <button
        type="button"
        onClick={handleSign}
        disabled={isPending}
        className="btn-primary"
      >
        {isPending ? '簽收中...' : '我已簽收'}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
