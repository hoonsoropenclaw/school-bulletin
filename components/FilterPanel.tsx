'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { Tag, TagType, FilterGroup } from '@/lib/types';

interface Props {
  allTags: Tag[];
  initialGroups: FilterGroup[];
  initialSearch: string;
}

const TYPE_LABELS: Record<TagType, string> = {
  grade: '年級',
  class: '班級',
  department: '處室',
  activity: '活動類型',
  role: '受眾身分',
  custom: '自訂',
};

const TYPE_ORDER: TagType[] = ['grade', 'class', 'department', 'activity', 'role', 'custom'];

function encodeGroups(groups: FilterGroup[]): string {
  // 瀏覽器端用 btoa + base64url-safe,不能直接用 Buffer (瀏覽器沒 Buffer)
  if (typeof window !== 'undefined' && typeof btoa === 'function') {
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify({ groups }))));
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  // Node (server) fallback
  return Buffer.from(JSON.stringify({ groups })).toString('base64url');
}

export function FilterPanel({ allTags, initialGroups, initialSearch }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [groups, setGroups] = useState<FilterGroup[]>(
    initialGroups.length > 0 ? initialGroups : [{ tagIds: [], excludeTagIds: [] }],
  );
  const [search, setSearch] = useState(initialSearch);

  function toggleInclude(gIdx: number, tagId: string) {
    setGroups((prev) => {
      const next = prev.map((g) => ({ ...g, tagIds: [...g.tagIds], excludeTagIds: [...g.excludeTagIds] }));
      const g = next[gIdx];
      if (g.tagIds.includes(tagId)) g.tagIds = g.tagIds.filter((x) => x !== tagId);
      else g.tagIds = [...g.tagIds, tagId];
      return next;
    });
  }
  function toggleExclude(gIdx: number, tagId: string) {
    setGroups((prev) => {
      const next = prev.map((g) => ({ ...g, tagIds: [...g.tagIds], excludeTagIds: [...g.excludeTagIds] }));
      const g = next[gIdx];
      if (g.excludeTagIds.includes(tagId)) g.excludeTagIds = g.excludeTagIds.filter((x) => x !== tagId);
      else g.excludeTagIds = [...g.excludeTagIds, tagId];
      return next;
    });
  }
  function addGroup() {
    setGroups((prev) => [...prev, { tagIds: [], excludeTagIds: [] }]);
  }
  function removeGroup(gIdx: number) {
    setGroups((prev) => prev.filter((_, i) => i !== gIdx));
  }
  function apply() {
    const cleaned = groups.filter(
      (g) => g.tagIds.length > 0 || g.excludeTagIds.length > 0,
    );
    const sp = new URLSearchParams();
    if (cleaned.length > 0) sp.set('groups', encodeGroups(cleaned));
    if (search.trim()) sp.set('q', search.trim());
    startTransition(() => {
      router.push(`/?${sp.toString()}`);
    });
  }
  function clearAll() {
    setGroups([{ tagIds: [], excludeTagIds: [] }]);
    setSearch('');
    startTransition(() => {
      router.push('/');
    });
  }

  // 依類型分組
  const byType = new Map<TagType, Tag[]>();
  for (const t of allTags) {
    if (!t.isActive) continue;
    if (!byType.has(t.type)) byType.set(t.type, []);
    byType.get(t.type)!.push(t);
  }

  return (
    <div className="card p-4">
      <h2 className="mb-3 text-sm font-semibold text-ink-700">標籤篩選</h2>

      <div className="mb-3">
        <input
          className="input"
          placeholder="搜尋公告..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {groups.map((g, gIdx) => (
          <div key={gIdx} className="rounded border border-ink-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-ink-700">
                篩選群組 {gIdx + 1}
                {gIdx > 0 && <span className="ml-1 text-ink-400">(AND)</span>}
              </span>
              {groups.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeGroup(gIdx)}
                  className="text-xs text-ink-400 hover:text-red-600"
                >
                  移除
                </button>
              )}
            </div>
            <p className="mb-2 text-[10px] text-ink-500">
              點選 = 包含 (OR) · Alt+點選 = 排除 (NOT)
            </p>
            {TYPE_ORDER.map((t) => {
              const tags = byType.get(t) || [];
              if (tags.length === 0) return null;
              return (
                <div key={t} className="mb-2">
                  <div className="mb-1 text-[10px] font-medium text-ink-500">
                    {TYPE_LABELS[t]}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag) => {
                      const included = g.tagIds.includes(tag.id);
                      const excluded = g.excludeTagIds.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={(e) => {
                            if (e.altKey) toggleExclude(gIdx, tag.id);
                            else toggleInclude(gIdx, tag.id);
                          }}
                          className={
                            'chip border ' +
                            (included
                              ? 'border-accent-500 bg-accent-100 text-accent-700'
                              : excluded
                                ? 'border-red-400 bg-red-100 text-red-700 line-through'
                                : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300')
                          }
                          title={included ? '包含' : excluded ? '排除' : '點選=包含, Alt+點選=排除'}
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
        ))}

        <button
          type="button"
          onClick={addGroup}
          className="btn-outline w-full text-xs"
        >
          + 新增 AND 群組
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={apply}
          className="btn-primary flex-1 text-sm"
          disabled={isPending}
        >
          {isPending ? '套用中...' : '套用篩選'}
        </button>
        <button type="button" onClick={clearAll} className="btn-ghost text-sm">
          清除
        </button>
      </div>
    </div>
  );
}
