// src/lib/services/romptServices.ts
import { v4 as uuidv4 } from 'uuid';
import * as repo from '@/lib/repositories/promptRepository';
import { Prompt, AttributeItem, UpdateLog } from '@/lib/models/prompt/prompt';

/**
 * Input for creating a new prompt or directory. All optional fields are optional in payload.
 */
export type CreatePromptInput = {
    parent_id?: string;
    type: 'dir' | 'prompt';
    title: string;
    content?: string;
    description?: string;
    tags?: string[];
    attributes?: AttributeItem[];
    comments?: string[];
    is_public?: boolean;
};

/**
 * Fetch a single prompt by its ID, including full details (content, description, tags, etc.).
 */
export async function getPromptById(id: string): Promise<Prompt | null> {
    return await repo.getPromptById(id);
}

/**
 * List all prompts or directories under a given parent. Pass undefined for root-level.
 */
export async function listPrompts(parentId?: string): Promise<Prompt[]> {
    return await repo.listPromptsByParent(parentId);
}

/**
 * Create a new directory or prompt node with initialized timestamps and empty log.
 */
export async function createPrompt(
    userId: string,
    payload: CreatePromptInput
): Promise<Prompt> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const nextPos = await repo.getNextPosition(payload.parent_id);


    const newPrompt: Prompt = {
        id,
        parent_id: payload.parent_id,            // undefined for root
        type: payload.type,
        title: payload.title,
        content: payload.content ?? '',
        description: payload.description ?? '',
        tags: payload.tags ?? [],
        attributes: payload.attributes ?? [],
        comments: payload.comments ?? [],
        is_public: payload.is_public ?? false,
        created_by: userId,
        created_at: now,
        updated_at: now,
        update_log: [],
        position: nextPos,
    };

    return await repo.insertPrompt(newPrompt);
}

/**
 * Update an existing prompt, append an update log entry, and bump updated_at.
 */
export async function updatePromptService(
    userId: string,
    id: string,
    changes: Partial<Omit<Prompt, 'id' | 'created_by' | 'created_at'>>
): Promise<Prompt | null> {
    const existing = await repo.getPromptById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const logEntry: UpdateLog = {
        at: now,
        by: userId,
        change: JSON.stringify(changes),
    };

    const updated: Prompt = {
        ...existing,
        ...changes,
        updated_at: now,
        update_log: [...(existing.update_log ?? []), logEntry],
    };

    await repo.updatePrompt(id, updated);
    return updated;
}

/**
 * Delete a prompt or directory node by ID.
 * Returns true if deletion succeeded, false if not found.
 */
export async function deletePromptService(
    userId: string,
    id: string
): Promise<boolean> {
    const existing = await repo.getPromptById(id);
    if (!existing) return false;
    await repo.deletePrompt(id);
    return true;
}
export async function reorderPrompts(
    userId: string,
    parentId: string | null,
    orderedIds: string[]
): Promise<void> {
    // 可选：在此插入一条 update_log 记录
    for (let idx = 0; idx < orderedIds.length; idx++) {
        const id = orderedIds[idx];
        await repo.updatePrompt(id, { position: idx });
    }
}

/** 按关键词搜索，并带上祖先目录 */
export async function searchPrompts(term: string): Promise<Prompt[]> {
    return await repo.searchPromptsWithAncestors(term);
}