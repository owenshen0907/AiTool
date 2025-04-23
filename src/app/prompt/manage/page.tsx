// app/prompt/manage/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import PromptLeftPanel, { PromptNode } from './PromptLeftPanel';
import PromptContentPanel from './PromptContentPanel';
import PromptRightPanel, { AttributeItem } from './PromptRightPanel';

interface PromptItem {
    id: string;
    title: string;
    content: string;
    tags: string[];
    description: string;
    attributes: AttributeItem[];
}

export default function PromptManagePage() {
    // 示例目录数据
    const sampleNodes: PromptNode[] = [
        { id: 'work', title: '工作', parentId: null },
        { id: 'study', title: '学习', parentId: null },
        { id: 'jp', title: '日语', parentId: 'study' },
        { id: 'ai', title: 'AI', parentId: 'study' },
        { id: 'travel', title: '旅行', parentId: null },
        { id: 'route', title: '路线', parentId: 'travel' },
        { id: 'video', title: '视频总结', parentId: 'route' },
    ];

    const [prompts, setPrompts] = useState<PromptItem[]>([]);
    const [selected, setSelected] = useState<PromptItem | null>(null);

    useEffect(() => {
        const dummy: PromptItem[] = [
            {
                id: 'work',
                title: '工作示例',
                content: '这是工作场景的 Prompt...',
                tags: ['工作'],
                description: '工作场景描述',
                attributes: [
                    { name: '角色定义', value: true, locked: false },
                    { name: '清晰度', value: false, suggestion: '请更明确地定义角色', locked: false },
                    { name: '正向示例', value: false, suggestion: '建议添加一个正向示例', locked: false },
                    { name: '反向示例', value: true, locked: false },
                    { name: '输出格式', value: true, locked: true },
                ],
            },
            {
                id: '1',
                title: '示例 Prompt A',
                content: '这是 Prompt A 的内容...',
                tags: ['示例'],
                description: '示例描述',
                attributes: [
                    { name: '清晰度', value: true, locked: false },
                    { name: '相关性', value: false, suggestion: '增强与上下文的关联', locked: false },
                    { name: '格式化程度', value: true, locked: true },
                    { name: '示例多样性', value: false, suggestion: '添加更多示例', locked: false },
                ],
            },
        ];
        setPrompts(dummy);
        setSelected(dummy[0]);
    }, []);

    const handleDirSelect = (node: PromptNode) => {
        setSelected(prompts.find(p => p.id === node.id) || null);
    };

    const handleSave = (content: string) => {
        // TODO: 保存逻辑
    };
    const handleSmartSave = (content: string, suggestion?: string) => {
        // TODO: 智能保存逻辑
    };
    const handleAdopt = (optimized: string) => {
        // TODO: 采纳逻辑
    };
    const handleExperience = (input: string) => {
        // TODO: 体验逻辑
    };
    const handleNewDir = (parent: PromptNode | null) => {
        // TODO: 新建目录
    };
    const handleEditDir = (node: PromptNode) => {
        // TODO: 编辑目录
    };
    const handleReorder = (src: string, dst: string) => {
        // TODO: 排序逻辑
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* 面包屑导航 */}
            <nav aria-label="breadcrumb" className="bg-white px-4 py-2 shadow-sm text-sm text-gray-700">
                <ol className="flex items-center space-x-1">
                    <li><a href="/" className="hover:underline">首页</a></li>
                    <li><span className="text-gray-400">/</span></li>
                    <li><a href="/prompt" className="hover:underline">Prompt</a></li>
                    <li><span className="text-gray-400">/</span></li>
                    <li className="font-medium">管理</li>
                </ol>
            </nav>

            {/* 主体区（左右中） */}
            <div className="flex flex-1 overflow-hidden">
                {/* 左侧目录面板 */}
                <aside className="w-72 bg-white border-r border-gray-200 shadow-sm overflow-auto h-full">
                    <PromptLeftPanel
                        nodes={sampleNodes}
                        selectedId={selected?.id || null}
                        onSelect={handleDirSelect}
                        onNewDir={handleNewDir}
                        onEdit={handleEditDir}
                        onReorder={handleReorder}
                    />
                </aside>

                {/* 中间内容面板 */}
                <main className="flex-1 bg-white overflow-auto h-full">
                    <PromptContentPanel
                        initialPrompt={selected?.content || ''}
                        tags={selected?.tags || []}
                        description={selected?.description || ''}
                        onSave={handleSave}
                        onSmartSave={handleSmartSave}
                        onAdopt={handleAdopt}
                        onExperienceRun={handleExperience}
                    />
                </main>

                {/* 右侧评估面板 */}
                <aside className="w-80 bg-white border-l border-gray-200 shadow-sm overflow-auto h-full">
                    <PromptRightPanel
                        tags={selected?.tags || []}
                        description={selected?.description || ''}
                        attributes={selected?.attributes || []}
                        onEvaluate={() => {
                            // TODO: 评估逻辑
                        }}
                        onToggleLock={(idx) => {
                            // TODO: 锁定切换
                        }}
                    />
                </aside>
            </div>
        </div>
    );
}
