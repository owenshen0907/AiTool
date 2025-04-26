import type { PromptNode, PromptItem, AttributeItem } from '@/lib/models/prompt';

interface RawPrompt {
    id: string;
    parent_id: string | null;
    type: 'dir' | 'prompt';
    title: string;
    content?: string;
    description?: string;
    tags?: string[];
    attributes?: AttributeItem[];
}

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
    };
}

/** 直接总是网络拉，不做任何缓存 */
export async function fetchPrompts(parentId?: string): Promise<PromptNode[]> {
    const pid = parentId ?? null;
    const url = pid
        ? `/api/prompt?parent_id=${encodeURIComponent(pid)}`
        : `/api/prompt`;

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`fetchPrompts failed: ${res.status}`);
    }

    const raws: RawPrompt[] = await res.json();
    return raws.map(mapRaw);
}

// 其余接口也保持网络拉写法
export async function fetchPromptById(id: string): Promise<PromptItem> {
    const res = await fetch(`/api/prompt?id=${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`fetchPromptById failed: ${res.status}`);
    const raw: RawPrompt = await res.json();
    return mapRaw(raw);
}

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
    const res = await fetch('/api/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
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
    const res = await fetch('/api/prompt', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`updatePrompt failed: ${res.status}`);
    const raw: RawPrompt = await res.json();
    return mapRaw(raw);
}

export async function deletePrompt(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/prompt?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error(`deletePrompt failed: ${res.status}`);
    return res.json();
}