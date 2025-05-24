'use client';
import { useState, useCallback, useEffect } from 'react';
import type { DirectoryItem } from '@/lib/models/directory';
import type { TreeNode }       from './types';

import {
    fetchDirectories,
    createDirectoryApi,
    updateDirectoryApi,
    deleteDirectoryApi,
} from '@/lib/api/directory';

function buildTree(list: DirectoryItem[]): TreeNode[] {
    const map: Record<string, TreeNode> = {};
    list.forEach(d => (map[d.id] = { ...d, children: [] }));
    const roots: TreeNode[] = [];
    list.forEach(d => {
        if (d.parentId && map[d.parentId]) map[d.parentId].children.push(map[d.id]);
        else roots.push(map[d.id]);
    });
    const sortFn = (a: TreeNode, b: TreeNode) => a.position - b.position;
    roots.sort(sortFn);
    roots.forEach(function dfs(n){ n.children.sort(sortFn); n.children.forEach(dfs); });
    return roots;
}

export function useDirectories(feature: string) {
    const [tree, setTree] = useState<TreeNode[]>([]);

    const load = useCallback(async () => {
        const list = await fetchDirectories(feature);
        setTree(buildTree(list));
    }, [feature]);

    /* 供外部刷新 */
    useEffect(() => { load(); }, [load]);
    const reload = load;

    /* CRUD */
    const addSubDir = async (parentId?: string) => {
        const name = prompt('新目录名称')?.trim();
        if (!name) return;
        await createDirectoryApi(feature, parentId, name);
        await load();
    };
    const renameDir = async (id: string, cur: string) => {
        const name = prompt('重命名', cur)?.trim();
        if (!name || name === cur) return;
        await updateDirectoryApi(id, name);
        await load();
    };
    const removeDir = async (id: string, nm: string) => {
        if (!confirm(`确认删除目录「${nm}」？`)) return;
        try { await deleteDirectoryApi(id); await load(); }
        catch (e:any){ alert(e.message || '删除失败'); }
    };

    return { tree, reload, addSubDir, renameDir, removeDir };
}