'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ContentItem } from '@/lib/models/content';
import type { TreeNode }    from './types';


import DirectoryNode from './DirectoryNode';

export interface DirectoryManagerProps {
    feature: string;
    items:   ContentItem[];

    selectedDirId:  string | null;
    selectedItemId: string | null;

    onSelectDir:   (id: string) => void;
    onSelectItem:  (id: string) => void;

    onCreateContent?: (dirId: string) => void;
    onDeleteItem?:    (itemId: string) => void;
    onMoveItem:    (id: string, newDir: string) => void;
    onReorderFile: (dirId: string, orderedIds: string[]) => void;

    reloadDirs: () => void;
    tree: TreeNode[];
    addSubDir: (parentId?: string) => void;
    renameDir: (id: string, name: string) => void;
    removeDir: (id: string, name: string) => void;
}

export default function DirectoryManager({
                                             feature,
                                             items,
                                             selectedDirId,
                                             selectedItemId,
                                             onSelectDir: _onSelectDir,
                                             onSelectItem,
                                             onCreateContent,
                                             onDeleteItem,
                                             onMoveItem,
                                             onReorderFile,
                                             reloadDirs,
                                             tree,
                                             addSubDir,
                                             renameDir,
                                             removeDir,
                                         }: DirectoryManagerProps) {
    const [expand,    setExpand]    = useState<Set<string>>(new Set());
    const [collapsed, setCollapsed] = useState(false);
    const router = useRouter();

    // Helper: 查找某个目录及其所有祖先节点的路径
    const findPath = (
        nodes: TreeNode[],
        targetId: string
    ): string[] | null => {
        for (const node of nodes) {
            if (node.id === targetId) return [node.id];
            if (node.children) {
                const childPath = findPath(node.children, targetId);
                if (childPath) return [node.id, ...childPath];
            }
        }
        return null;
    };

    // 当 selectedDirId 改变时，自动展开该目录及其所有祖先
    useEffect(() => {
        if (selectedDirId) {
            const path = findPath(tree, selectedDirId);
            if (path) {
                setExpand(prev => {
                    const next = new Set(prev);
                    path.forEach(id => next.add(id));
                    return next;
                });
            }
        }
    }, [selectedDirId, tree]);

    const toggleExpand = (id: string) =>
        setExpand(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    // 点击目录：更新当前页状态 + 在新标签页打开带参数 URL
    const handleSelectDir = (dirId: string) => {
        _onSelectDir(dirId);
        router.push(`/docs/${feature}?dir=${dirId}`);
    };

    return (
        <aside className={`flex flex-col h-full bg-white border-r transition-all
            ${collapsed ? 'w-12' : 'w-56'}`}
        >
            <div className="flex items-center justify-between px-2 py-1 border-b">
                {!collapsed && <span className="font-semibold">目录</span>}
                <div className="flex items-center space-x-1">
                    {!collapsed && (
                        <button
                            onClick={() => addSubDir(undefined)}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
                        >
                            ＋目录
                        </button>
                    )}
                    <button
                        onClick={() => setCollapsed(c => !c)}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        {collapsed ? <ChevronRight size={18}/> : <ChevronLeft size={18}/>}
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-auto text-sm select-none px-1 pt-1">
                <ul>
                    {tree.map(node => (
                        <DirectoryNode
                            key={node.id}
                            feature={feature}
                            node={node}
                            level={0}
                            items={items}

                            expand={expand}
                            toggleExpand={toggleExpand}
                            collapsed={collapsed}

                            selectedDirId={selectedDirId}
                            selectedItemId={selectedItemId}
                            onSelectDir={handleSelectDir}
                            onSelectItem={onSelectItem}

                            onCreateContent={onCreateContent}
                            onDeleteItem={onDeleteItem}
                            addSubDir={addSubDir}
                            renameDir={renameDir}
                            removeDir={removeDir}
                            onMoveItem={onMoveItem}
                            onReorderFile={onReorderFile}
                            reloadDirs={reloadDirs}
                            rootList={tree}
                        />
                    ))}
                </ul>
            </div>
        </aside>
    );
}
