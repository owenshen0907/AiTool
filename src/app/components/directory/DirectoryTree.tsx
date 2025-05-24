// src/components/directory/DirectoryTree.tsx
import React from 'react';
import type { TreeNode } from './types';
import type { ContentItem } from '@/lib/models/content';
import DirectoryNode from './DirectoryNode';

interface DirectoryTreeProps {
    feature: string;
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

    // **补充这几项**
    onMoveItem: (id: string, newDir: string) => void;
    onReorderFile: (dirId: string, orderedIds: string[]) => void;
    reloadDirs: () => void;
    rootList: TreeNode[];
}

export default function DirectoryTree(props: DirectoryTreeProps) {
    return (
        <ul>
            {props.tree.map(node => (
                <DirectoryNode
                    key={node.id}
                    feature={props.feature}
                    node={node}
                    level={0}

                    items={props.items}
                    expand={props.expand}
                    toggleExpand={props.toggleExpand}
                    collapsed={props.collapsed}

                    selectedDirId={props.selectedDirId}
                    selectedItemId={props.selectedItemId}
                    onSelectDir={props.onSelectDir}
                    onSelectItem={props.onSelectItem}

                    onCreateContent={props.onCreateContent}
                    onDeleteItem={props.onDeleteItem}

                    addSubDir={props.addSubDir}
                    renameDir={props.renameDir}
                    removeDir={props.removeDir}

                    onMoveItem={props.onMoveItem}
                    onReorderFile={props.onReorderFile}

                    reloadDirs={props.reloadDirs}
                    rootList={props.rootList}
                />
            ))}
        </ul>
    );
}