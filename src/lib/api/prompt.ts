import type { PromptNode, PromptItem, AttributeItem } from '@/lib/models/prompt';
import { getAllByParent, getById, putMany, putOne, deleteById } from '@/lib/utils/indexedDb';

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

/** 拉列表，先读 IDB；如果没命中，则网络拉再写回 IDB */
export async function fetchPrompts(parentId?: string): Promise<PromptNode[]> {
    const pid = parentId ?? null;
    const cached = await getAllByParent(pid);
    if (cached.length) {
        console.log('[API] 📦 fetchPrompts from IDB →', pid, cached.map(i=>i.id));
        return cached;
    }
    const url = pid ? `/api/prompt?parent_id=${pid}` : `/api/prompt`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch prompts: ${res.status}`);
    const raw: RawPrompt[] = await res.json();
    const list = raw.map(mapRaw);
    await putMany(list);
    console.log('[API] 🌐 fetchPrompts from network & cache →', pid, list.map(i=>i.id));
    return list;
}

/** 拉单条 Prompt，先查 IDB；若没命中再网络拉，写回 IDB */
export async function fetchPromptById(id: string): Promise<PromptItem> {
    const cached = await getById(id);
    if (cached && cached.type === 'prompt') {
        console.log('[API] 📦 fetchPromptById from IDB →', id);
        return cached as PromptItem;
    }
    const res = await fetch(`/api/prompt?id=${id}`);
    if (!res.ok) throw new Error(`Failed to fetch prompt ${id}: ${res.status}`);
    const raw: RawPrompt = await res.json();
    const item = mapRaw(raw);
    await putOne(item);
    console.log('[API] 🌐 fetchPromptById network & cache →', id);
    return item;
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
    const item = mapRaw(raw);
    await putOne(item);
    return item;
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
    const item = mapRaw(raw);
    await putOne(item);
    return item;
}

export async function deletePrompt(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/prompt?id=${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`deletePrompt failed: ${res.status}`);
    await deleteById(id);
    return res.json();
}