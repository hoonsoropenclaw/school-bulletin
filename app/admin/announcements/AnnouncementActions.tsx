'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  announcementId: string;
  title: string;
}

export function AnnouncementActions({ announcementId, title }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`確定要刪除「${title}」嗎？此操作無法復原。`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/announcements/${announcementId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error?.message ?? '刪除失敗');
        return;
      }
      // 重新整理列表
      router.refresh();
    } catch (err) {
      alert('網路錯誤，請稍後再試');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <a
        href={`/admin/announcements/${announcementId}/edit`}
        className="btn-outline text-xs"
      >
        編輯
      </a>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="rounded border border-red-300 bg-white px-3 py-1.5 text-xs text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {deleting ? '刪除中...' : '刪除'}
      </button>
    </div>
  );
}
