// src/lib/api/prompt.ts
import type {
    PromptNode,
    PromptItem,
    AttributeItem,
    GoodCaseItem,
    BadCaseItem,
    PromptGenerationInputData
} from '@/lib/models/prompt/prompt';
import { safeFetch } from '@/lib/utils/safeFetch';
interface RawPrompt {
    id: string;
    parent_id: string | null;
    type: 'dir' | 'prompt';
    title: string;
    content?: string;
    description?: string;
    tags?: string[];
    attributes?: AttributeItem[];
    position?: number;
}

// helper to map raw DB shape into PromptItem
function mapRaw(raw: RawPrompt): PromptItem {
    return {
        id: raw.id,
        parentId: raw.parent_id,
        type: raw.type,
        title: raw.title,
        content: raw.content ?? '',
        description: raw.description ?? '',
        tags: raw.tags ?? [],
        attributes: raw.attributes ?? [],
        position: raw.position ?? 0,
    };
}

/** Fetch top-level or child prompts */
export async function fetchPrompts(parentId?: string): Promise<PromptNode[]> {
    const url = parentId
        ? `/api/prompt?parent_id=${encodeURIComponent(parentId)}`
        : `/api/prompt`;
    const res = await safeFetch(url);
    if (!res.ok) {
        throw new Error(`fetchPrompts failed: ${res.status}`);
    }
    const raws: RawPrompt[] = await res.json();
    return raws.map(mapRaw);
}

/** Fetch one prompt in detail */
export async function fetchPromptById(id: string): Promise<PromptItem> {
    const res = await safeFetch(`/api/prompt?id=${encodeURIComponent(id)}`);
    if (!res.ok) {
        throw new Error(`fetchPromptById failed: ${res.status}`);
    }
    const raw: RawPrompt = await res.json();
    return mapRaw(raw);
}

