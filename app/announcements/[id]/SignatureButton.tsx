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
 * - 已登入未簽收:顯示按鈕 + 點擊後先彈確認 dialog 才送出
 * - 已登入已簽收:顯示「✅ 已於 X 時間簽收」
 *
 * 「簽收」是法律/行政意義上的確認動作:
 * 1. 證明你已閱讀公告內容
 * 2. 系統記錄:帳號 + 時間 + IP + 瀏覽器
 * 3. 不可撤回(如有錯誤請聯絡發布處室更正)
 */
export function SignatureButton({ announcementId, existingSignedAt, isLoggedIn }: Props) {
  const [signedAt, setSignedAt] = useState<string | undefined>(existingSignedAt);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isLoggedIn) return null;

  async function handleSign() {
    setError(null);
    setShowConfirm(false);
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
        <p className="mt-1 text-xs text-emerald-600">
          系統已記錄您的簽收時間。如有疑慮請聯絡發布處室。
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-md border border-accent-200 bg-accent-50 p-4">
      <div className="mb-3 flex items-start gap-2">
        <span className="text-lg">📝</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-ink-900">此公告需簽收確認</p>
          <p className="mt-1 text-xs text-ink-600">
            點擊「我已簽收」表示您已閱讀完本公告內容。
            系統將記錄您的<strong>帳號、簽收時間、IP 位址與瀏覽器資訊</strong>，作為日後查核依據。此動作送出後無法撤回。
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
        className="btn-primary"
      >
        {isPending ? '簽收中...' : '我已簽收'}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {/* 確認 dialog */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !isPending && setShowConfirm(false)}
        >
          <div
            className="card w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-lg font-semibold text-ink-900">確認簽收</h3>
            <p className="mb-4 text-sm text-ink-700">
              送出後將記錄以下資訊,且<strong className="text-red-700">無法撤回</strong>:
            </p>
            <ul className="mb-4 space-y-1 rounded-md bg-ink-50 p-3 text-xs text-ink-700">
              <li>• 您的帳號身份(處室/姓名)</li>
              <li>• 當下時間(伺服器時間)</li>
              <li>• IP 位址</li>
              <li>• 瀏覽器 User-Agent</li>
            </ul>
            <p className="mb-4 text-xs text-ink-500">
              如對公告內容有疑慮,請先聯絡發布處室,不要直接簽收。
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="btn-ghost"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSign}
                disabled={isPending}
                className="btn-primary"
              >
                {isPending ? '送出中...' : '確認簽收'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
