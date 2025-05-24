// File: src/components/DirectoryLayout.tsx
'use client';

import React, { useState, useEffect } from 'react';
import DirectoryManager from './DirectoryManager';
import ContentModal     from './CreateContentModal';

import type { ContentItem } from '@/lib/models/content';
import { useContentCache }  from '@/hooks/useContentCache';

import {
    createContent,
    updateContent,
    deleteContent,
    reorderContent,
} from '@/lib/api/content';

export interface DirectoryLayoutProps {
    feature: string;
    children: (props: {
        currentDir:   string | null;
        selectedItem: ContentItem | null;
        visibleItems: ContentItem[];
        onSelectItem: (id: string) => void;
        onCreate:     (dirId: string) => void;
        onUpdate:     (item: ContentItem, patch: Partial<ContentItem>) => void;
        onDelete:     (id: string) => void;
        onReorder:    (orderedIds: string[]) => void;
    }) => React.ReactNode;
}

export default function DirectoryLayout({ feature, children }: DirectoryLayoutProps) {
    const [currentDir,   setCurrentDir]   = useState<string|null>(null);
    const [selectedItem, setSelectedItem] = useState<ContentItem|null>(null);

    const { loadDir, mutateDir, allItems } = useContentCache(feature);
    const [visibleItems, setVisibleItems]  = useState<ContentItem[]>([]);

    /* 弹窗状态 */
    const [modalVisible,setModalVisible] = useState(false);
    const [editingItem, setEditingItem]  = useState<ContentItem|null>(null);

    /* 载入当前目录内容 */
    useEffect(() => {
        if (!currentDir) {
            setVisibleItems([]);
        } else {
            loadDir(currentDir).then(setVisibleItems);
        }
    }, [currentDir, loadDir]);

    /* 在某目录内排序 */
    const reorderSameDir = async (dirId: string, ids: string[]) => {
        await reorderContent(feature, dirId, ids);
        mutateDir(dirId, list =>
            ids.map(id => list.find(i => i.id === id)!).filter(Boolean)
        );
        if (currentDir === dirId) {
            const fresh = await loadDir(dirId, true);
            setVisibleItems(fresh);
        }
    };

    /* 删除文件 */
    const deleteItem = async (id: string) => {
        const itm = allItems.find(i => i.id === id);
        if (!itm) return;
        await deleteContent(feature, id);
        mutateDir(itm.directoryId, list => list.filter(i => i.id !== id));
        if (selectedItem?.id === id) setSelectedItem(null);
        if (currentDir === itm.directoryId) {
            const fresh = await loadDir(itm.directoryId);
            setVisibleItems(fresh);
        }
    };

    /* 移动文件到其他目录 */
    const moveItem = async (id: string, newDirId: string) => {
        const itm = allItems.find(i => i.id === id);
        if (!itm || itm.directoryId === newDirId) return;
        const oldDir = itm.directoryId;

        await updateContent(feature, { id, directoryId: newDirId });
        //
        // mutateDir(oldDir, list => list.filter(i => i.id !== id));
        // mutateDir(newDirId, list => [...list, { ...itm, directoryId: newDirId }]);
        // itm.directoryId = newDirId;
        //
        // if (currentDir === oldDir || currentDir === newDirId) {
        //     const fresh = await loadDir(currentDir!);
        //     setVisibleItems(fresh);
        // }
        // 调接口把目录改过来
        // 强制刷新“旧目录”和“新目录”的缓存
        await loadDir(oldDir, true);
        await loadDir(newDirId, true);
        // 如果当前正好在这两个目录里，就刷新 visibleItems
        if (currentDir) {
            const fresh = await loadDir(currentDir, true);
            setVisibleItems(fresh);
        }
    };

    /* 新建 / 编辑 */
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
        // 新增/编辑后立即刷新
        const fresh = await loadDir(currentDir);
        setVisibleItems(fresh);

        setModalVisible(false);
    };

    return (
        <div className="flex h-screen">
            <DirectoryManager
                feature={feature}
                items={allItems}
                selectedDirId={currentDir}
                selectedItemId={selectedItem?.id ?? null}
                onSelectDir={id => { setCurrentDir(id); setSelectedItem(null); }}
                onSelectItem={id => setSelectedItem(allItems.find(i => i.id === id) ?? null)}
                onCreateContent={openCreate}
                onDeleteItem={deleteItem}
                onMoveItem={moveItem}
                // 这里保持两个参数：dirId + orderedIds
                onReorderFile={reorderSameDir}
            />

            <main className="flex-1 bg-white overflow-auto">
                {children({
                    currentDir,
                    selectedItem,
                    visibleItems,
                    onSelectItem: id => setSelectedItem(visibleItems.find(i => i.id === id) ?? null),
                    onCreate: openCreate,
                    onUpdate: openEdit,
                    onDelete: deleteItem,
                    // **注意** 这里只给一个参数 orderedIds，所以需要用箭头包一下
                    onReorder: ids => currentDir && reorderSameDir(currentDir, ids),
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