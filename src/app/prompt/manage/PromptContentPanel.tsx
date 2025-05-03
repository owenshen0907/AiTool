'use client';

import React, { useState, useEffect } from 'react';
import ExperiencePanel from './PromptContent/ExperiencePanel';
import OptimizePanel from './PromptContent/Optimize/OptimizePanel';
import PromptMetaEditor from './PromptContent/PromptMetaEditor';
import { updatePrompt } from '@/lib/api/prompt';
import { MoreVertical } from 'lucide-react';

export interface PromptContentPanelProps {
    /** Prompt 的唯一标识 */
    promptId: string;
    /** 父目录的 ID，如果顶层则为 null */
    parentId: string | null;
    /** 初始标题 */
    promptTitle: string;
    /** 系统 Prompt 初始内容 */
    initialPrompt: string;
    /** 初始标签列表 */
    tags: string[];
    /** 初始描述 */
    description: string;
    onPromptUpdated: () => void;
}

export default function PromptContentPanel({
                                               promptId,
                                               parentId,
                                               promptTitle: initialTitle,
                                               initialPrompt,
                                               tags: initialTags,
                                               description: initialDesc,
                                               onPromptUpdated
                                           }: PromptContentPanelProps) {
    const [mode, setMode] = useState<'exp' | 'opt'>('exp');

    // 元数据状态
    const [title, setTitle] = useState(initialTitle);
    const [desc, setDesc] = useState(initialDesc);
    const [tags, setTags] = useState(initialTags);

    // 当切换不同 Prompt 时，同步更新本地 meta 状态
    useEffect(() => {
        setTitle(initialTitle);
        setDesc(initialDesc);
        setTags(initialTags);
    }, [initialTitle, initialDesc, initialTags]);

    // 弹框控制
    const [metaOpen, setMetaOpen] = useState(false);

    // 保存元数据回调
    const handleMetaSave = async (data: { title: string; description: string; tags: string[] }) => {
        const updated = await updatePrompt({
            id: promptId,
            title: data.title,
            description: data.description,
            tags: data.tags,
        });
        setTitle(updated.title);
        setDesc(updated.description);
        setTags(updated.tags);
        setMetaOpen(false);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header: 标题/描述/标签 + 编辑按钮 */}
            <div className="px-4 py-3 border-b bg-white flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">{title}</h2>
                    {desc && <p className="text-sm text-gray-600 mt-1">{desc}</p>}
                    {tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {tags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 text-xs bg-gray-200 rounded">
                  {tag}
                </span>
                            ))}
                        </div>
                    )}
                </div>
                <button onClick={() => setMetaOpen(true)}>
                    <MoreVertical size={20} />
                </button>
            </div>

            {/* 元数据编辑弹框 */}
            <PromptMetaEditor
                isOpen={metaOpen}
                title={title}
                description={desc}
                tags={tags}
                onClose={() => setMetaOpen(false)}
                onSave={handleMetaSave}
            />

            {/* 模式切换 */}
            <div className="flex items-center mb-4 space-x-2 px-4 pt-4">
                <button
                    className={`px-4 py-1 rounded ${mode === 'exp' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
                    onClick={() => setMode('exp')}
                >
                    体验模式
                </button>
                <button
                    className={`px-4 py-1 rounded ${mode === 'opt' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
                    onClick={() => setMode('opt')}
                >
                    优化模式
                </button>
            </div>

            {/* 内容面板 */}
            <div className="flex-1 overflow-auto">
                {mode === 'exp' ? (
                    <ExperiencePanel
                        promptId={promptId}
                        initialPrompt={initialPrompt}
                        onPromptUpdated={onPromptUpdated}
                    />
                ) : (
                    <OptimizePanel
                        promptId={promptId}
                        initialPrompt={initialPrompt}
                        onPromptUpdated={onPromptUpdated}
                    />
                )}
            </div>
        </div>
    );
}
