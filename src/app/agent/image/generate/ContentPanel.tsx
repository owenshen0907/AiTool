// File: src/app/agent/image/ContentPanel.tsx
'use client';
import React, { useState, useEffect } from 'react';
import type { ContentItem } from '@/lib/models/content';
import DirectoryInfoView from './DirectoryInfoView';
import ContentLeft from './ContentLeft';
import ContentRight from './ContentRight';
import { useAgentScenes } from 'src/hooks/useAgentScenes';

export default function ContentPanel(props: {
    feature: string;
    visibleItems: ContentItem[];
    selectedItem: ContentItem | null;
    onSelectItem: (id: string) => void;
    onUpdateItem: (item: ContentItem, patch: Partial<ContentItem>) => Promise<void>;
}) {
    const { feature, visibleItems, selectedItem, onSelectItem, onUpdateItem } = props;
    const [body, setBody] = useState<string>(selectedItem?.body ?? '');
    const [promptGenerating, setPromptGenerating] = useState(false); // ← 新增

    const { scenes, loading: loadingConfig, getScene } = useAgentScenes(feature);

    useEffect(() => {
        setBody(selectedItem?.body ?? '');
    }, [selectedItem?.id]);

    if (visibleItems.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-6 text-gray-600">
                <DirectoryInfoView
                    feature={feature}
                    items={visibleItems}
                    onSelectItem={onSelectItem}
                    onUpdateItem={onUpdateItem}
                />
            </div>
        );
    }

    return (
        <div className="flex h-screen">
            {selectedItem ? (
                <>
                    <ContentLeft
                        feature={feature}
                        scenes={scenes}
                        loadingConfig={loadingConfig}
                        getScene={getScene}
                        selectedItem={selectedItem}
                        body={body}
                        onChangeBody={setBody}
                        onUpdateItem={onUpdateItem}
                        promptGenerating={promptGenerating}        // ← 透传
                    />
                    <ContentRight
                        feature={feature}
                        formId={selectedItem.id}
                        selectedItem={selectedItem}
                        existingBody={body}
                        onChangeBody={setBody}
                        onUpdateItem={onUpdateItem}
                        onPromptGeneratingChange={setPromptGenerating} // ← 让右侧控制加载状态
                    />
                </>
            ) : (
                <DirectoryInfoView
                    feature={feature}
                    items={visibleItems}
                    onSelectItem={onSelectItem}
                    onUpdateItem={onUpdateItem}
                />
            )}
        </div>
    );
}