// File: src/components/directory/useContentCache.ts
'use client';

import { useState, useCallback } from 'react';
import type { ContentItem } from '@/lib/models/content';
import { fetchContentByDirectory } from '@/lib/api/content';


export function useContentCache(feature: string) {
    // { [dirId]: ContentItem[] }
    const [cache, setCache] = useState<Record<string, ContentItem[]>>({});

    /** 加载某目录下的内容（force = true 可强制重新拉取） */
    const loadDir = useCallback(
        async (dirId: string, force = false): Promise<ContentItem[]> => {
            if (!force && cache[dirId]) return cache[dirId];
            const list = await fetchContentByDirectory(feature, dirId);
            setCache(prev => ({ ...prev, [dirId]: list }));
            return list;
        },
        [cache, feature],
    );

    /** 当增删改后，patch 更新某目录的缓存数据 */
    const mutateDir = useCallback(
        (dirId: string, updater: (old: ContentItem[]) => ContentItem[]) => {
            setCache(prev => {
                const oldList = prev[dirId] ?? [];
                const newList = updater(oldList);
                return { ...prev, [dirId]: newList };
            });
        },
        [],
    );

    /** 所有已加载目录内容的平铺数组，用于 DirectoryManager 渲染 */
    const allItems = Object.values(cache).flat();

    return { loadDir, mutateDir, allItems };
}