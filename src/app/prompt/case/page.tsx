// src/app/prompt/case/page.tsx
'use client';

import React from 'react';
import DirectoryLayout from '@/components/directory/DirectoryLayout';
import CaseContentPanel from './CaseContentPanel';

export default function CaseManagePage() {
    return (
        <DirectoryLayout feature="case">
            {({
                  currentDir,
                  selectedItem,
                  visibleItems,
                  onSelectItem,
                  onCreate,
                  onUpdate,
                  onDelete,
                  onReorder
              }) => (
                <CaseContentPanel
                    items={visibleItems}
                    selectedItem={selectedItem}
                    onSelectItem={onSelectItem}
                    // 只传一个参数：dirId，打开「新建内容」弹框
                    onCreateItem={() => currentDir && onCreate(currentDir)}
                    onUpdateItem={onUpdate}
                    onDeleteItem={onDelete}
                    onReorderItems={(orderedIds: string[]) => {
                        if (currentDir) {
                            onReorder(currentDir, orderedIds);
                        }}}
                />
            )}
        </DirectoryLayout>
    );
}