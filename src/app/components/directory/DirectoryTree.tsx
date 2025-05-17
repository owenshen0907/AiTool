// src/components/directory/DirectoryTree.tsx
import React from 'react';
import type { TreeNode } from './types';
import type { ContentItem } from '@/lib/models/content';
import DirectoryNode from './DirectoryNode';

interface DirectoryTreeProps {
    tree: TreeNode[];
    items: ContentItem[];
    selectedDirId: string | null;
    selectedItemId: string | null;
    onSelectDir: (id: string) => void;
    onSelectItem: (id: string) => void;
    onCreateContent?: (dirId: string) => void;
    onDeleteItem?: (id: string) => void;
    expand: Set<string>;
    toggleExpand: (id: string) => void;
    menuId: string | null;
    setMenuId: (id: string | null) => void;
    addSubDir: (parentId?: string) => void;
    renameDir: (id: string, name: string) => void;
    removeDir: (id: string, name: string) => void;
    collapsed: boolean;
}

export default function DirectoryTree(props: DirectoryTreeProps) {
    return (
        <ul>
            {props.tree.map(node => (
                <DirectoryNode key={node.id} node={node} level={0} {...props} />
            ))}
        </ul>
    );
}