import { redirect, notFound } from 'next/navigation';
import { getCurrentUserFull } from '@/lib/auth';
import { getAnnouncement, listTags, getAttachments } from '@/lib/repository';
import { AnnouncementEditor } from '../../new/AnnouncementEditor';

export const dynamic = 'force-dynamic';

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await getCurrentUserFull();
  if (!me) redirect('/login');

  const a = await getAnnouncement(id);
  if (!a || a.deletedAt) notFound();

  // 權限:只能改自己或 sysadmin
  if (a.publisherId !== me.id && me.role !== 'sysadmin') {
    return (
      <div className="card p-6 text-center">
        <p className="text-ink-700">您沒有權限編輯這則公告</p>
        <a href="/admin/announcements" className="mt-3 inline-block text-sm text-accent-600 hover:underline">
          返回我的公告
        </a>
      </div>
    );
  }

  const [tags, attachments] = await Promise.all([listTags(), getAttachments(a.attachmentIds)]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink-900">編輯公告</h1>
        <p className="mt-1 text-sm text-ink-500">修改後將即時更新到列表</p>
      </div>
      <AnnouncementEditor
        tags={tags}
        initial={{
          id: a.id,
          title: a.title,
          content: a.content,
          tagIds: a.tagIds,
          requireSignature: a.requireSignature,
          signatureDeadline: a.signatureDeadline,
          attachmentIds: attachments.map((att) => att.id),
        }}
      />
    </div>
  );
}
