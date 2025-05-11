// File: app/prompt/case/CaseContentPanel.tsx
'use client';
import React, { useState } from 'react';
import type { ContentItem } from '@/lib/models/content';
import LeftTopPanel       from './content/LeftTopPanel';
import LeftBottomTable    from './content/LeftBottomTable';
import PromptPanel        from './content/PromptPanel';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
    items: ContentItem[];                      // 可不传也行，这里保留为了将来扩展
    selectedItem: ContentItem | null;
    onSelectItem: (id: string) => void;        // 选目录时重置当前选中 Content
    onCreateItem: () => void;                  // 新建 Content
    onUpdateItem: (item: ContentItem, patch: Partial<ContentItem>) => void;
    onDeleteItem: (id: string) => void;
    onReorderItems: (orderedIds: string[]) => void;
}

export default function CaseContentPanel({
                                             items,
                                             selectedItem,
                                             onSelectItem,
                                             onCreateItem,
                                             onUpdateItem,
                                             onDeleteItem,
                                             onReorderItems,
                                         }: Props) {
    const contentId = selectedItem?.id ?? '';

    // Prompt 文本
    const [prompt, setPrompt] = useState(`{
  "task": "翻译并润色文本",
  "constraints": ["保持原文含义", "自然流畅"]
}`);

    // 收缩状态
    const [rightCollapsed, setRightCollapsed] = useState(false);
    const [topCollapsed, setTopCollapsed]     = useState(false);

    return (
        <div className="flex h-screen overflow-hidden">

            {/* 左侧 3/4 区域 */}
            <div className="flex flex-col flex-1 h-full border-r">

                {/* 上方标题 & 概述 区 */}
                <div
                    className={`
            relative flex items-center 
            ${topCollapsed ? 'h-8' : 'h-1/6'} 
            border-b overflow-hidden transition-all duration-200
          `}
                >
                    {/* 折叠按钮 */}
                    <button
                        onClick={() => setTopCollapsed(tc => !tc)}
                        className="absolute top-1 right-2 p-1 hover:bg-gray-200 rounded"
                        title={topCollapsed ? '展开' : '收起'}
                    >
                        {topCollapsed ? <ChevronDown size={16}/> : <ChevronUp size={16}/>}
                    </button>

                    {/* 正常内容 */}
                    {!topCollapsed && (
                        <LeftTopPanel
                            item={selectedItem}
                            onSave={patch =>
                                selectedItem && onUpdateItem(selectedItem, patch)
                            }
                        />
                    )}
                </div>

                {/* 下方 Case 列表 + 测试 区 */}
                <div className="flex-1 overflow-hidden">
                    <LeftBottomTable
                        contentId={contentId}
                        prompt={prompt}
                    />
                </div>
            </div>

            {/* 右侧 Prompt 编辑 区 */}
            <div
                className={`
          relative flex flex-col 
          ${rightCollapsed ? 'w-8' : 'w-1/4'} 
          h-full bg-white overflow-hidden transition-all duration-200
        `}
            >
                {/* 折叠按钮 */}
                <button
                    onClick={() => setRightCollapsed(rc => !rc)}
                    className="absolute top-2 left-2 p-1 hover:bg-gray-200 rounded"
                    title={rightCollapsed ? '展开 Prompt' : '收起 Prompt'}
                >
                    {rightCollapsed ? <ChevronLeft size={16}/>
                        : <ChevronRight size={16}/>}
                </button>

                {/* Prompt 编辑区域 */}
                {!rightCollapsed && (
                    <PromptPanel
                        prompt={prompt}
                        onChange={setPrompt}
                    />
                )}
            </div>
        </div>
    );
}