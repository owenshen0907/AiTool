// File: src/components/DirectoryLayout.tsx
'use client';

import React, { useState, useEffect } from 'react';
import DirectoryManager from './DirectoryManager';
import ContentModal from './CreateContentModal';
import type { ContentItem } from '@/lib/models/content';
import { useContentCache } from '@/hooks/useContentCache';
import {
    createContent,
    updateContent,
    deleteContent,
    reorderContent,
} from '@/lib/api/content';

export interface DirectoryLayoutProps {
    feature: string;
    children: (props: {
        currentDir: string | null;
        selectedItem: ContentItem | null;
        visibleItems: ContentItem[];
        onSelectItem: (id: string) => void;
        onCreate: (dirId: string) => void;
        onUpdate: (item: ContentItem, patch: Partial<ContentItem>) => void;
        onDelete: (id: string) => void;
        onReorder: (orderedIds: string[]) => void;
    }) => React.ReactNode;
}

export default function DirectoryLayout({ feature, children }: DirectoryLayoutProps) {
    const [currentDir, setCurrentDir] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
    const { loadDir, mutateDir, allItems } = useContentCache(feature);
    const [visibleItems, setVisibleItems] = useState<ContentItem[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<ContentItem | null>(null);

    useEffect(() => {
        if (!currentDir) {
            setVisibleItems([]);
            return;
        }
        loadDir(currentDir).then(setVisibleItems);
    }, [currentDir, loadDir]);

    const openCreate = (dirId: string) => {
        setEditingItem(null);
        setCurrentDir(dirId);
        setModalVisible(true);
    };
    const openEdit = (item: ContentItem) => {
        setEditingItem(item);
        setModalVisible(true);
    };

    const handleModalSubmit = async (data: { title: string; summary?: string; body?: string }) => {
        if (!currentDir) return;
        if (editingItem) {
            await updateContent(feature, {
                id: editingItem.id,
                directoryId: currentDir,
                title: data.title,
                summary: data.summary,
                body: data.body,
            });
            mutateDir(currentDir, list =>
                list.map(i => i.id === editingItem.id ? { ...i, ...data } : i)
            );
        } else {
            const created = await createContent(feature, {
                directoryId: currentDir,
                title: data.title,
                summary: data.summary,
                body: data.body,
            });
            mutateDir(currentDir, list => [...list, created]);
        }
        setModalVisible(false);
    };

    const deleteItem = async (id: string) => {
        if (!currentDir) return;
        await deleteContent(feature, id);
        mutateDir(currentDir, list => list.filter(i => i.id !== id));
        if (selectedItem?.id === id) setSelectedItem(null);
    };

    const reorder = async (orderedIds: string[]) => {
        if (!currentDir) return;
        await reorderContent(feature, currentDir, orderedIds);
        mutateDir(currentDir, list =>
            orderedIds.map(id => list.find(i => i.id === id)!).filter(Boolean)
        );
    };

    const updateItem = async (
        item: ContentItem,
        patch: Partial<Pick<ContentItem, 'title' | 'summary' | 'body'>>
    ) => {
        if (!currentDir) return;
        const payload = {
            id: item.id,
            directoryId: currentDir,
            title: patch.title ?? item.title,
            summary: patch.summary ?? item.summary,
            body: patch.body ?? item.body,
        };
        await updateContent(feature, payload);
        mutateDir(currentDir, list =>
            list.map(i => i.id === item.id ? { ...i, ...(patch as any) } : i)
        );
        setSelectedItem(prev =>
            prev?.id === item.id ? { ...prev, ...(patch as any) } : prev
        );
    };

    return (
        <div className="flex h-screen">
            <DirectoryManager
                feature={feature}
                selectedDirId={currentDir}
                selectedItemId={selectedItem?.id ?? null}
                items={allItems}
                onSelectDir={id => { setCurrentDir(id); setSelectedItem(null); }}
                onSelectItem={id => setSelectedItem(allItems.find(i => i.id === id) ?? null)}
                onCreateContent={openCreate}
                onDeleteItem={deleteItem}
            />

            <main className="flex-1 bg-white overflow-auto">
                {children({
                    currentDir,
                    selectedItem,
                    visibleItems,
                    onSelectItem: id => setSelectedItem(visibleItems.find(i => i.id === id) ?? null),
                    onCreate: openCreate,
                    onUpdate: updateItem,
                    onDelete: deleteItem,
                    onReorder: reorder,
                })}
            </main>

            <ContentModal
                visible={modalVisible}
                title={editingItem ? '编辑内容' : '新建内容'}
                initialData={
                    editingItem
                        ? { title: editingItem.title, summary: editingItem.summary, body: editingItem.body }
                        : { title: '', summary: '', body: '' }
                }
                onCancel={() => setModalVisible(false)}
                onSubmit={handleModalSubmit}
            />
        </div>
    );
}
