// src/hooks/useContentCache.ts
'use client';

import { useState, useCallback } from 'react';
import type { ContentItem } from '@/lib/models/content';
import { fetchContentByDirectory } from '@/lib/api/content';

/**
 * 把目录内容按 dirId 做缓存，避免反复请求
 */
export function useContentCache(feature: string) {
    // Map<dirId, ContentItem[]>
    const [cache, setCache] = useState<Record<string, ContentItem[]>>({});

    /** 主动加载并写入缓存，返回加载后的列表 */
    const loadDir = useCallback(
        async (dirId: string): Promise<ContentItem[]> => {
            // 已有缓存就直接返回
            if (cache[dirId]) return cache[dirId];

            const list = await fetchContentByDirectory(feature, dirId);
            setCache(prev => ({ ...prev, [dirId]: list }));
            return list;
        },
        [cache, feature],
    );

    /** 当增删改时，直接 patch 当前 dirId 的内容数组 */
    const mutateDir = useCallback(
        (dirId: string, updater: (old: ContentItem[]) => ContentItem[]) => {
            setCache(prev => ({ ...prev, [dirId]: updater(prev[dirId] ?? []) }));
        },
        [],
    );

    /** 把所有 dir 已加载内容拍平成单数组，给 DirectoryManager 渲染 */
    const allItems: ContentItem[] = Object.values(cache).flat();

    return { loadDir, mutateDir, allItems };
}