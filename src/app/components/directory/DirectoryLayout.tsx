// File: src/components/directory/DirectoryLayout.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DirectoryManager from './DirectoryManager';
import ContentModal     from './CreateContentModal';

import type { ContentItem } from '@/lib/models/content';
import { useContentCache }  from '@/hooks/useContentCache';
import { useDirectories }   from './useDirectories';
import {
    createContent,
    updateContent,
    deleteContent,
    reorderContent,
    moveAndReorderContent,
} from '@/lib/api/content';

export interface DirectoryLayoutProps {
    feature: string;
    initialDirId?: string;
    initialItemId?: string;
    children: (props: {
        currentDir:   string | null;
        selectedItem: ContentItem | null;
        visibleItems: ContentItem[];
        onSelectItem: (id: string) => void;
        onCreate:     (dirId: string) => Promise<void>;
        onUpdate:     (item: ContentItem, patch: { title?: string; summary?: string; body?: string }) => Promise<void>;
        onDelete:     (id: string) => Promise<void>;
        onReorder:    (dirId: string, orderedIds: string[]) => Promise<void>;
        onMove:       (id: string, newDirId: string) => Promise<void>;
        onOpenEdit:   (item: ContentItem) => void;
    }) => React.ReactNode;
}

export default function DirectoryLayout({ feature,    initialDirId,
                                            initialItemId, children }: DirectoryLayoutProps) {
    const [currentDir,    setCurrentDir]    = useState<string | null>(null);
    const [selectedItem,  setSelectedItem]  = useState<ContentItem | null>(null);
    const [reloadTreeFlag, setReloadTreeFlag] = useState(0);

    // 目录树增删改查
    const {
        tree,
        reload: reloadTree,
        addSubDir,
        renameDir,
        removeDir,
    } = useDirectories(feature);

    // 内容缓存
    const { cache, loadDir, mutateDir, clearCachedDir, allItems } = useContentCache(feature);

    // 当前目录下可见 items
    const visibleItems = currentDir ? (cache[currentDir] ?? []) : [];

    // 切目录时初次加载
    useEffect(() => {
        if (currentDir && !cache[currentDir]) {
            loadDir(currentDir, true).catch(console.error);
        }
    }, [currentDir, cache, loadDir]);

    // 1) 初始时如果 URL 中带了 dir，就打开它
    useEffect(() => {
        if (initialDirId) {
            setCurrentDir(initialDirId);
        }
    }, [initialDirId]);

    // 2) 目录加载完后，如果带了 doc，就选中那条
    useEffect(() => {
        if (!initialItemId || !currentDir) return;

        // 如果缓存里已经有
        const cached = cache[currentDir]?.find(i => i.id === initialItemId);
        if (cached) {
            setSelectedItem(cached);
        } else {
            // 否则强制加载一遍目录，或者单独拉取该文档
            loadDir(currentDir, true)
                .then(() => {
                    const found = cache[currentDir]?.find(i => i.id === initialItemId);
                    if (found) setSelectedItem(found);
                })
                .catch(console.error);
        }
    }, [initialItemId, currentDir, cache, loadDir]);

    // 新建 / 编辑 弹框
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem,  setEditingItem]  = useState<ContentItem | null>(null);

    const openCreate = useCallback((dirId: string) => {
        setEditingItem(null);
        setCurrentDir(dirId);
        // 延迟一下，保证 currentDir 更新后再显示
        setTimeout(() => setModalVisible(true), 0);
    }, []);

    const openEdit = useCallback((item: ContentItem) => {
        setEditingItem(item);
        setModalVisible(true);
    }, []);

    const closeModal = () => {
        setModalVisible(false);
        setEditingItem(null);
    };

    const handleModalSubmit = async (data: { title: string; summary?: string; body?: string }) => {
        if (!currentDir) return;
        try {
            if (editingItem) {
                await updateContent(feature, { id: editingItem.id, ...data });
                mutateDir(currentDir, list =>
                    list.map(i => i.id === editingItem.id ? { ...i, ...data } : i)
                );
            } else {
                const created = await createContent(feature, { directoryId: currentDir, ...data });
                mutateDir(currentDir, list => [...list, created]);
            }
            await loadDir(currentDir, true);
        } catch (e: any) {
            alert(`保存失败：${e.message}`);
        } finally {
            closeModal();
        }
    };

    // -------------------------
    // 传给子组件的回调们
    // -------------------------

    const onCreate = useCallback(async (dirId: string) => {
        openCreate(dirId);
    }, [openCreate]);

    const onUpdate = useCallback(async (item: ContentItem, patch: any) => {
        await updateContent(feature, { id: item.id, ...patch });
        if (currentDir) {
            mutateDir(currentDir, list =>
                list.map(i => i.id === item.id ? { ...i, ...patch } : i)
            );
            await loadDir(currentDir, true);
        }
    }, [feature, currentDir, mutateDir, loadDir]);

    const onDelete = useCallback(async (id: string) => {
        if (!window.confirm('确认要删除此内容？')) return;
        await deleteContent(feature, id);
        if (currentDir) {
            mutateDir(currentDir, list => list.filter(i => i.id !== id));
            await loadDir(currentDir, true);
        }
        if (selectedItem?.id === id) setSelectedItem(null);
    }, [feature, currentDir, mutateDir, loadDir, selectedItem]);

    const onReorder = useCallback(async (dirId: string, orderedIds: string[]) => {
        await reorderContent(feature, dirId, orderedIds);
        clearCachedDir(dirId);
        await loadDir(dirId, true);
    }, [feature, clearCachedDir, loadDir]);

    const onMove = useCallback(async (id: string, newDirId: string) => {
        const oldDir = allItems.find(i => i.id === id)?.directoryId;
        await moveAndReorderContent(feature, id, newDirId);
        if (oldDir) {
            clearCachedDir(oldDir);
            await loadDir(oldDir, true);
        }
        clearCachedDir(newDirId);
        await loadDir(newDirId, true);
    }, [feature, allItems, clearCachedDir, loadDir]);

    const reloadDirs = useCallback(() => {
        reloadTree();
        setReloadTreeFlag(v => v + 1);
    }, [reloadTree]);

    // -------------------------
    // 渲染
    // -------------------------

    return (
        <div className="flex h-screen">
            <DirectoryManager
                key={reloadTreeFlag}
                feature={feature}
                items={allItems}
                selectedDirId={currentDir}
                selectedItemId={selectedItem?.id ?? null}

                onSelectDir={dirId => {
                    setCurrentDir(dirId);
                    setSelectedItem(null);
                }}
                onSelectItem={id => {
                    setSelectedItem(allItems.find(i => i.id === id) ?? null);
                }}

                onCreateContent={openCreate}
                onDeleteItem={onDelete}
                onMoveItem={onMove}
                onReorderFile={onReorder}

                reloadDirs={reloadDirs}
                tree={tree}
                addSubDir={addSubDir}
                renameDir={renameDir}
                removeDir={removeDir}
            />

            <main className="flex-1 bg-white overflow-auto p-4">
                {children({
                    currentDir,
                    selectedItem,
                    visibleItems,
                    onSelectItem: id => setSelectedItem(visibleItems.find(i => i.id === id) ?? null),
                    onCreate,
                    onUpdate,
                    onDelete,
                    onReorder,
                    onMove,
                    onOpenEdit: openEdit,
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
                onCancel={closeModal}
                onSubmit={handleModalSubmit}
            />
        </div>
    );
}