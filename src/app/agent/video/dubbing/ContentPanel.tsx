// File: src/app/video/dubbin/ContentPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import type { ContentItem } from '@/lib/models/content';
import DirectoryInfoView from './DirectoryInfoView';
import DubbinContent from './DubbinContent';

interface Props {
    feature: string;
    visibleItems: ContentItem[];
    selectedItem: ContentItem | null;
    onSelectItem: (id: string) => void;
    onUpdateItem: (item: ContentItem, patch: Partial<ContentItem>) => Promise<void>;
}

export default function ContentPanel({
                                                 feature,
                                                 visibleItems,
                                                 selectedItem,
                                                 onSelectItem,
                                                 onUpdateItem,
                                                 // onSaveOrder,
                                             }: Props) {
    const [body, setBody] = useState<string>(selectedItem?.body ?? '');

    useEffect(() => {
        setBody(selectedItem?.body ?? '');
    }, [selectedItem?.id]);

    return (
        <div className="flex h-screen">
            {selectedItem ? (
                <DubbinContent
                    selectedItem={selectedItem}
                    onUpdateItem={onUpdateItem}
                />
            ) : (
                <DirectoryInfoView
                    feature={feature}
                    items={visibleItems}
                    onSelectItem={onSelectItem}
                    onUpdateItem={onUpdateItem}
                />
            )}
        </div>
    );
}