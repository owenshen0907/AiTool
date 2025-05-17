// src/components/directory/useDirectories.ts
import { useState, useEffect, useCallback } from 'react';
import type { DirectoryItem } from '@/lib/models/directory';
import type { TreeNode } from './types';
import { fetchDirectories, createDirectoryApi, updateDirectoryApi, deleteDirectoryApi } from '@/lib/api/directory';
import { buildTree } from './utils';

export function useDirectories(feature: string) {
    const [tree, setTree] = useState<TreeNode[]>([]);

    const load = useCallback(async () => {
        const list: DirectoryItem[] = await fetchDirectories(feature);
        setTree(buildTree(list));
    }, [feature]);

    useEffect(() => { load(); }, [load]);

    const addSubDir = async (parentId?: string) => {
        const name = prompt('新目录名称')?.trim();
        if (!name) return;
        await createDirectoryApi(feature, parentId, name);
        await load();
    };

    const renameDir = async (id: string, currentName: string) => {
        const name = prompt('重命名', currentName)?.trim();
        if (!name || name === currentName) return;
        await updateDirectoryApi(id, name);
        await load();
    };

    const removeDir = async (id: string, name: string) => {
        if (!confirm(`确认删除目录「${name}」？`)) return;
        try {
            await deleteDirectoryApi(id);
            await load();
        } catch (err: any) {
            // 如果后端返回了 { error: '...' }，deleteDirectoryApi 会 throw 新的 Error(msg)
            alert(err.message || '删除失败');
        }
    };

    return { tree, addSubDir, renameDir, removeDir };
}