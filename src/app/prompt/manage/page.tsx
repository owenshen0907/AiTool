// src/app/prompt/manage/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import PromptLeftPanel from './PromptLeftPanel';
import PromptContentPanel from './PromptContentPanel';
import PromptRightPanel from './PromptRightPanel';
import type { PromptNode, PromptItem } from '@/lib/models/prompt';
import {
    fetchPrompts,
    fetchPromptById,
    createPrompt,
    updatePrompt,
    deletePrompt as apiDeletePrompt,
} from '@/lib/api/prompt';

export default function PromptManagePage() {
    const [nodes, setNodes] = useState<PromptNode[]>([]);
    const [selected, setSelected] = useState<PromptItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            setError(null);
            try {
                const list = await fetchPrompts();
                setNodes(list);
                const first = list.find(i => i.type === 'prompt');
                if (first) {
                    try {
                        const full = await fetchPromptById(first.id);
                        setSelected(full);
                    } catch {
                        console.warn('fetchPromptById failed, using raw node');
                        setSelected(first as PromptItem);
                    }
                }
            } catch (e) {
                console.error(e);
                setError('加载提示列表失败');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const handleSelect = useCallback(async (node: PromptNode) => {
        if (node.type === 'dir') {
            try {
                const children = await fetchPrompts(node.id);
                setNodes(prev =>
                    [...prev.filter(p => p.parentId !== node.id), ...children]
                );
                setSelected(null);
            } catch (e) {
                console.error(e);
                setError('加载子节点失败');
            }
        } else {
            try {
                const full = await fetchPromptById(node.id);
                setSelected(full);
            } catch (e) {
                console.error(e);
                setSelected(node as PromptItem);
            }
        }
    }, []);

    const handleSave = useCallback(async (content: string) => {
        if (!selected) return;
        try {
            const updated = await updatePrompt({ id: selected.id, content });
            setSelected(updated);
        } catch (e) {
            console.error(e);
            setError('保存失败');
        }
    }, [selected]);

    const handleSmartSave = useCallback(async (content: string, suggestion?: string) => {
        if (!selected) return;
        try {
            const updated = await updatePrompt({
                id: selected.id,
                content,
                comments: suggestion ? [suggestion] : [],
            });
            setSelected(updated);
        } catch (e) {
            console.error(e);
            setError('智能保存失败');
        }
    }, [selected]);

    const handleAdopt = useCallback(async (optimized: string) => {
        if (!selected) return;
        try {
            const updated = await updatePrompt({ id: selected.id, content: optimized });
            setSelected(updated);
        } catch (e) {
            console.error(e);
            setError('采纳失败');
        }
    }, [selected]);

    const handleNewDir = useCallback(async (parent: PromptNode | null) => {
        const title = prompt('请输入新目录名称');
        if (!title) return;
        try {
            const created = await createPrompt({ parent_id: parent?.id, type: 'dir', title, tags: [] });
            setNodes(prev => [...prev, created]);
        } catch (e) {
            console.error(e);
            setError('创建目录失败');
        }
    }, []);

    const handleCreatePrompt = useCallback(async (parent: PromptNode | null) => {
        const title = prompt('请输入新 Prompt 标题');
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
        } catch (e) {
            console.error(e);
            setError('创建 Prompt 失败');
        }
    }, []);

    const handleDelete = useCallback(async (node: PromptNode) => {
        if (!confirm(`确认删除 "${node.title}" 吗？`)) return;
        try {
            await apiDeletePrompt(node.id);
            setNodes(prev => prev.filter(p => p.id !== node.id));
            if (selected?.id === node.id) setSelected(null);
        } catch (e) {
            console.error(e);
            setError('删除失败');
        }
    }, [selected]);

    const handleReorder = useCallback((srcId: string, dstId: string) => {
        setNodes(prev => {
            const arr = [...prev];
            const i = arr.findIndex(p => p.id === srcId);
            const j = arr.findIndex(p => p.id === dstId);
            if (i === -1 || j === -1) return prev;
            const [m] = arr.splice(i, 1);
            arr.splice(j, 0, m);
            return arr;
        });
    }, []);

    if (loading) return <div className="p-4">加载中...</div>;
    if (error) return <div className="p-4 text-red-500">错误：{error}</div>;

    return (
        <div className="flex flex-col h-[90vh] bg-gray-100">
            <div className="flex flex-1 overflow-hidden">
                <aside className="w-72 border-r bg-white">
                    <PromptLeftPanel
                        nodes={nodes}
                        selectedId={selected?.id || null}
                        onSelect={handleSelect}
                        onEdit={node => console.log('编辑', node)}
                        onCreatePrompt={handleCreatePrompt}
                        onNewDir={handleNewDir}
                        onDelete={handleDelete}
                        onReorder={handleReorder}
                    />
                </aside>
                <main className="flex-1 bg-white overflow-auto">
                    {!selected ? (
                        <div className="p-4">请选择一个 Prompt</div>
                    ) : (
                        <PromptContentPanel
                            promptId={selected.id}
                            parentId={selected.parentId}
                            promptTitle={selected.title}
                            initialPrompt={selected.content}
                            tags={selected.tags}
                            description={selected.description}
                            onSave={handleSave}
                            onSmartSave={handleSmartSave}
                            onAdopt={handleAdopt}
                            onExperienceRun={input => console.log('体验：', input)}
                        />
                    )}
                </main>
                <aside className="w-80 border-l bg-white">
                    {selected && (
                        <PromptRightPanel
                            tags={selected.tags}
                            description={selected.description}
                            attributes={selected.attributes}
                            onEvaluate={() => console.log('一键评估')}
                            onToggleLock={idx => console.log('toggle lock', idx)}
                        />
                    )}
                </aside>
            </div>
        </div>
    );
}
