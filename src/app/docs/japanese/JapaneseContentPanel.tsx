// File: src/app/docs/japanese/JapaneseContentPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import type { ContentItem } from '@/lib/models/content';
import JapaneseContentLeft from './JapaneseContentLeft';
import JapaneseContentRight from './JapaneseContentRight';
import DirectoryInfoView from './DirectoryInfoView';

interface Props {
    feature: string;
    visibleItems: ContentItem[];
    selectedItem: ContentItem | null;
    onSelectItem: (id: string) => void;
    onUpdateItem: (item: ContentItem, patch: Partial<ContentItem>) => Promise<void>;
    // onSaveOrder: (orderedItems: ContentItem[]) => Promise<void>;
}

export default function JapaneseContentPanel({
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
                <>
                    <JapaneseContentLeft
                        selectedItem={selectedItem}
                        body={body}
                        onChangeBody={setBody}
                        onUpdateItem={onUpdateItem}
                    />
                    <JapaneseContentRight
                        feature={feature}
                        formId={selectedItem.id}
                        selectedItem={selectedItem}
                        existingBody={body}
                        onChangeBody={setBody}
                    />
                </>
            ) : (
                <DirectoryInfoView
                    feature={feature}
                    items={visibleItems}
                    onSelectItem={onSelectItem}
                    onUpdateItem={onUpdateItem}
                    // onSaveOrder={onSaveOrder}
                />
            )}
        </div>
    );
}