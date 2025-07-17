// File: src/components/directory/DirectoryManager.tsx
'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ContentItem } from '@/lib/models/content';
import type { TreeNode } from './types';
import DirectoryNode from './DirectoryNode';

export interface DirectoryManagerProps {
    feature: string;
    modelName: string;
    items: ContentItem[];

    /** ★ 由父组件控制的展开状态 */
    expand: Set<string>;
    toggleExpand: (id: string) => void;

    selectedDirId: string | null;
    selectedItemId: string | null;

    onSelectDir: (id: string) => void;
    onSelectItem: (id: string) => void;

    onCreateContent?: (dirId: string) => void;
    onDeleteItem?: (itemId: string) => void;
    onMoveItem: (id: string, newDir: string) => void;
    onReorderFile: (dirId: string, orderedIds: string[]) => void;

    reloadDirs: () => void;
    tree: TreeNode[];
    addSubDir: (parentId?: string) => void;
    renameDir: (id: string, name: string) => void;
    removeDir: (id: string, name: string) => void;
}

export default function DirectoryManager({
                                             feature,
                                             modelName,
                                             items,
                                             expand,             // ← 来自父组件
                                             toggleExpand,       // ← 来自父组件

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
    const [collapsed, setCollapsed] = useState(false);
    const router = useRouter();

    /* 点击目录：更新当前页的 currentDir + 修改 URL，但不新开标签页 */
    const handleSelectDir = (dirId: string) => {
        _onSelectDir(dirId);
        // const params = new URLSearchParams(window.location.search);
        // params.set('dir', dirId);
        // router.replace(`?${params.toString()}`, { scroll: false });

        const url = new URL(window.location.href);
        url.searchParams.set('dir', dirId);
        url.searchParams.delete('doc');
        window.history.replaceState(null, '', url.toString());

    };

    return (
        <aside
            className={`flex flex-col h-full bg-white border-r transition-all ${
                collapsed ? 'w-12' : 'w-56'
            }`}
        >
            {/* ── 顶栏 ── */}
            <div className="flex items-center justify-between px-2 py-1 border-b">
                {!collapsed && <span className="text-xs text-gray-400">{modelName}</span>}
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
                        onClick={() => setCollapsed((c) => !c)}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>
            </div>

            {/* ── 树形区域 ── */}
            <div className="flex-1 overflow-auto text-sm select-none px-1 pt-1">
                <ul>
                    {tree.map((node) => (
                        <DirectoryNode
                            key={node.id}
                            feature={feature}
                            node={node}
                            level={0}
                            items={items}
                            /* 展开状态来自父组件 */
                            expand={expand}
                            toggleExpand={toggleExpand}
                            collapsed={collapsed}
                            /* 选中信息 */
                            selectedDirId={selectedDirId}
                            selectedItemId={selectedItemId}
                            onSelectDir={handleSelectDir}
                            onSelectItem={onSelectItem}
                            /* 目录 / 文件操作 */
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