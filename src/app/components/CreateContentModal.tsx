'use client';

import React from 'react';
import type { ContentItem } from '@/lib/models/content';

interface Props {
    items:            ContentItem[];
    selectedItem:     ContentItem | null;

    onSelectItem:     (id: string)               => void;
    onCreateItem:     ()                         => void;
    onEditItem:       (item: ContentItem)        => void;
    onDeleteItem:     (id: string)               => void;
    onReorderItems:   (orderedIds: string[])     => void;
}

export default function CaseContentPanel({
                                             items,
                                             selectedItem,
                                             onSelectItem,
                                             onCreateItem,
                                             onEditItem,
                                             onDeleteItem,
                                             onReorderItems,
                                         }: Props) {

    /* —— 目前做一个最小可用界面：左侧列表 + 简单详情 —— */

    return (
        <div className="flex h-full">
            {/* 列表 */}
            <div className="w-64 border-r">
                <div className="px-3 py-2 flex justify-between items-center border-b">
                    <span className="font-semibold">场景</span>
                    <button
                        className="px-2 py-1 text-sm bg-blue-600 text-white rounded"
                        onClick={onCreateItem}
                    >
                        ＋ 新建
                    </button>
                </div>

                <ul className="overflow-auto">
                    {(items ?? []).map(it => (
                        <li
                            key={it.id}
                            className={`px-3 py-2 cursor-pointer ${
                                selectedItem?.id === it.id ? 'bg-blue-50' : 'hover:bg-gray-100'
                            }`}
                            onClick={() => onSelectItem(it.id)}
                        >
                            {it.title}
                        </li>
                    ))}
                </ul>
            </div>

            {/* 详情 / 占位 */}
            <div className="flex-1 p-6 overflow-auto">
                {selectedItem ? (
                    <div>
                        <h2 className="text-xl font-semibold mb-2">{selectedItem.title}</h2>
                        {selectedItem.summary && (
                            <p className="mb-4 text-gray-700">{selectedItem.summary}</p>
                        )}
                        {selectedItem.body && (
                            <pre className="whitespace-pre-wrap">{selectedItem.body}</pre>
                        )}

                        <div className="mt-6 space-x-3">
                            <button
                                className="px-4 py-1 rounded bg-blue-600 text-white"
                                onClick={() => onEditItem(selectedItem)}
                            >
                                编辑
                            </button>
                            <button
                                className="px-4 py-1 rounded bg-red-600 text-white"
                                onClick={() => onDeleteItem(selectedItem.id)}
                            >
                                删除
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        请选择左侧场景
                    </div>
                )}
            </div>
        </div>
    );
}