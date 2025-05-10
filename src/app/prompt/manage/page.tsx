// app/prompt/manage/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { PromptNode, PromptItem } from '@/lib/models/prompt/prompt';
import {
    fetchPrompts,
    fetchPromptById,
    createPrompt,
    updatePrompt,
    deletePrompt as apiDeletePrompt,
    reorderPrompts,
    searchPromptsByTitle,
} from '@/lib/api/prompt';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PromptLeftPanel from './PromptLeftPanel';
import PromptContentPanel from './PromptContentPanel';
import PromptRightPanel from './PromptRightPanel';

export default function PromptManagePage() {
    const [nodes, setNodes] = useState<PromptNode[]>([]);
    const [searchResults, setSearchResults] = useState<PromptNode[] | null>(null);
    const [nodesLoading, setNodesLoading] = useState(false);
    const [selected, setSelected] = useState<PromptItem | null>(null);
    const [selectedLoading, setSelectedLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [collapsed, setCollapsed] = useState(false);
    const [currentParentId, setCurrentParentId] = useState<string | null>(null);

    // 加载并展示 Prompt 详情
    const loadSelected = useCallback(async (id: string) => {
        setSelectedLoading(true);
        try {
            const full = await fetchPromptById(id);
            setSelected(full);
        } finally {
            setSelectedLoading(false);
        }
    }, []);

    // 首次加载根目录
    useEffect(() => {
        const init = async () => {
            setNodesLoading(true);
            setError(null);
            try {
                const list = await fetchPrompts();
                setNodes(list);
                setCurrentParentId(null);
                const first = list.find(n => n.type === 'prompt');
                if (first) await loadSelected(first.id);
            } catch {
                setError('加载提示列表失败');
            } finally {
                setNodesLoading(false);
            }
        };
        init();
    }, [loadSelected]);

    // 点击目录或 Prompt
    const handleSelect = useCallback(
        async (node: PromptNode) => {
            // 退出搜索模式
            setSearchResults(null);

            if (node.type === 'dir') {
                setSelected(null);
                setCurrentParentId(node.id);
                try {
                    const children = await fetchPrompts(node.id);
                    setNodes(prev => {
                        const map = new Map(prev.map(n => [n.id, n]));
                        children.forEach(c => map.set(c.id, c));
                        return Array.from(map.values());
                    });
                } catch {
                    setError('加载子目录失败');
                }
            } else {
                await loadSelected(node.id);
            }
        },
        [loadSelected]
    );

    const handleNewDir = useCallback(async (parent: PromptNode | null) => {
        const title = prompt('请输入新目录名称')?.trim();
        if (!title) return;
        try {
            const created = await createPrompt({
                parent_id: parent?.id,
                type: 'dir',
                title,
                tags: [],
            });
            setNodes(prev => [...prev, created]);
        } catch {
            setError('创建目录失败');
        }
    }, []);

    const handleCreatePrompt = useCallback(async (parent: PromptNode | null) => {
        const title = prompt('请输入新 Prompt 标题')?.trim();
        if (!title) return;
        try {
            const created = await createPrompt({
                parent_id: parent?.id,
                type: 'prompt',
                title,
                content: '',
                description: '',
                tags: [],
                attributes: [],
            });
            setNodes(prev => [...prev, created]);
            setSelected(created);
        } catch {
            setError('创建 Prompt 失败');
        }
    }, []);

    const handleDelete = useCallback(
        async (node: PromptNode) => {
            if (!confirm(`确认删除 "${node.title}" 吗？`)) return;
            try {
                await apiDeletePrompt(node.id);
                setNodes(prev => prev.filter(p => p.id !== node.id));
                if (selected?.id === node.id) setSelected(null);
            } catch {
                setError('删除失败');
            }
        },
        [selected]
    );

    const handleRenameDir = useCallback(
        async (id: string, newTitle: string) => {
            await updatePrompt({ id, title: newTitle });
            setNodes(prev =>
                prev.map(n => (n.id === id ? { ...n, title: newTitle } : n))
            );
        },
        []
    );

    // 同级排序
    const handleReorder = useCallback(
        (srcId: string, dstId: string) => {
            setNodes(prev => {
                const arr = [...prev];
                const i = arr.findIndex(n => n.id === srcId);
                const j = arr.findIndex(n => n.id === dstId);
                if (i < 0 || j < 0) return prev;
                const [m] = arr.splice(i, 1);
                arr.splice(j, 0, m);
                reorderPrompts(currentParentId, arr.map(n => n.id)).catch(console.error);
                return arr;
            });
        },
        [currentParentId]
    );

    // 跨目录移动
    const handleMove = useCallback(
        async (srcId: string, newParentId: string) => {
            try {
                await updatePrompt({ id: srcId, parent_id: newParentId });
                setNodes(prev => prev.filter(n => n.id !== srcId));
                const children = await fetchPrompts(newParentId);
                setNodes(prev => {
                    const map = new Map(prev.map(n => [n.id, n]));
                    children.forEach(c => map.set(c.id, c));
                    return Array.from(map.values());
                });
            } catch {
                console.error('移动失败');
            }
        },
        []
    );

    // 回车触发后端搜索
    const handleSearch = useCallback(
        async (term: string) => {
            if (!term.trim()) {
                setSearchResults(null);
                return;
            }
            setNodesLoading(true);
            setError(null);
            try {
                const list = await searchPromptsByTitle(term);
                setNodes(prev => {
                    const map = new Map(prev.map(n => [n.id, n]));
                    list.forEach(n => map.set(n.id, n));
                    return Array.from(map.values());
                });
                setSearchResults(list);
                setCurrentParentId(null);
                setSelected(null);
            } catch {
                setError('搜索失败');
            } finally {
                setNodesLoading(false);
            }
        },
        []
    );

    if (nodesLoading) return <div className="p-4">加载中…</div>;
    if (error) return <div className="p-4 text-red-500">错误：{error}</div>;

    return (
        <div className="flex h-[90vh] bg-gray-100">
            <aside className={`transition-all duration-200 bg-white border-r ${collapsed ? 'w-0' : 'w-72'}`}>
                <PromptLeftPanel
                    nodes={nodes}
                    selectedId={selected?.id || null}
                    collapsed={collapsed}
                    onSelect={handleSelect}
                    onRenameDir={handleRenameDir}
                    onCreatePrompt={handleCreatePrompt}
                    onNewDir={handleNewDir}
                    onDelete={handleDelete}
                    onReorder={handleReorder}
                    onMove={handleMove}
                    searchResults={searchResults}
                    onSearch={handleSearch}
                />
            </aside>
            <div
                className="flex items-center justify-center bg-gray-200 hover:bg-gray-300 cursor-pointer transition-colors duration-200"
                style={{ width: 16 }}
                onClick={() => setCollapsed(c => !c)}
            >
                {collapsed ? <ChevronRight size={16}/> : <ChevronLeft size={16}/> }
            </div>
            <main className="flex-1 bg-white overflow-auto">
                {selectedLoading ? (
                    <div className="p-4 text-center">加载 Prompt…</div>
                ) : selected ? (
                    <PromptContentPanel
                        promptId={selected.id}
                        parentId={selected.parentId}
                        promptTitle={selected.title}
                        initialPrompt={selected.content}
                        tags={selected.tags}
                        description={selected.description}
                        onPromptUpdated={() => loadSelected(selected.id)}
                    />
                ) : (
                    <div className="p-4">请选择一个 Prompt</div>
                )}
            </main>
            <aside className="w-80 bg-white border-l">
                {selected && (
                    <PromptRightPanel
                        tags={selected.tags}
                        description={selected.description}
                        attributes={selected.attributes}
                        onEvaluate={() => {}}
                        onToggleLock={() => {}}
                    />
                )}
            </aside>
        </div>
    );
}