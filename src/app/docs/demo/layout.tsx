// File: src/app/docs/demo/layout.tsx
'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import DirectoryLayout from '@/components/directory/DirectoryLayout';
import ContentPanel from './ContentPanel';

export default function demoPageLayout() {
    // 读取 URL 上的 dir 和 doc 参数
    const params = useSearchParams();
    const dirId = params?.get('dir') ?? undefined;
    const docId = params?.get('doc') ?? undefined;
    const feature = 'demo';
    const modelName = '智能文档/demo';

    return (
        <DirectoryLayout
            feature={feature}
            modelName={modelName}
            initialDirId={dirId}
            initialItemId={docId}
        >
            {({ visibleItems, selectedItem, onSelectItem, onUpdate: onUpdateItem }) => (
                <div className="h-full overflow-auto p-4">
                    <ContentPanel
                        feature={feature}
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