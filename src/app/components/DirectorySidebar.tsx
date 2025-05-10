// src/components/DirectorySidebar.tsx
'use client';

import React, { useState, useCallback } from 'react';
import DirectoryManager from './DirectoryManager';
import type { DirectoryItem } from '@/lib/models/directory';

interface Props {
    feature: string;                   // 功能区标识（如 'case'）
    onSelect: (directoryId: string) => void; // 目录选中时通知父组件
}

export default function DirectorySidebar({ feature, onSelect }: Props) {
    // 本地维护当前选中的目录 ID，用于高亮
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // 选中目录时，既更新本地状态，又回调给父组件
    const handleSelect = useCallback((id: string) => {
        setSelectedId(id);
        onSelect(id);
    }, [onSelect]);

    return (
        <aside className="w-72 bg-white border-r h-full">
            <DirectoryManager
                feature={feature}
                selectedId={selectedId}
                onSelect={handleSelect}
            />
        </aside>
    );
}