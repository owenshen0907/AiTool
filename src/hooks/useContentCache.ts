'use client';

import { useState, useCallback } from 'react';
import type { ContentItem } from '@/lib/models/content';
import { fetchContentByDirectory } from '@/lib/api/content';

export function useContentCache(feature: string) {
    const [cache, setCache] = useState<Record<string, ContentItem[]>>({});

    // loadDir: force=true 强制拉接口；否则用缓存
    const loadDir = useCallback(
        async (dirId: string, force = false): Promise<ContentItem[]> => {
            if (!dirId) return [];
            if (!force && cache[dirId]) {
                // console.log('返回缓存', dirId, cache[dirId]);
                return cache[dirId];
            }
            const list = await fetchContentByDirectory(feature, dirId);
            // console.log('强制刷新API', dirId, list);
            setCache(prev => ({ ...prev, [dirId]: list }));
            return list;
        },
        [feature, cache]
    );

    // 前端同步本地缓存
    const mutateDir = useCallback(
        (dirId: string, updater: (old: ContentItem[]) => ContentItem[]) => {
            setCache(prev => {
                const oldList = prev[dirId] ?? [];
                return { ...prev, [dirId]: updater(oldList) };
            });
        },
        []
    );

    // 清理缓存
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

    // 合并所有内容（树状结构遍历用）
    const allItems = Object.values(cache).flat();

    return { loadDir, mutateDir, clearCachedDir, allItems, cache };
}