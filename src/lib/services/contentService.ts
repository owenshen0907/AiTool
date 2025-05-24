// src/lib/services/contentService.ts
import { v4 as uuidv4 } from 'uuid';
import type { ContentItem } from '@/lib/models/content';
import * as repo from '@/lib/repositories/contentRepository';

export async function listContentByDirectory(
    userId: string,
    feature: string,
    directoryId: string
): Promise<ContentItem[]> {
    return repo.listByDirectory(feature, directoryId);
}

export async function getContentById(
    userId: string,
    feature: string,
    id: string
): Promise<ContentItem | null> {
    return repo.getById(feature, id);
}

export async function createContent(
    userId: string,
    feature: string,
    data: { directoryId: string; title: string; summary?: string; body?: string }
) {
    const position = (await repo.listByDirectory(feature, data.directoryId)).length;
    return repo.insert(feature, {
        id: uuidv4(),
        directoryId: data.directoryId,
        title: data.title,
        summary: data.summary,
        body: data.body,
        createdBy: userId,
        position,
    });
}

export async function updateContent(
    userId: string,
    feature: string,
    data: Partial<ContentItem> & { id: string }
): Promise<ContentItem> {
    /* ✅ 过滤掉 undefined */
    const patch: Partial<ContentItem> = {};
    if (data.directoryId !== undefined) patch.directoryId = data.directoryId;
    if (data.title        !== undefined) patch.title       = data.title;
    if (data.summary      !== undefined) patch.summary     = data.summary;
    if (data.body         !== undefined) patch.body        = data.body;
    if ((data as any).position !== undefined) patch.position = (data as any).position;

    await repo.update(feature, data.id, patch);

    const updated = await repo.getById(feature, data.id);
    if (!updated) throw new Error('Not found');
    return updated;
}

export async function deleteContent(
    userId: string,
    feature: string,
    id: string
): Promise<void> {
    return repo.remove(feature, id);
}

export async function reorderContent(
    userId: string,
    feature: string,
    directoryId: string,
    orderedIds: string[]
): Promise<void> {
    return repo.reorder(feature, directoryId, orderedIds);
}