// File: src/lib/api/PromptCase.ts
import type { CaseContentItem } from '@/lib/models/prompt/promptCase';

/** 列出指定目录下的 Case 内容 */
export async function fetchPromptCaseContent(
    directoryId: string
): Promise<CaseContentItem[]> {
    const res = await fetch(
        `/api/prompt/case?directory_id=${encodeURIComponent(directoryId)}`
    );
    if (!res.ok) throw new Error(`fetchPromptCaseContent failed: ${res.status}`);
    return res.json();
}

/** 获取单个 Case 内容 */
export async function fetchPromptCaseContentById(
    id: string
): Promise<CaseContentItem> {
    const res = await fetch(
        `/api/prompt/case?id=${encodeURIComponent(id)}`
    );
    if (!res.ok) throw new Error(`fetchPromptCaseContentById failed: ${res.status}`);
    return res.json();
}

/** 创建新的 Case 内容 */
export async function createPromptCaseContent(
    directoryId: string,
    title: string,
    summary?: string,
    body?: string
): Promise<CaseContentItem> {
    const res = await fetch('/api/prompt/case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            directory_id: directoryId,
            title,
            summary,
            body,
        }),
    });
    if (!res.ok) throw new Error(`createPromptCaseContent failed: ${res.status}`);
    return res.json();
}

/** 更新已有 Case 内容 */
export async function updatePromptCaseContent(
    item: Partial<CaseContentItem> & { id: string }
): Promise<CaseContentItem> {
    const res = await fetch('/api/prompt/case', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: item.id,
            directory_id: item.directoryId,
            title: item.title,
            summary: item.summary,
            body: item.body,
        }),
    });
    if (!res.ok) throw new Error(`updatePromptCaseContent failed: ${res.status}`);
    return res.json();
}

/** 删除 Case 内容 */
export async function deletePromptCaseContent(
    id: string
): Promise<{ success: boolean }> {
    const res = await fetch(
        `/api/prompt/case?id=${encodeURIComponent(id)}`,
        { method: 'DELETE' }
    );
    if (!res.ok) throw new Error(`deletePromptCaseContent failed: ${res.status}`);
    return res.json();
}

/** 重排 Case 内容顺序 */
export async function reorderPromptCaseContent(
    directoryId: string,
    orderedIds: string[]
): Promise<{ success: boolean }> {
    const res = await fetch('/api/prompt/case/order', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            directory_id: directoryId,
            ordered_ids: orderedIds,
        }),
    });
    if (!res.ok) throw new Error(`reorderPromptCaseContent failed: ${res.status}`);
    return res.json();
}