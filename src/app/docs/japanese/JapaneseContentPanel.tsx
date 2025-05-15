// src/app/docs/japanese/JapaneseContentPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import type { ContentItem } from '@/lib/models/content';
import { PlusCircle, Trash2, Save } from 'lucide-react';

interface Props {
    items: ContentItem[];
    selectedItem: ContentItem | null;
    onSelectItem: (id: string) => void;
    onCreateItem: () => void;
    onUpdateItem: (item: ContentItem, patch: Partial<ContentItem>) => void;
    onDeleteItem: (id: string) => void;
    onReorderItems: (orderedIds: string[]) => void;
}

export default function JapaneseContentPanel({
                                                 items,
                                                 selectedItem,
                                                 onSelectItem,
                                                 onCreateItem,
                                                 onUpdateItem,
                                                 onDeleteItem,
                                                 onReorderItems, // 预留，用于未来拖拽排序
                                             }: Props) {
    /* 表单状态，同步 selectedItem */
    const [form, setForm] = useState({ title: '', summary: '', body: '' });
    useEffect(() => {
        if (selectedItem) {
            setForm({
                title: selectedItem.title ?? '',
                summary: selectedItem.summary ?? '',
                body: selectedItem.body ?? '',
            });
        } else {
            setForm({ title: '', summary: '', body: '' });
        }
    }, [selectedItem?.id]);

    const handleSave = () => {
        if (!selectedItem) return;
        onUpdateItem(selectedItem, form);
    };

    return (
        <div className="flex h-screen overflow-hidden">
            {/* 左侧文档列表 */}
            <div className="w-1/4 border-r overflow-y-auto">
                <div className="flex items-center justify-between p-2 border-b bg-gray-50">
                    <span className="font-semibold">文档列表</span>
                    <button
                        className="p-1 hover:bg-gray-200 rounded"
                        onClick={onCreateItem}
                        title="新建文档"
                    >
                        <PlusCircle size={18} />
                    </button>
                </div>
                <ul>
                    {items.map((item) => (
                        <li
                            key={item.id}
                            onClick={() => onSelectItem(item.id)}
                            className={`cursor-pointer px-3 py-2 border-b hover:bg-gray-100 ${
                                selectedItem?.id === item.id ? 'bg-blue-50' : ''
                            }`}
                        >
                            {item.title || '（无标题）'}
                        </li>
                    ))}
                </ul>
            </div>

            {/* 右侧编辑器 */}
            <div className="flex-1 p-4 overflow-y-auto">
                {selectedItem ? (
                    <>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">标题</label>
                                <input
                                    className="w-full border rounded p-2"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">概要</label>
                                <textarea
                                    className="w-full border rounded p-2 min-h-[80px]"
                                    value={form.summary}
                                    onChange={(e) => setForm({ ...form, summary: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">正文</label>
                                <textarea
                                    className="w-full border rounded p-2 min-h-[160px]"
                                    value={form.body}
                                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button
                                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                onClick={handleSave}
                            >
                                <Save size={16} /> 保存
                            </button>
                            <button
                                className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                onClick={() => onDeleteItem(selectedItem.id)}
                            >
                                <Trash2 size={16} /> 删除
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        请选择左侧文档或点击「+」新建
                    </div>
                )}
            </div>
        </div>
    );
}
