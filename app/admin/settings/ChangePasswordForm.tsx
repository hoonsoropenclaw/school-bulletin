'use client';

import { useState } from 'react';

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // 前端驗證
    if (newPassword.length < 8) {
      setError('新密碼至少需 8 個字元');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('兩次輸入的新密碼不一致');
      return;
    }
    if (newPassword === currentPassword) {
      setError('新密碼不可與目前密碼相同');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message ?? '密碼修改失敗');
        return;
      }

      setSuccess('密碼已更新，請牢記新密碼');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('網路錯誤，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="currentPassword" className="label">
          目前密碼
        </label>
        <input
          id="currentPassword"
          type="password"
          className="input"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          autoComplete="current-password"
          disabled={submitting}
        />
      </div>

      <div>
        <label htmlFor="newPassword" className="label">
          新密碼
        </label>
        <input
          id="newPassword"
          type="password"
          className="input"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          disabled={submitting}
        />
        <p className="mt-1 text-xs text-ink-500">至少 8 個字元</p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="label">
          確認新密碼
        </label>
        <input
          id="confirmPassword"
          type="password"
          className="input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          disabled={submitting}
        />
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </div>
      )}

      <button
        type="submit"
        className="btn-primary"
        disabled={submitting}
      >
        {submitting ? '處理中...' : '更新密碼'}
      </button>
    </form>
  );
}
