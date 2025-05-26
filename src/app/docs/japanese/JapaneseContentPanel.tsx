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
    // 本地预览 state
    const [previewBody, setPreviewBody] = useState<string | null>(null);

    // 流式/生成回调
    const handlePreview = (body: string) => {
        setPreviewBody(body);
    };

    return (
        <div className="flex h-screen">
            <JapaneseContentLeft
                selectedItem={selectedItem}
                previewBody={previewBody}
                onUpdateItem={onUpdateItem}
            />
            <JapaneseContentRight
                feature={feature}
                formId={selectedItem?.id ?? ''}
                selectedItem={selectedItem}
                onPreviewItem={handlePreview}
            />
        </div>
    );
}