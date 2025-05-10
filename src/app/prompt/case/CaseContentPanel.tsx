'use client';

import React, { useState } from 'react';
import type { ContentItem } from '@/lib/models/content';
import { GripVertical, Pencil, Trash2, Plus } from 'lucide-react';

interface Props {
    items: ContentItem[];
    selectedItem: ContentItem | null;
    onSelectItem: (id: string) => void;
    onCreateItem: () => void;
    onUpdateItem: (item: ContentItem) => void;
    onDeleteItem: (id: string) => void;
    onReorderItems: (orderedIds: string[]) => void;
}

export default function CaseContentPanel({
                                             items,
                                             selectedItem,
                                             onSelectItem,
                                             onCreateItem,
                                             onUpdateItem,
                                             onDeleteItem,
                                             onReorderItems,
                                         }: Props) {
    // 简单拖拽排序
    const [dragId, setDragId] = useState<string | null>(null);

    const handleDrop = (targetId: string) => {
        if (!dragId || dragId === targetId) return;
        const ordered = [...items];
        const from = ordered.findIndex((i) => i.id === dragId);
        const to   = ordered.findIndex((i) => i.id === targetId);
        const [m]  = ordered.splice(from, 1);
        ordered.splice(to, 0, m);
        onReorderItems(ordered.map((i) => i.id));
        setDragId(null);
    };

    return (
        <div className="flex h-full">
            {/* 左侧列表 */}
            <div className="w-80 border-r">
                <div className="flex items-center justify-between border-b p-2">
                    <span className="font-semibold">内容列表</span>
                    <button onClick={onCreateItem} className="rounded bg-blue-600 p-1 text-white hover:bg-blue-700">
                        <Plus size={16} />
                    </button>
                </div>

                <ul className="h-[calc(100%-40px)] overflow-auto">
                    {items.map((it) => (
                        <li
                            key={it.id}
                            draggable
                            onDragStart={() => setDragId(it.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(it.id)}
                            className={`group flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-100 ${
                                selectedItem?.id === it.id ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => onSelectItem(it.id)}
                        >
                            <span className="truncate">{it.title}</span>
                            <GripVertical size={14} className="opacity-0 group-hover:opacity-100" />
                        </li>
                    ))}
                </ul>
            </div>

            {/* 右侧详情 */}
            <div className="flex-1 p-6 overflow-auto">
                {selectedItem ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">{selectedItem.title}</h2>
                            <div className="space-x-3">
                                <button
                                    onClick={() => onUpdateItem(selectedItem)}
                                    className="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700"
                                >
                                    <Pencil size={14} className="inline" /> 编辑
                                </button>
                                <button
                                    onClick={() => onDeleteItem(selectedItem.id)}
                                    className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                                >
                                    <Trash2 size={14} className="inline" /> 删除
                                </button>
                            </div>
                        </div>
                        {selectedItem.summary && <p className="text-gray-600">{selectedItem.summary}</p>}
                        {selectedItem.body && <pre className="whitespace-pre-wrap">{selectedItem.body}</pre>}
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">请选择左侧内容</div>
                )}
            </div>
        </div>
    );
}