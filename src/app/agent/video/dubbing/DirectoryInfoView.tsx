// File: src/app/video/dubbing/DirectoryInfoView.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { ContentItem } from '@/lib/models/content';
import { updateContent as apiUpdate } from '@/lib/api/content';

interface Props {
    feature: string;
    items: ContentItem[];
    onSelectItem: (id: string) => void;
    onUpdateItem: (item: ContentItem, patch: Partial<ContentItem>) => Promise<void>;
}

export default function DirectoryInfoView({
                                              feature,
                                              items,
                                              onSelectItem,
                                              onUpdateItem,
                                          }: Props) {
    const [orderedItems, setOrderedItems] = useState<ContentItem[]>([]);
    const initialRef = useRef<Record<string, number>>({});

    const sensors = useSensors(useSensor(PointerSensor));

    useEffect(() => {
        const sorted = [...items].sort((a, b) => b.position - a.position);
        setOrderedItems(sorted);
        initialRef.current = Object.fromEntries(sorted.map(i => [i.id, i.position]));
    }, [items]);

    const handleDragEnd = async (e: DragEndEvent) => {
        const { active, over } = e;
        if (active.id === over?.id) return;

        const oldIndex = orderedItems.findIndex(i => i.id === active.id);
        const newIndex = orderedItems.findIndex(i => i.id === over!.id);
        const newOrder = arrayMove(orderedItems, oldIndex, newIndex);
        setOrderedItems(newOrder);

        const total = newOrder.length;
        const patched = newOrder.map((item, idx) => ({
            id: item.id,
            position: total - idx,
        }));
        const toUpdate = patched.filter(it => it.position !== initialRef.current[it.id]);

        if (toUpdate.length) {
            await Promise.all(
                toUpdate.map(({ id, position }) => apiUpdate(feature, { id, position }))
            );
            toUpdate.forEach(({ id, position }) => {
                initialRef.current[id] = position;
            });
        }
    };

    // 拆成两列展示，但拖拽逻辑由外层统一管理
    const firstCol = orderedItems.slice(0, 10);
    const secondCol = orderedItems.slice(10);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={orderedItems.map(i => i.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="flex h-full">
                    {[firstCol, secondCol].map((colItems, colIdx) => (
                        <div key={colIdx} className="w-1/2 p-4 overflow-auto space-y-2">
                            {colItems.map(item => (
                                <SortableItem
                                    key={item.id}
                                    item={item}
                                    onSelectItem={onSelectItem}
                                    onUpdateItem={onUpdateItem}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

interface SortableItemProps {
    item: ContentItem;
    onSelectItem: (id: string) => void;
    onUpdateItem: (item: ContentItem, patch: Partial<ContentItem>) => Promise<void>;
}

function SortableItem({ item, onSelectItem, onUpdateItem }: SortableItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    const [title, setTitle] = useState(item.title);
    const [summary, setSummary] = useState(item.summary || '');
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        setTitle(item.title);
        setSummary(item.summary || '');
    }, [item.title, item.summary]);

    const handleBlurTitle = () => {
        if (title !== item.title) {
            onUpdateItem(item, { title });
        }
    };
    const handleBlurSummary = () => {
        if (summary !== item.summary) {
            onUpdateItem(item, { summary });
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-start justify-between bg-white rounded-xl shadow p-3"
        >
            <div className="flex-1 cursor-pointer"
                 // onClick={() => !editing && onSelectItem(item.id)}
                            onClick={() => {
                                if (!editing) {
                                        // 在新标签页打开当前目录+doc 参数
                                            const params = new URLSearchParams(window.location.search);
                                        params.set('doc', item.id);
                                        const url = window.location.pathname + '?' + params.toString();
                                        window.open(url, '_blank', 'noopener');
                                    }
                            }}
            >
                {editing ? (
                    <>
                        <input
                            className="w-full border-b mb-1 text-base"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            onBlur={handleBlurTitle}
                            placeholder="标题"
                        />
                        <textarea
                            className="w-full text-sm text-gray-600"
                            value={summary}
                            onChange={e => setSummary(e.target.value)}
                            onBlur={handleBlurSummary}
                            placeholder="摘要"
                        />
                    </>
                ) : (
                    <>
                        <h3 className="text-base font-semibold">{item.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">
                            {item.summary || '（无摘要）'}
                        </p>
                    </>
                )}
            </div>
            <div className="flex flex-col items-center ml-2 space-y-1">
                <GripVertical
                    {...attributes}
                    {...listeners}
                    className="cursor-grab text-gray-400 hover:text-gray-600"
                />
                <button
                    onClick={() => setEditing(e => !e)}
                    className="text-xs text-blue-500"
                >
                    {editing ? '完成' : '编辑'}
                </button>
            </div>
        </div>
    );
}