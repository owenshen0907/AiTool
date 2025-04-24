'use client';
import React, { useState, useEffect } from 'react';
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

    // 首次加载根目录
    useEffect(() => {
        fetchPrompts()
            .then(list => {
                setNodes(list);
                // 默认选中第一个真正的 Prompt
                const firstPrompt = list.find(i => i.type === 'prompt');
                if (firstPrompt) setSelected(firstPrompt as PromptItem);
            })
            .catch(console.error);
    }, []);

    const handleSelect = async (node: PromptNode) => {
        if (node.type === 'dir') {
            // 目录：展开子节点 & 读列表
            const children = await fetchPrompts(node.id);
            setNodes(prev => [
                ...prev.filter(p => p.parentId !== node.id),
                ...children,
            ]);
            setSelected(null);
        } else {
            // Prompt：读详情
            try {
                const full = await fetchPromptById(node.id);
                setSelected(full);
            } catch (e) {
                console.error('fetchPromptById 失败，fallback raw node', e);
                setSelected(node as PromptItem);
            }
        }
    };

    const handleSave = (content: string) => {
        if (!selected) return;
        updatePrompt({ id: selected.id, content })
            .then(updated => setSelected(updated))
            .catch(console.error);
    };

    const handleSmartSave = (content: string, suggestion?: string) => {
        if (!selected) return;
        updatePrompt({ id: selected.id, content, comments: suggestion ? [suggestion] : [] })
            .then(updated => setSelected(updated))
            .catch(console.error);
    };

    const handleAdopt = (optimized: string) => {
        if (!selected) return;
        updatePrompt({ id: selected.id, content: optimized })
            .then(updated => setSelected(updated))
            .catch(console.error);
    };

    const handleNewDir = (parent: PromptNode | null) => {
        const title = prompt('请输入新目录名称');
        if (!title) return;
        createPrompt({ parent_id: parent?.id, type: 'dir', title, tags: [] })
            .then(created => setNodes(prev => [...prev, created]))
            .catch(console.error);
    };

    const handleCreatePrompt = (parent: PromptNode | null) => {
        const title = prompt('请输入新 Prompt 标题');
        if (!title) return;
        createPrompt({
            parent_id: parent?.id,
            type: 'prompt',
            title,
            content: '',
            description: '',
            tags: [],
            attributes: [],
        })
            .then(created => {
                setNodes(prev => [...prev, created]);
                setSelected(created);
            })
            .catch(console.error);
    };

    const handleDelete = (node: PromptNode) => {
        if (!confirm(`确认删除 "${node.title}" 吗？`)) return;
        apiDeletePrompt(node.id)
            .then(() => {
                setNodes(prev => prev.filter(p => p.id !== node.id));
                if (selected?.id === node.id) setSelected(null);
            })
            .catch(console.error);
    };

    const handleReorder = (srcId: string, dstId: string) => {
        setNodes(prev => {
            const arr = [...prev];
            const i = arr.findIndex(p => p.id === srcId);
            const j = arr.findIndex(p => p.id === dstId);
            if (i === -1 || j === -1) return prev;
            const [m] = arr.splice(i, 1);
            arr.splice(j, 0, m);
            return arr;
        });
    };

    return (
        <div className="flex flex-col h-[90vh] bg-gray-100">
            {/* 面包屑 ... */}
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
                    {selected && (
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