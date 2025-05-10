// src/lib/services/promptCaseContentService.ts
import { v4 as uuidv4 } from 'uuid';
import type { CaseContentItem } from '@/lib/models/prompt/promptCase';
import * as repo from '@/lib/repositories/promptCaseContentRepository';
import * as directoryRepo from '@/lib/repositories/directoryRepository';

/**
 * 获取指定目录下的所有 Case 内容
 */
export async function listPromptCaseContentService(
    userId: string,
    directoryId: string
): Promise<CaseContentItem[]> {
    // 验证目录存在，且有权限查看（略）
    const dir = await directoryRepo.getDirectoryById(directoryId);
    if (!dir) throw new Error('Directory not found');
    return repo.listPromptCaseContentByDirectory(directoryId);
}

/**
 * 获取单个 Case 内容
 */
export async function getPromptCaseContentService(
    userId: string,
    id: string
): Promise<CaseContentItem | null> {
    const item = await repo.getPromptCaseContentById(id);
    return item;
}

/**
 * 创建新的 Case 内容
 */
export async function createPromptCaseContentService(
    userId: string,
    directoryId: string,
    title: string,
    summary?: string,
    body?: string
): Promise<CaseContentItem> {
    // 验证目录存在
    const dir = await directoryRepo.getDirectoryById(directoryId);
    if (!dir) throw new Error('Directory not found');
    // 获取 position
    const position = await repo.getNextPromptCaseContentPosition(directoryId);
    // 插入新内容
    const newItem: Partial<CaseContentItem> = {
        id: uuidv4(),
        directoryId,
        title,
        summary,
        body,
        position,
        createdBy: userId,
    };
    return repo.insertPromptCaseContent(newItem);
}

/**
 * 更新已有 Case 内容
 */
export async function updatePromptCaseContentService(
    userId: string,
    id: string,
    changes: Partial<CaseContentItem>
): Promise<CaseContentItem | null> {
    const exists = await repo.getPromptCaseContentById(id);
    if (!exists) return null;
    // 可加权限校验：只能修改 createdBy==userId
    await repo.updatePromptCaseContent(id, changes);
    return repo.getPromptCaseContentById(id);
}

/**
 * 删除 Case 内容
 */
export async function deletePromptCaseContentService(
    userId: string,
    id: string
): Promise<boolean> {
    const exists = await repo.getPromptCaseContentById(id);
    if (!exists) return false;
    // 可加权限校验
    await repo.deletePromptCaseContent(id);
    return true;
}

/**
 * 重排同目录下的 Case 内容顺序
 */
export async function reorderPromptCaseContentService(
    userId: string,
    directoryId: string,
    orderedIds: string[]
): Promise<void> {
    // 验证目录存在
    const dir = await directoryRepo.getDirectoryById(directoryId);
    if (!dir) throw new Error('Directory not found');
    await repo.reorderPromptCaseContent(directoryId, orderedIds);
}
