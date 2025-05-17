// src/components/directory/utils.ts
import type { DirectoryItem } from '@/lib/models/directory';

import type { TreeNode } from './types';

export function buildTree(list: DirectoryItem[]): TreeNode[] {
    const map: Record<string, TreeNode> = {};
    list.forEach(d => (map[d.id] = { ...d, children: [] }));
    const roots: TreeNode[] = [];
    list.forEach(d => {
        if (d.parentId && map[d.parentId]) map[d.parentId].children.push(map[d.id]);
        else roots.push(map[d.id]);
    });
    const sortFn = (a: TreeNode, b: TreeNode) => a.position - b.position;
    roots.sort(sortFn);
    roots.forEach(function dfs(node: TreeNode) {
        node.children.sort(sortFn);
        node.children.forEach(dfs);
    });
    return roots;
}