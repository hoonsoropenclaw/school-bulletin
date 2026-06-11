import Link from 'next/link';
import { listAnnouncements, listTags, getAttachments, getUserRoleTagIds } from '@/lib/repository';
import { getCurrentUserFull } from '@/lib/auth';
import { DEPARTMENT_INFO } from '@/lib/types';
import { FilterPanel } from '@/components/FilterPanel';
import { sanitizeHtml } from '@/lib/sanitize';

// 把 Tiptap 產出的 rgb(r, g, b) 轉成 #rrggbb,確保樣式乾淨
function normalizeHtmlColors(html: string): string {
  return html.replace(
    /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g,
    (_, r, g, b) => {
      const hex = (n: string) => Number(n).toString(16).padStart(2, '0');
      return '#' + hex(r) + hex(g) + hex(b);
    },
  );
}

export const dynamic = 'force-dynamic';

interface SearchParams {
  groups?: string;
  q?: string;
}

function decodeGroups(s?: string): { groups: Array<{ tagIds: string[]; excludeTagIds: string[] }> } {
  if (!s) return { groups: [] };
  try {
    const parsed = JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));
    return { groups: Array.isArray(parsed?.groups) ? parsed.groups : [] };
  } catch {
    return { groups: [] };
  }
}

export default async function HomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const { groups } = decodeGroups(sp.groups);
  const q = sp.q;

  const allTags = await listTags();
  const tagMap = new Map(allTags.map((t) => [t.id, t]));

  // 路線 A 補 1 (M-05) + 補 2 (M-06):依登入者身份套 audience 過濾
  const me = await getCurrentUserFull();
  let audience;
  if (me) {
    const roleTagIds = await getUserRoleTagIds(me.id);
    audience = {
      viewerDept: me.departmentCode,
      viewerIsSysadmin: me.role === 'sysadmin',
      viewerIsDeptOfficer: me.role === 'dept_officer',
      viewerRoleTagIds: roleTagIds,
    };
  }
  const items = await listAnnouncements({ groups, search: q }, audience);

  // 一次把附件拉齊(避免 N+1)
  const allAttachmentIds = items.flatMap((a) => a.attachmentIds);
  const uniqueAttIds = Array.from(new Set(allAttachmentIds));
  const attMap = new Map();
  for (const id of uniqueAttIds) {
    const atts = await getAttachments([id]);
    if (atts[0]) attMap.set(id, atts[0]);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink-900">公告列表</h1>
        <p className="mt-1 text-sm text-ink-500">
          共 {items.length} 則公告 · 使用標籤篩選縮小範圍
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <FilterPanel allTags={allTags} initialGroups={groups} initialSearch={q ?? ''} />
        </aside>

        <section>
          {items.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-ink-500">目前沒有符合條件的公告</p>
              <p className="mt-1 text-sm text-ink-400">試試放寬篩選條件,或清除搜尋</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((a) => {
                const tags = a.tagIds.map((id) => tagMap.get(id)).filter(Boolean);
                const normalized = normalizeHtmlColors(a.content);
                const previewHtml = sanitizeHtml(normalized);
                return (
                  <li key={a.id}>
                    <Link
                      href={`/announcements/${a.id}`}
                      className="block card p-5 transition-colors hover:border-accent-500 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h2 className="text-lg font-medium text-ink-900 group-hover:text-accent-600">
                            {a.title}
                          </h2>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                            <span className="chip bg-ink-100 text-ink-700">
                              {DEPARTMENT_INFO[a.publisherDept]?.name ?? a.publisherDept}
                            </span>
                            <span>·</span>
                            <span>{a.publisherName}</span>
                            <span>·</span>
                            <time dateTime={a.publishAt}>
                              {new Date(a.publishAt).toLocaleString('zh-TW', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </time>
                            {a.attachmentIds.length > 0 && (
                              <>
                                <span>·</span>
                                <span className="text-accent-600">
                                  附件 {a.attachmentIds.length} 個
                                </span>
                              </>
                            )}
                            {a.requireSignature && (
                              <>
                                <span>·</span>
                                <span className="chip bg-accent-100 text-accent-700">需簽收</span>
                              </>
                            )}
                          </div>
                          {tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {tags.slice(0, 6).map((t) =>
                                t ? (
                                  <span
                                    key={t.id}
                                    className="chip"
                                    style={{
                                      backgroundColor: (t.color || '#94a3b8') + '20',
                                      color: t.color || '#475569',
                                    }}
                                  >
                                    {t.name}
                                  </span>
                                ) : null,
                              )}
                              {tags.length > 6 && (
                                <span className="text-xs text-ink-400">+{tags.length - 6}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div
                        className="mt-3 line-clamp-2 text-sm text-ink-600 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
