// src/app/docs/japanese/page.tsx
'use client';

import React from 'react';
import DirectoryLayout from '@/components/directory/DirectoryLayout';
import JapaneseContentPanel from './JapaneseContentPanel';

export default function JapaneseDocsPage() {
    return (
        <DirectoryLayout feature="japanese">
            {({
                  currentDir,
                  selectedItem,
                  visibleItems,
                  onSelectItem,
                  onCreate,
                  onUpdate,
                  onDelete,
                  onReorder,
              }) => (
                <JapaneseContentPanel
                    items={visibleItems}
                    selectedItem={selectedItem}
                    onSelectItem={onSelectItem}
                    // 只传一个参数：dirId，打开「新建内容」弹框
                    onCreateItem={() => currentDir && onCreate(currentDir)}
                    onUpdateItem={onUpdate}
                    onDeleteItem={onDelete}
                    onReorderItems={onReorder}
                />
            )}
        </DirectoryLayout>
    );
}