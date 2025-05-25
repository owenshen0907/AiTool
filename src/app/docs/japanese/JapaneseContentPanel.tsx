// File: src/app/docs/japanese/JapaneseContentPanel.tsx
'use client';

import React, { useState } from 'react';
import type { ContentItem } from '@/lib/models/content';
import JapaneseContentLeft from './JapaneseContentLeft';
import JapaneseContentRight from './JapaneseContentRight';

interface Props {
    feature: string;
    selectedItem: ContentItem | null;
    onUpdateItem: (item: ContentItem, patch: Partial<ContentItem>) => void;
}

export default function JapaneseContentPanel({
                                                 feature,
                                                 selectedItem,
                                                 onUpdateItem,
                                             }: Props) {
    // 前端预览 body
    const [previewBody, setPreviewBody] = useState<string | null>(null);

    // 当右侧流式或一次性生成时调用
    const handlePreview = (body: string) => {
        console.log('[JapaneseContentPanel] previewBody set to:', body);
        setPreviewBody(body);
    };

    return (
        <div className="flex h-screen">
            <JapaneseContentLeft
                selectedItem={selectedItem}
                previewBody={previewBody}    // 传给左侧
                onUpdateItem={onUpdateItem}
            />
            <JapaneseContentRight
                feature={feature}
                selectedItem={selectedItem}
                onPreviewItem={handlePreview}  // 接收右侧流式输出
                onUpdateItem={onUpdateItem}
            />
        </div>
    );
}