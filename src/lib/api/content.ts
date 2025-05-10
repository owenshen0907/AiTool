// src/lib/api/content.ts
import type { ContentItem } from '@/lib/models/content';

const JSON_HEADER = { 'Content-Type': 'application/json' } as const;

/* 列表 */
export async function fetchContentByDirectory(
    feature: string,
    directoryId: string
): Promise<ContentItem[]> {
    const params = new URLSearchParams({
        feature,
        directory_id: directoryId,
    });
    const res = await fetch(`/api/content?${params.toString()}`);
    if (!res.ok) throw new Error(`fetchContent failed: ${res.status}`);
    return res.json();
}

/* 创建 */
export async function createContent(
    feature: string,
    data: { directoryId: string; title: string; summary?: string; body?: string }
): Promise<ContentItem> {
    const res = await fetch('/api/content', {
        method: 'POST',
        headers: JSON_HEADER,
        body: JSON.stringify({
            feature,
            directory_id: data.directoryId,   // ✅ 正确：单独给字符串
            title: data.title,
            summary: data.summary,
            body: data.body,
        }),
    });
    if (!res.ok) throw new Error(`createContent failed: ${res.status}`);
    return res.json();
}

/* 更新 */
export async function updateContent(
    feature: string,
    data: { id: string; directoryId: string; title: string; summary?: string; body?: string }
): Promise<ContentItem> {
    const res = await fetch('/api/content', {
        method: 'PUT',
        headers: JSON_HEADER,
        body: JSON.stringify({
            feature,
            id: data.id,
            directory_id: data.directoryId,   // ✅
            title: data.title,
            summary: data.summary,
            body: data.body,
        }),
    });
    if (!res.ok) throw new Error(`updateContent failed: ${res.status}`);
    return res.json();
}

/* 删除 */
export async function deleteContent(
    feature: string,
    id: string
): Promise<{ success: boolean }> {
    const url = `/api/content?feature=${encodeURIComponent(feature)}&id=${encodeURIComponent(id)}`;
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) throw new Error(`deleteContent failed: ${res.status}`);
    return res.json();
}

/* 排序 */
export async function reorderContent(
    feature: string,
    directoryId: string,
    orderedIds: string[]
): Promise<{ success: boolean }> {
    const res = await fetch('/api/content', {
        method: 'PATCH',
        headers: JSON_HEADER,
        body: JSON.stringify({
            feature,
            directory_id: directoryId,
            ordered_ids: orderedIds,
        }),
    });
    if (!res.ok) throw new Error(`reorderContent failed: ${res.status}`);
    return res.json();
}