// File: src/app/docs/japanese/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import DirectoryLayout from '@/components/directory/DirectoryLayout';
import JapaneseContentPanel from './JapaneseContentPanel';

export default function JapaneseDocsPage() {
    const params = useSearchParams();
    const dirId = params?.get('dir') ?? undefined;
    const docId = params?.get('doc') ?? undefined;

    return (
        <DirectoryLayout
            feature="japanese"
            modelName="智能文档/日语笔记"
            initialDirId={dirId}
            initialItemId={docId}
        >
            {({ visibleItems, selectedItem, onSelectItem, onUpdate: onUpdateItem }) => (
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
