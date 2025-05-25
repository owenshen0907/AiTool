// File: src/app/docs/japanese/page.tsx
'use client';

import React from 'react';
import DirectoryLayout from '@/components/directory/DirectoryLayout';
import JapaneseContentPanel from './JapaneseContentPanel';

export default function JapaneseDocsPage() {
    const feature = 'japanese';
    return (
        <DirectoryLayout feature={feature}>
            {({ selectedItem, onUpdate }) => (
                <JapaneseContentPanel
                    feature={feature}
                    selectedItem={selectedItem}
                    onUpdateItem={onUpdate}
                />
            )}
        </DirectoryLayout>
    );
}