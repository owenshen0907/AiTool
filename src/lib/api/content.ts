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
    let res: Response;
    try {
        res = await fetch(`/api/content?${params.toString()}`);
    } catch (e) {
        console.error('[fetchContent] network error →', e);
        return [];
    }
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('[fetchContent] server error →', res.status, text);
        return [];
    }
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

export async function updateContent(
    feature: string,
    data: {
        id: string;
        directoryId?: string;
        title?: string;
        summary?: string;
        body?: string;
        position?: number; // ← 新增
    }
): Promise<ContentItem> {
    const payload: Record<string, any> = {
        feature,
        id: data.id,
    };
    if (data.directoryId !== undefined) payload.directory_id = data.directoryId;
    if (data.title        !== undefined) payload.title       = data.title;
    if (data.summary      !== undefined) payload.summary     = data.summary;
    if (data.body         !== undefined) payload.body        = data.body;
    if (data.position     !== undefined) payload.position    = data.position;  // ← 新增

    const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

export async function moveContent(
    feature: string,
    id: string,
    newDir: string,
    beforeId?: string
) {
    const body: any = { feature, id, new_directory_id: newDir };
    if (beforeId) body.before_id = beforeId;
    const res = await fetch('/api/content/move', {
        method: 'PATCH',
        headers: JSON_HEADER,
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`moveContent failed: ${res.status}`);
    return res.json();
}

/**
 * 单一接口：把 fileId 移到 newDir 下，并在 newDir 中排序到 targetFileId 之前
 */
export async function moveAndReorderContent(
    feature: string,
    id: string,
    newDir?: string,
    beforeId?: string,
) {
    const payload: any = { feature, id };
    if (newDir)    payload.new_directory_id = newDir;
    if (beforeId)  payload.before_id          = beforeId;
    const res = await fetch('/api/content/move', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`moveAndReorderContent ${res.status}`);
    return res.json();
}