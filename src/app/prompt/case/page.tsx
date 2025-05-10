'use client';

import React, { useState, useCallback, useEffect } from 'react';
import DirectoryManager   from '../../components/DirectoryManager';
import ContentModal       from '../../components/CreateContentModal';
import CaseContentPanel   from './CaseContentPanel';
import type { ContentItem } from '@/lib/models/content';

import {
    createContent,
    updateContent,
    deleteContent,
    reorderContent,
} from '@/lib/api/content';

import { useContentCache } from '@/hooks/useContentCache';

export default function CaseManagePage() {
    /* —— 功能区 —— */
    const feature = 'case';

    /* —— 当前目录 & 选中项 —— */
    const [currentDir,   setCurrentDir]   = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

    /* —— 懒加载缓存 —— */
    const { loadDir, mutateDir, allItems } = useContentCache(feature);

    /* —— 当前目录下可见内容 —— */
    const [visibleItems, setVisibleItems] = useState<ContentItem[]>([]);
    useEffect(() => {
        if (!currentDir) { setVisibleItems([]); return; }
        loadDir(currentDir).then(setVisibleItems);
    }, [currentDir, loadDir]);

    /* ---------- 弹框 ---------- */
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem , setEditingItem ] = useState<ContentItem | null>(null);

    const openCreate = (dirId: string) => {
        setCurrentDir(dirId);
        setEditingItem(null);
        setModalVisible(true);
    };

    const openEdit = (item: ContentItem) => {
        setEditingItem(item);
        setModalVisible(true);
    };

    const handleModalSubmit = async (
        data: { title:string; summary?:string; body?:string }
    ) => {
        if (!currentDir) return;

        if (editingItem) {
            /* 更新 */
            await updateContent(feature, {
                id          : editingItem.id,
                directoryId : currentDir,
                title       : data.title,
                summary     : data.summary,
                body        : data.body,
            });

            mutateDir(currentDir, list =>
                list.map(i => i.id === editingItem.id ? { ...i, ...data } : i)
            );
        } else {
            /* 新建 */
            const created = await createContent(feature, {
                directoryId : currentDir,
                title       : data.title,
                summary     : data.summary,
                body        : data.body,
            });
            mutateDir(currentDir, list => [...list, created]);
        }

        setModalVisible(false);
    };

    /* ---------- 删除 & 排序 ---------- */
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

    /* ---------- 渲染 ---------- */
    return (
        <div className="flex h-screen">
            {/* 侧栏 */}
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

            {/* 内容区 */}
            <main className="flex-1 bg-white overflow-auto">
                <CaseContentPanel
                    items={visibleItems}
                    selectedItem={selectedItem}
                    onSelectItem={id => setSelectedItem(visibleItems.find(i => i.id === id) ?? null)}
                    onCreateItem={() => currentDir && openCreate(currentDir)}
                    onEditItem={openEdit}
                    onDeleteItem={deleteItem}
                    onReorderItems={reorder}
                />
            </main>

            {/* 弹框 */}
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