// File: src/app/docs/japanese/page.tsx

'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import DirectoryLayout from '@/components/directory/DirectoryLayout';
import JapaneseContentPanel from './JapaneseContentPanel';
import type { ContentItem } from '@/lib/models/content';

export default function JapaneseDocsPage() {
    const feature = 'japanese';
    // 读取 URL 上的 dir 和 doc 参数
    const params = useSearchParams();
    const dirId = params?.get('dir') ?? undefined;
    const docId = params?.get('doc') ?? undefined;

    return (
        <DirectoryLayout
            feature={feature}
            initialDirId={dirId}
            initialItemId={docId}
        >
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