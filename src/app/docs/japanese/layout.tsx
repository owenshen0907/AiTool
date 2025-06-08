// File: src/app/docs/japanese/layout.tsx
'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import DirectoryLayout from '@/components/directory/DirectoryLayout';
import JapaneseContentPanel from './JapaneseContentPanel';

export default function JapaneseDocsLayout() {
    // 读取 URL 上的 dir 和 doc 参数
    const params = useSearchParams();
    const dirId = params?.get('dir') ?? undefined;
    const docId = params?.get('doc') ?? undefined;

    return (
        <DirectoryLayout
            feature="japanese"
            initialDirId={dirId}
            initialItemId={docId}
        >
            {({ currentDir, visibleItems, selectedItem, onSelectItem, onUpdate: onUpdateItem }) => (
                <div className="h-full overflow-auto p-4">
                    <JapaneseContentPanel
                        feature="japanese"
                        visibleItems={visibleItems}
                        selectedItem={selectedItem}
                        onSelectItem={onSelectItem}
                        onUpdateItem={onUpdateItem}
                    />
                </div>
            )}
        </DirectoryLayout>
    );
}