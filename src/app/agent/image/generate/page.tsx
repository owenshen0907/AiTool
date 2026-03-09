// File: src/app/agent/image/generate/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import DirectoryLayout from '@/components/directory/DirectoryLayout';
import ContentPanel from './ContentPanel';

export default function ImageGeneratePage() {
    const params = useSearchParams();
    const dirId = params?.get('dir') ?? undefined;
    const docId = params?.get('doc') ?? undefined;
    const feature = 'imageGenerate';
    const modelName = 'Agent/图片生成';

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
