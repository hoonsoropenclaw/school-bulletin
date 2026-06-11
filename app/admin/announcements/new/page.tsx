import { redirect } from 'next/navigation';
import { getCurrentUserFull } from '@/lib/auth';
import { listTags } from '@/lib/repository';
import { AnnouncementEditor } from './AnnouncementEditor';

export const dynamic = 'force-dynamic';

export default async function NewAnnouncementPage() {
  const me = await getCurrentUserFull();
  if (!me) redirect('/login');
  const tags = await listTags();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-semibold text-ink-900">發布新公告</h1>
      <p className="mb-6 text-sm text-ink-500">
        發布者:{me.displayName} · 標籤至少 1 個、最多 10 個
      </p>
      <AnnouncementEditor tags={tags.filter((t) => t.isActive)} />
    </div>
  );
}
