// ========= LeftTopPanel.tsx =========
// app/prompt/case/content/LeftTopPanel.tsx.tsx
'use client';
import React, { useState, useEffect } from 'react';
import type { ContentItem } from '@/lib/models/content';
import { Pencil, Save, X } from 'lucide-react';

interface Props {
    item: ContentItem | null;
    onSave: (patch: Partial<ContentItem>) => void;
}

export default function LeftTopPanel({ item, onSave }: Props) {
    const [editMode, setEditMode] = useState(false);
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');

    // reset when item changes or panel reopened
    useEffect(() => {
        setTitle(item?.title || '');
        setSummary(item?.summary || '');
        setEditMode(false);
    }, [item?.id]);

    if (!item) return <div className="flex h-full items-center justify-center text-gray-400">未选择内容</div>;

    const createdAt = item.createdAt ? new Date(item.createdAt).toLocaleString() : '—';

    return (
        <div className="h-full flex flex-col gap-3 p-4 overflow-auto">
            {/* Header row */}
            <div className="flex items-center justify-between">
                {editMode ? (
                    <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="flex-1 border rounded px-2 py-1 text-lg font-semibold"
                        placeholder="标题"
                    />
                ) : (
                    <h2 className="text-lg font-semibold truncate">{item.title || '未命名'}</h2>
                )}

                {editMode ? (
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setEditMode(false);
                                setTitle(item.title || '');
                                setSummary(item.summary || '');
                            }}
                            className="p-1 rounded hover:bg-gray-200"
                            title="取消"
                        >
                            <X size={16} />
                        </button>
                        <button
                            onClick={() => {
                                onSave({ title: title.trim(), summary: summary.trim() });
                                setEditMode(false);
                            }}
                            className="p-1 rounded bg-green-600 text-white hover:bg-green-700"
                            title="保存"
                        >
                            <Save size={16} />
                        </button>
                    </div>
                ) : (
                    <button onClick={() => setEditMode(true)} className="p-1 text-gray-500 hover:text-gray-700" title="编辑">
                        <Pencil size={16} />
                    </button>
                )}
            </div>

            {/* Creation time */}
            <div className="text-xs text-gray-500">创建时间：{createdAt}</div>

            {/* Summary */}
            {editMode ? (
                <textarea
                    value={summary}
                    onChange={e => setSummary(e.target.value)}
                    className="flex-1 border rounded p-2 whitespace-pre-wrap"
                    placeholder="概述"
                />
            ) : (
                <p className="text-gray-700 whitespace-pre-wrap flex-1 overflow-auto">{item.summary || '（无概述）'}</p>
            )}
        </div>
    );
}