// File: src/hooks/useContentCache.ts
'use client';

import { useState, useCallback } from 'react';
import type { ContentItem } from '@/lib/models/content';
import { fetchContentByDirectory } from '@/lib/api/content';

/**
 * 缓存每个目录下的 ContentItem[]，
 * 提供 loadDir、mutateDir、clearCachedDir 三个操作。
 */
export function useContentCache(feature: string) {
    const [cache, setCache] = useState<Record<string, ContentItem[]>>({});

    /** 读取目录，如果 force=true 则跳过缓存强制拉取 */
    const loadDir = useCallback(
        async (dirId: string, force = false): Promise<ContentItem[]> => {
            if (!dirId) return [];
            // 如果已有缓存且不强制刷新，直接返回
            if (!force && cache[dirId]) {
                return cache[dirId];
            }
            // 否则调用 API
            const list = await fetchContentByDirectory(feature, dirId);
            setCache(prev => ({ ...prev, [dirId]: list }));
            return list;
        },
        [cache, feature]
    );

    /**
     * 局部更新某个目录的缓存，
     * updater(oldList) => newList
     */
    const mutateDir = useCallback(
        (dirId: string, updater: (old: ContentItem[]) => ContentItem[]) => {
            setCache(prev => {
                const oldList = prev[dirId] ?? [];
                return { ...prev, [dirId]: updater(oldList) };
            });
        },
        []
    );

    /** 删除某个目录的缓存条目，下次 loadDir 会重新拉取 */
    const clearCachedDir = useCallback(
        (dirId: string) => {
            setCache(prev => {
                const next = { ...prev };
                delete next[dirId];
                return next;
            });
        },
        []
    );

    /** 所有目录里的扁平列表，主要给 DirectoryManager 渲染树与文件拖拽用 */
    const allItems = Object.values(cache).flat();

    return { cache, loadDir, mutateDir, clearCachedDir, allItems };
}