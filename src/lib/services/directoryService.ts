// File: src/lib/services/directoryService.ts
import { v4 as uuidv4 } from 'uuid';
import * as repo from '@/lib/repositories/directoryRepository';
import type { DirectoryItem } from '@/lib/models/directory';

export async function listDirectoriesService(
    userId: string,
    feature: string,
    parentId?: string
): Promise<DirectoryItem[]> {
    // 业务逻辑可加权限校验
    return repo.listDirectories(userId,feature, parentId );
}

export async function getDirectoryService(
    userId: string,
    id: string
): Promise<DirectoryItem | null> {
    return repo.getDirectoryById(userId,id);
}

export async function createDirectoryService(
    userId: string,
    feature: string,
    parentId: string | undefined,
    name: string
): Promise<DirectoryItem> {
    const position = await repo.getNextDirectoryPosition(userId,feature, parentId);
    return repo.insertDirectory({
        id: uuidv4(),
        feature,
        parentId: parentId || null,
        name,
        position,
        createdBy: userId,
    });
}

export async function updateDirectoryService(
    userId: string,
    id: string,
    changes: Partial<DirectoryItem>
): Promise<DirectoryItem | null> {
    const exist = await repo.getDirectoryById(id,userId);
    if (!exist) return null;
    await repo.updateDirectory(id, changes);
    return repo.getDirectoryById(id,userId);
}

export async function deleteDirectoryService(
    userId: string,
    id: string
): Promise<boolean> {
    // 校验权限/存在性
    const dir = await repo.getDirectoryById(id, userId);
    if (!dir) return false;

    // 直接调用，会抛 DirectoryNotEmpty
    await repo.deleteDirectory(id);
    return true;
}

export async function reorderDirectoriesService(
    userId: string,
    feature: string,
    parentId: string | null,
    orderedIds: string[]
): Promise<void> {
    await repo.reorderDirectories(userId,feature, parentId, orderedIds);
}