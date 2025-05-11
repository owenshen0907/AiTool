// src/components/directory/DirectoryManager.tsx
'use client';
import React, { useState } from 'react';
import type { ContentItem } from '@/lib/models/content';
import { useDirectories } from './useDirectories';
import DirectoryTree from './DirectoryTree';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export interface DirectoryManagerProps {
    feature: string;
    selectedDirId: string | null;
    selectedItemId: string | null;
    items: ContentItem[];
    onSelectDir: (id: string) => void;
    onSelectItem: (id: string) => void;
    onCreateContent?: (dirId: string) => void;
    onDeleteItem?: (id: string) => void;
}

export default function DirectoryManager({
                                             feature, selectedDirId, selectedItemId,
                                             items, onSelectDir, onSelectItem,
                                             onCreateContent, onDeleteItem
                                         }: DirectoryManagerProps) {
    const { tree, addSubDir, renameDir, removeDir } = useDirectories(feature);
    const [expand, setExpand] = useState<Set<string>>(new Set());
    const [collapsed, setCollapsed] = useState(false);
    const [menuId, setMenuId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpand(s => {
            const next = new Set(s);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    return (
        <aside className={`flex flex-col h-screen bg-white border-r transition-all duration-200 ${collapsed ? 'w-12' : 'w-56'}`}>
            <div className="flex items-center justify-between px-2 py-1 border-b">
                {!collapsed && <span className="font-semibold">目录</span>}
                <div className="flex items-center space-x-1">
                    {!collapsed && (
                        <button onClick={() => addSubDir(undefined)} className="px-2 py-1 text-xs bg-blue-600 text-white rounded">＋目录</button>
                    )}
                    <button onClick={() => setCollapsed(c => !c)} className="p-1 hover:bg-gray-100 rounded">
                        {collapsed ? <ChevronRight size={18}/> : <ChevronLeft size={18}/>}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto text-sm select-none">
                <DirectoryTree
                    tree={tree}
                    items={items}
                    selectedDirId={selectedDirId}
                    selectedItemId={selectedItemId}
                    onSelectDir={onSelectDir}
                    onSelectItem={onSelectItem}
                    onCreateContent={onCreateContent}
                    onDeleteItem={onDeleteItem}
                    expand={expand}
                    toggleExpand={toggleExpand}
                    menuId={menuId}
                    setMenuId={setMenuId}
                    addSubDir={addSubDir}
                    renameDir={renameDir}
                    removeDir={removeDir}
                    collapsed={collapsed}
                />
            </div>
        </aside>
    );
}