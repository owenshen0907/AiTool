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
    return repo.listDirectories(feature, parentId);
}

export async function getDirectoryService(
    userId: string,
    id: string
): Promise<DirectoryItem | null> {
    return repo.getDirectoryById(id);
}

export async function createDirectoryService(
    userId: string,
    feature: string,
    parentId: string | undefined,
    name: string
): Promise<DirectoryItem> {
    const position = await repo.getNextDirectoryPosition(feature, parentId);
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
    const exist = await repo.getDirectoryById(id);
    if (!exist) return null;
    await repo.updateDirectory(id, changes);
    return repo.getDirectoryById(id);
}

export async function deleteDirectoryService(
    userId: string,
    id: string
): Promise<boolean> {
    const exist = await repo.getDirectoryById(id);
    if (!exist) return false;
    await repo.deleteDirectory(id);
    return true;
}

export async function reorderDirectoriesService(
    userId: string,
    feature: string,
    parentId: string | null,
    orderedIds: string[]
): Promise<void> {
    await repo.reorderDirectories(feature, parentId, orderedIds);
}