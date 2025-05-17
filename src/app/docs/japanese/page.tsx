// src/app/docs/japanese/page.tsx
'use client';

import React from 'react';
import DirectoryLayout from '@/components/directory/DirectoryLayout';
import JapaneseContentPanel from './JapaneseContentPanel';

export default function JapaneseDocsPage() {
    return (
        <DirectoryLayout feature="japanese">
            {({
                  selectedItem,
                  onUpdate,
              }) => (
                <JapaneseContentPanel
                    selectedItem={selectedItem}
                    onUpdateItem={onUpdate}
                />
            )}
        </DirectoryLayout>
    );
}