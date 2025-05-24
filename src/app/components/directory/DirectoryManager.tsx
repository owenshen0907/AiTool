// File: src/components/directory/DirectoryManager.tsx
'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

import type { ContentItem } from '@/lib/models/content';
import type { TreeNode }    from './types';

import { useDirectories }   from './useDirectories';
import DirectoryNode        from './DirectoryNode';

export interface DirectoryManagerProps {
    feature: string;
    items:   ContentItem[];

    selectedDirId:  string | null;
    selectedItemId: string | null;

    onSelectDir:   (id: string) => void;
    onSelectItem:  (id: string) => void;

    onCreateContent?: (dirId: string) => void;
    onDeleteItem?:    (itemId: string) => void;

    /* 文件拖拽 */
    onMoveItem:    (id: string, newDir: string) => void;
    onReorderFile: (dirId: string, orderedIds: string[]) => void;
}

export default function DirectoryManager({
                                             feature, items,
                                             selectedDirId, selectedItemId,
                                             onSelectDir,  onSelectItem,
                                             onCreateContent, onDeleteItem,
                                             onMoveItem, onReorderFile,
                                         }: DirectoryManagerProps) {

    /* ---------- 目录树 ---------- */
    const {
        tree,               // <TreeNode[]>
        reload,             // 重新拉取整棵树
        addSubDir,
        renameDir,
        removeDir,
    } = useDirectories(feature);

    /* ---------- 展开 / 折叠状态 ---------- */
    const [expand,    setExpand]    = useState<Set<string>>(new Set());
    const [collapsed, setCollapsed] = useState(false);

    const toggle = (id:string)=>
        setExpand(s => { const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });

    /* ---------- 渲染 ---------- */
    return (
        <aside
            className={`flex flex-col h-full bg-white border-r transition-all
                  ${collapsed ? 'w-12' : 'w-56'}`}
        >
            {/* 顶栏 */}
            <div className="flex items-center justify-between px-2 py-1 border-b">
                {!collapsed && <span className="font-semibold">目录</span>}
                <div className="flex items-center space-x-1">
                    {!collapsed && (
                        <button
                            onClick={()=>addSubDir(undefined)}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
                        >
                            ＋目录
                        </button>
                    )}
                    <button
                        onClick={()=>setCollapsed(c=>!c)}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        {collapsed ? <ChevronRight size={18}/> : <ChevronLeft size={18}/>}
                    </button>
                </div>
            </div>

            {/* 树形区域 */}
            <div className="flex-1 overflow-auto text-sm select-none px-1 pt-1">
                <ul>
                    {tree.map(node => (
                        <DirectoryNode
                            key={node.id}
                            /* 基础 */
                            feature={feature}
                            node={node}
                            level={0}
                            items={items}
                            /* 展开 */
                            expand={expand}
                            toggleExpand={toggle}
                            collapsed={collapsed}
                            /* 选中 */
                            selectedDirId={selectedDirId}
                            selectedItemId={selectedItemId}
                            onSelectDir={onSelectDir}
                            onSelectItem={onSelectItem}
                            /* 菜单动作 */
                            onCreateContent={onCreateContent}
                            onDeleteItem={onDeleteItem}
                            addSubDir={addSubDir}
                            renameDir={renameDir}
                            removeDir={removeDir}
                            /* 文件拖拽 */
                            onMoveItem={onMoveItem}
                            onReorderFile={onReorderFile}
                            /* 目录刷新 */
                            reloadDirs={reload}
                            /* 关键：根级兄弟列表 ➜ 供根目录排序 */
                            rootList={tree}
                        />
                    ))}
                </ul>
            </div>
        </aside>
    );
}