// src/lib/services/promptService.ts
import { v4 as uuidv4 } from 'uuid';
import * as repo from '@/lib/repositories/promptRepository';
import { Prompt, AttributeItem, UpdateLog } from '@/lib/models/prompt';

/** 创建输入类型：所有可选字段都标记为 optional */
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
 * 创建一个新的目录或 Prompt
 */
export async function createPrompt(
    userId: string,
    payload: CreatePromptInput
): Promise<Prompt> {
    const id = uuidv4();

    // 补齐默认值
    const data: Partial<Prompt> = {
        id,
        parent_id: payload.parent_id,
        type: payload.type,
        title: payload.title,
        content: payload.content,
        description: payload.description,
        tags: payload.tags ?? [],
        attributes: payload.attributes ?? [],
        comments: payload.comments,
        is_public: payload.is_public ?? false,
        created_by: userId,
    };

    return await repo.insertPrompt(data);
}

/**
 * 更新已有 Prompt，并在 update_log 中追加一条记录
 */
export async function updatePromptService(
    userId: string,
    id: string,
    changes: Partial<Omit<Prompt, 'id' | 'created_by' | 'created_at' | 'updated_at'>>
): Promise<Prompt | null> {
    const existing = await repo.getPromptById(id);
    if (!existing) return null;

    const logEntry: UpdateLog = {
        at: new Date().toISOString(),
        by: userId,
        change: JSON.stringify(changes),
    };
    const newLog = existing.update_log ? [...existing.update_log, logEntry] : [logEntry];

    // 合并变更和新日志
    const updatedFields: Partial<Prompt> = {
        ...changes,
        update_log: newLog,
    };

    await repo.updatePrompt(id, updatedFields);
    return await repo.getPromptById(id);
}

/**
 * 删除指定 Prompt/目录
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

/**
 * 列出某目录下的所有节点（若 parentId 为空，则列出根目录）
 */
export async function listPrompts(parentId?: string): Promise<Prompt[]> {
    return await repo.listPromptsByParent(parentId);
}