/** Create or update prompts */
export async function createPrompt(params: {
    parent_id?: string;
    type: 'dir' | 'prompt';
    title: string;
    content?: string;
    description?: string;
    tags?: string[];
    attributes?: AttributeItem[];
    comments?: string[];
    is_public?: boolean;
}): Promise<PromptItem> {
    const res = await safeFetch('/api/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error(`createPrompt failed: ${res.status}`);
    const raw: RawPrompt = await res.json();
    return mapRaw(raw);
}

export async function updatePrompt(params: {
    id: string;
    parent_id?: string;
    type?: 'dir' | 'prompt';
    title?: string;
    content?: string;
    description?: string;
    tags?: string[];
    attributes?: AttributeItem[];
    comments?: string[];
    is_public?: boolean;
}): Promise<PromptItem> {
    const res = await safeFetch('/api/prompt', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error(`updatePrompt failed: ${res.status}`);
    const raw: RawPrompt = await res.json();
    return mapRaw(raw);
}

export async function deletePrompt(id: string): Promise<{ success: boolean }> {
    const res = await safeFetch(`/api/prompt?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
    });
    if (!res.ok) throw new Error(`deletePrompt failed: ${res.status}`);
    return res.json();
}


// -------- Good Cases API --------

export async function fetchGoodCases(promptId: string): Promise<GoodCaseItem[]> {
    const res = await safeFetch(
        `/api/prompt/good_cases?prompt_id=${encodeURIComponent(promptId)}`
    );
    if (!res.ok) throw new Error(`fetchGoodCases failed: ${res.status}`);
    return res.json();
}

export async function createGoodCases(
    promptId: string,
    items: Partial<GoodCaseItem>[]
): Promise<GoodCaseItem[]> {
    const res = await safeFetch('/api/prompt/good_cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt_id: promptId, items })
    });
    if (!res.ok) throw new Error(`createGoodCases failed: ${res.status}`);
    return res.json();
}

export async function updateGoodCases(
    items: Partial<GoodCaseItem>[]
): Promise<GoodCaseItem[]> {
    const res = await safeFetch('/api/prompt/good_cases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
    });
    if (!res.ok) throw new Error(`updateGoodCases failed: ${res.status}`);
    return res.json();
}

export async function deleteGoodCases(ids: string[]): Promise<{ success: boolean }> {
    const res = await safeFetch('/api/prompt/good_cases', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
    });
    if (!res.ok) throw new Error(`deleteGoodCases failed: ${res.status}`);
    return res.json();
}


// -------- Bad Cases API --------

export async function fetchBadCases(promptId: string): Promise<BadCaseItem[]> {
    const res = await safeFetch(
        `/api/prompt/bad_cases?prompt_id=${encodeURIComponent(promptId)}`
    );
    if (!res.ok) throw new Error(`fetchBadCases failed: ${res.status}`);
    return res.json();
}

export async function createBadCases(
    promptId: string,
    items: Partial<BadCaseItem>[]
): Promise<BadCaseItem[]> {
    const res = await safeFetch('/api/prompt/bad_cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt_id: promptId, items })
    });
    if (!res.ok) throw new Error(`createBadCases failed: ${res.status}`);
    return res.json();
}

export async function updateBadCases(
    items: Partial<BadCaseItem>[]
): Promise<BadCaseItem[]> {
    const res = await safeFetch('/api/prompt/bad_cases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
    });
    if (!res.ok) throw new Error(`updateBadCases failed: ${res.status}`);
    return res.json();
}

export async function deleteBadCases(ids: string[]): Promise<{ success: boolean }> {
    const res = await safeFetch('/api/prompt/bad_cases', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
    });
    if (!res.ok) throw new Error(`deleteBadCases failed: ${res.status}`);
    return res.json();
}
/** 按 title 模糊搜索，返回 PromptNode[] */
export async function searchPromptsByTitle(term: string): Promise<PromptNode[]> {
    const res = await safeFetch(`/api/prompt?term=${encodeURIComponent(term)}`);
    if (!res.ok) throw new Error(`searchPromptsByTitle failed: ${res.status}`);
    const raws: RawPrompt[] = await res.json();
    return raws.map(mapRaw);
}

/** 重排子节点顺序 */
export async function reorderPrompts(
    parent_id: string | null,
    ordered_ids: string[]
): Promise<void> {
    const res = await safeFetch('/api/prompt', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_id, ordered_ids }),
    });
    if (!res.ok) throw new Error(`reorderPrompts failed: ${res.status}`);
}


// -------- Prompt Generation Input Data API --------

/** 查询某个 prompt 的所有生成输入数据 */
export async function fetchPromptInputData(
    promptId: string
): Promise<PromptGenerationInputData[]> {
    const res = await safeFetch(
        `/api/prompt/input_data?prompt_id=${encodeURIComponent(promptId)}`
    );
    if (!res.ok) throw new Error(`fetchPromptInputData failed: ${res.status}`);
    return res.json();
}

/** 批量创建生成输入数据 */
export async function createPromptInputData(
    promptId: string,
    items: Omit<PromptGenerationInputData, 'id' | 'created_at'>[]
): Promise<PromptGenerationInputData[]> {
    const res = await safeFetch('/api/prompt/input_data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt_id: promptId, items }),
    });
    if (!res.ok) throw new Error(`createPromptInputData failed: ${res.status}`);
    return res.json();
}

/** 批量更新生成输入数据 */
export async function updatePromptInputData(
    items: Partial<Omit<PromptGenerationInputData, 'created_at'>>[]
): Promise<PromptGenerationInputData[]> {
    const res = await safeFetch('/api/prompt/input_data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
    });
    if (!res.ok) throw new Error(`updatePromptInputData failed: ${res.status}`);
    return res.json();
}

/** 删除指定 prompt_id 下的所有生成输入数据 */
export async function deletePromptInputDataByPrompt(
    promptId: string
): Promise<{ success: boolean }> {
    const res = await safeFetch(
        `/api/prompt/input_data?prompt_id=${encodeURIComponent(promptId)}`,
        { method: 'DELETE' }
    );
    if (!res.ok) throw new Error(`deletePromptInputDataByPrompt failed: ${res.status}`);
    return res.json();
}

/** 删除指定的生成输入数据 */
export async function deletePromptInputData(
    ids: string[]
): Promise<{ success: boolean }> {
    const res = await safeFetch('/api/prompt/input_data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });
    if (!res.ok) throw new Error(`deletePromptInputData failed: ${res.status}`);
    return res.json();
}
