// File: src/app/docs/japanese/JapaneseContentPanel.tsx
'use client';

import React from 'react';
import type { ContentItem } from '@/lib/models/content';
import JapaneseContentLeft from './JapaneseContentLeft';
import JapaneseContentRight from './JapaneseContentRight';

interface Props {
    selectedItem: ContentItem | null;
    onUpdateItem: (item: ContentItem, patch: Partial<ContentItem>) => void;
}

export default function JapaneseContentPanel({
                                                 selectedItem,
                                                 onUpdateItem,
                                             }: Props) {
    return (
        <div className="flex h-screen">
            <JapaneseContentLeft
                selectedItem={selectedItem}
                onUpdateItem={onUpdateItem}
            />
            <JapaneseContentRight />
        </div>
    );
}