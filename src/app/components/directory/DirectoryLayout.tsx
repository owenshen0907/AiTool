'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DirectoryManager from './DirectoryManager';
import ContentModal from './CreateContentModal';

import type { ContentItem } from '@/lib/models/content';
import { useContentCache } from '@/hooks/useContentCache';
import { useDirectories } from './useDirectories';
import {
    createContent,
    updateContent,
    deleteContent,
    reorderContent,
    moveAndReorderContent,
} from '@/lib/api/content';

export interface DirectoryLayoutProps {
    feature: string;
    children: (props: {
        currentDir: string | null;
        selectedItem: ContentItem | null;
        visibleItems: ContentItem[];
        onSelectItem: (id: string) => void;
        onCreateItem: (data: { title: string; summary?: string; body?: string }) => Promise<void>;
        onUpdateItem: (item: ContentItem, patch: { title?: string; summary?: string; body?: string }) => Promise<void>;
        onUpdate: (item: ContentItem, patch: { title?: string; summary?: string; body?: string }) => Promise<void>;
        onDeleteItem: (id: string) => Promise<void>;
        onReorderFile: (dirId: string, orderedIds: string[]) => Promise<void>;
        onMoveItem: (id: string, newDirId: string) => Promise<void>;
        onOpenEdit: (item: ContentItem) => void;
    }) => React.ReactNode;
}

export default function DirectoryLayout({ feature, children }: DirectoryLayoutProps) {
    const [currentDir, setCurrentDir] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
    const [reloadTreeFlag, setReloadTreeFlag] = useState(0);
    const {
        tree,
        reload: reloadTree,
        addSubDir,
        renameDir,
        removeDir,
    } = useDirectories(feature);
    const [autoExpandDirs, setAutoExpandDirs] = useState<string[]>([]);

    // 内容缓存
    const { loadDir, mutateDir, clearCachedDir, allItems, cache } = useContentCache(feature);

    // 当前目录下可见内容
    const visibleItems: ContentItem[] = currentDir ? (cache[currentDir] ?? []) : [];

    // Modal 状态
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<ContentItem | null>(null);

    // 切目录时自动加载（只加载一次）
    useEffect(() => {
        if (currentDir && !cache[currentDir]) {
            loadDir(currentDir, true).catch(console.error);
        }
    }, [currentDir, cache, loadDir]);

    // Modal 打开新建
    const openCreate = (dirId: string) => {
        setEditingItem(null);
        setCurrentDir(dirId);
        setTimeout(() => setModalVisible(true), 0); // 防止弹框刚切目录时状态没同步
    };

    // Modal 打开编辑
    const openEdit = (item: ContentItem) => {
        setEditingItem(item);
        setModalVisible(true);
    };

    // Modal 关闭
    const closeModal = () => {
        setModalVisible(false);
        setEditingItem(null);
    };

    // Modal 提交（新建/编辑）
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
            await loadDir(currentDir, true); // 强制刷新（保证后端顺序和位置等字段都最新）
        } catch (e: any) {
            alert(`保存失败：${e.message}`);
        } finally {
            closeModal();
        }
    };

    // 行内新建
    const onCreateItem = useCallback(async (data: { title: string; summary?: string; body?: string }) => {
        if (!currentDir) return;
        const created = await createContent(feature, { directoryId: currentDir, ...data });
        mutateDir(currentDir, list => [...list, created]);
        await loadDir(currentDir, true);
    }, [feature, currentDir, mutateDir, loadDir]);

    // 行内更新
    const onUpdateItem = useCallback(async (item: ContentItem, patch: { title?: string; summary?: string; body?: string }) => {
        await updateContent(feature, { id: item.id, ...patch });
        if (currentDir) {
            mutateDir(currentDir, list =>
                list.map(i => i.id === item.id ? { ...i, ...patch } : i)
            );
            await loadDir(currentDir, true);
        }
    }, [feature, currentDir, mutateDir, loadDir]);

    // 删除
    const onDeleteItem = useCallback(async (id: string) => {
        if (!window.confirm('确认要删除此内容？')) return;
        await deleteContent(feature, id);
        if (currentDir) {
            mutateDir(currentDir, list => list.filter(i => i.id !== id));
            await loadDir(currentDir, true);
        }
        if (selectedItem?.id === id) setSelectedItem(null);
    }, [feature, currentDir, mutateDir, loadDir, selectedItem]);

    // 目录/内容区强制刷新
    const reloadDirs = useCallback(() => {
        reloadTree();
        setReloadTreeFlag(f => f + 1);
    }, [reloadTree]);

    // autoExpandDirs 控制后自动清空（可视化效果用）
    useEffect(() => {
        if (autoExpandDirs.length) {
            const timer = setTimeout(() => setAutoExpandDirs([]), 500);
            return () => clearTimeout(timer);
        }
    }, [autoExpandDirs]);

    // 移动/排序：刷新原目录与目标目录 + 展开
    const onMoveItem = async (id: string, newDirId: string) => {
        const oldDir = allItems.find(i => i.id === id)?.directoryId;
        await moveAndReorderContent(feature, id, newDirId);
        if (oldDir) await loadDir(oldDir, true);
        await loadDir(newDirId, true);
        setAutoExpandDirs([oldDir, newDirId].filter(Boolean) as string[]);
        reloadDirs();
        setSelectedItem(null);
    };

    const onReorderFile = async (dirId: string, orderedIds: string[]) => {
        await reorderContent(feature, dirId, orderedIds);
        await loadDir(dirId, true);
        setAutoExpandDirs([dirId]);
        reloadDirs();
        setSelectedItem(null);
    };

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
                onSelectItem={id =>
                    setSelectedItem(allItems.find(i => i.id === id) ?? null)
                }
                onCreateContent={openCreate}
                onDeleteItem={onDeleteItem}
                onMoveItem={onMoveItem}
                onReorderFile={onReorderFile}
                reloadDirs={reloadDirs}
                tree={tree}
                addSubDir={addSubDir}
                renameDir={renameDir}
                removeDir={removeDir}
                autoExpandDirs={autoExpandDirs}
            />

            <main className="flex-1 bg-white overflow-auto p-4">
                {children({
                    currentDir,
                    selectedItem,
                    visibleItems,
                    onSelectItem: id => setSelectedItem(visibleItems.find(i => i.id === id) ?? null),
                    onCreateItem,
                    onUpdateItem,
                    onUpdate: onUpdateItem,
                    onDeleteItem,
                    onReorderFile,
                    onMoveItem,
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