// File: src/app/agent/image/left/cards/CardView.tsx
'use client';

import React from 'react';
import { CardPromptBlock } from './CardPromptBlock';
import { CardImagePanel } from './CardImagePanel';
import { useImageGenerate } from '../hooks/useImageGenerate';
import type { ContentItem } from '@/lib/models/content';
import type { AgentSceneConfig } from 'src/hooks/useAgentScenes';

interface CardViewProps {
    data: {
        id: string;
        title?: string;
        description?: string;
        prompt?: string;
        text?: string | string[];
    };
    selectedItem: ContentItem;
    onUpdateItem: (item: ContentItem, patch: Partial<ContentItem>) => void;
    /** 从上层 ContentLeft 传入的 img_generate 场景配置 */
    imgGenerateScene?: AgentSceneConfig;
}

export default function CardView({
                                     data,
                                     selectedItem,
                                     onUpdateItem,
                                     imgGenerateScene,
                                 }: CardViewProps) {
    const { title, description, prompt, text } = data;

    // 把 prompt 和 imgGenerateScene 一起传给 hook
    const { images, callId, loading, error, create, refine } = useImageGenerate(
        prompt,
        imgGenerateScene
    );

    // 下载图片（base64 补全 data URI）
    const handleDownload = (idx: number) => {
        if (!images[idx]) return;
        const a = document.createElement('a');
        a.download = `${title || 'image'}-${idx + 1}.png`;
        a.href = `data:image/png;base64,${images[idx]}`;
        a.click();
    };

    // 插入到正文末尾
    const insertIntoBody = (idx: number) => {
        if (!selectedItem || !images[idx]) return;
        const md = `\n\n![${title || 'image'}-${idx + 1}](data:image/png;base64,${images[idx]})\n`;
        onUpdateItem(selectedItem, { body: (selectedItem.body || '') + md });
    };

    return (
        <div className="border rounded-lg bg-white shadow-sm flex p-4">
            <div className="flex-1 pr-4 space-y-2">
                <h3 className="font-semibold text-sm">{title || '（无标题）'}</h3>
                <CardPromptBlock prompt={prompt} description={description} text={text} />
            </div>
            <CardImagePanel
                images={images}
                loading={loading}
                callId={callId}
                onGenerate={create}
                onRefine={refine}
                onDownload={handleDownload}
                onInsert={insertIntoBody}
                canGenerate={!!prompt}
                canRefine={!!callId}
                title={title}
                error={error}
            />
        </div>
    );
}