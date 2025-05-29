'use client';

import React from 'react';
import DirectoryLayout from '@/components/directory/DirectoryLayout';
import JapaneseContentPanel from './JapaneseContentPanel';
import type { ContentItem } from '@/lib/models/content';

export default function JapaneseDocsPage() {
    const feature = 'japanese';

    return (
        <DirectoryLayout feature={feature}>
            {({
                  currentDir,
                  visibleItems,
                  selectedItem,
                  onSelectItem,
                  onUpdate: onUpdateItem,
                  onReorder,
              }) => {
                const handleSaveOrder = async (orderedItems: ContentItem[]) => {
                    if (!currentDir) return;
                    const ids = orderedItems.map(i => i.id);
                    await onReorder(currentDir, ids);
                    alert('排序已保存');
                };

                return (
                    <JapaneseContentPanel
                        feature={feature}
                        visibleItems={visibleItems}
                        selectedItem={selectedItem}
                        onSelectItem={onSelectItem}
                        onUpdateItem={onUpdateItem}
                        // onSaveOrder={handleSaveOrder}
                    />
                );
            }}
        </DirectoryLayout>
    );
}