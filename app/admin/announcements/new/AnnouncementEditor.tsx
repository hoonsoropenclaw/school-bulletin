'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Tag, TagType, Attachment } from '@/lib/types';
import { HAS_SUPABASE } from '@/lib/db';

interface Props {
  tags: Tag[];
}

const TYPE_LABELS: Record<TagType, string> = {
  grade: '年級',
  class: '班級',
  department: '處室',
  activity: '活動類型',
  role: '受眾身分',
};
const TYPE_ORDER: TagType[] = ['grade', 'class', 'department', 'activity', 'role'];

export function AnnouncementEditor({ tags }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [requireSignature, setRequireSignature] = useState(false);
  const [signatureDeadline, setSignatureDeadline] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function toggleTag(id: string) {
    setSelectedTagIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 10) {
        setSubmitError('標籤最多 10 個');
        return prev;
      }
      return [...prev, id];
    });
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/attachments/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data?.error?.message || '上傳失敗');
        return;
      }
      setAttachments((prev) => [...prev, data.data as Attachment]);
    } catch (e) {
      setUploadError('網路錯誤');
    } finally {
      setUploading(false);
      e.target.value = ''; // 允許重複上傳同檔
    }
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (selectedTagIds.length < 1) {
      setSubmitError('請至少選 1 個標籤');
      return;
    }
    if (requireSignature && !signatureDeadline) {
      setSubmitError('需簽收時請設定截止日');
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch('/api/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            content,
            tagIds: selectedTagIds,
            attachmentIds: attachments.map((a) => a.id),
            requireSignature,
            signatureDeadline: signatureDeadline || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setSubmitError(data?.error?.message || '送出失敗');
          return;
        }
        router.push(`/announcements/${data.data.id}`);
        router.refresh();
      } catch (e) {
        setSubmitError('網路錯誤');
      }
    });
  }

  const byType = new Map<TagType, Tag[]>();
  for (const t of tags) {
    if (!byType.has(t.type)) byType.set(t.type, []);
    byType.get(t.type)!.push(t);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="label" htmlFor="title">
          標題 <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          className="input"
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例:高三第一次模擬考時間異動通知"
        />
        <p className="mt-1 text-xs text-ink-400">{title.length} / 200</p>
      </div>

      <div>
        <label className="label" htmlFor="content">
          內文 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="content"
          className="input min-h-[200px] resize-y"
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="公告詳細內容..."
        />
      </div>

      <div>
        <label className="label">標籤 (至少 1 個,最多 10 個)</label>
        <div className="space-y-2">
          {TYPE_ORDER.map((t) => {
            const list = byType.get(t) || [];
            if (list.length === 0) return null;
            return (
              <div key={t}>
                <div className="mb-1 text-xs font-medium text-ink-500">{TYPE_LABELS[t]}</div>
                <div className="flex flex-wrap gap-1">
                  {list.map((tag) => {
                    const selected = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={
                          'chip border ' +
                          (selected
                            ? 'border-accent-500 bg-accent-100 text-accent-700'
                            : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300')
                        }
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-ink-400">已選 {selectedTagIds.length} / 10</p>
      </div>

      <div className="rounded-md border border-ink-200 bg-ink-50 p-3">
        <label className="flex items-center gap-2 text-sm text-ink-800">
          <input
            type="checkbox"
            checked={requireSignature}
            onChange={(e) => setRequireSignature(e.target.checked)}
            className="rounded border-ink-300"
          />
          需要簽收
        </label>
        {requireSignature && (
          <div className="mt-2">
            <label className="label" htmlFor="deadline">
              簽收截止日
            </label>
            <input
              id="deadline"
              type="datetime-local"
              className="input"
              value={signatureDeadline}
              onChange={(e) => setSignatureDeadline(e.target.value)}
            />
          </div>
        )}
      </div>

      <div>
        <label className="label">附件</label>
        <div className="rounded-md border-2 border-dashed border-ink-300 p-4 text-center">
          {HAS_SUPABASE ? (
            <label className="cursor-pointer">
              <input type="file" className="hidden" onChange={onUpload} disabled={uploading} />
              <span className="text-sm text-ink-600">
                {uploading ? '上傳中...' : '點選上傳檔案 (≤ 50MB)'}
              </span>
            </label>
          ) : (
            <p className="text-sm text-ink-500">
              附件功能需在 Vercel 上設定 BLOB_READ_WRITE_TOKEN 才會啟用
            </p>
          )}
        </div>
        {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}
        {attachments.length > 0 && (
          <ul className="mt-2 space-y-1">
            {attachments.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-2 rounded border border-ink-200 bg-white px-3 py-1.5 text-sm"
              >
                <span className="flex-1 truncate text-ink-700">{a.fileName}</span>
                <span className="text-xs text-ink-500">
                  {(a.sizeBytes / 1024).toFixed(1)} KB
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(a.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  移除
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {submitError && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</div>
      )}

      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? '送出中...' : '送出公告'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="btn-outline"
          disabled={isPending}
        >
          取消
        </button>
      </div>
    </form>
  );
}
