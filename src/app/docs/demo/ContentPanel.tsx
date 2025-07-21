// File: src/app/docs/demo/ContentPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import type { ContentItem } from '@/lib/models/content';
import DirectoryInfoView from './DirectoryInfoView';
import ContentLeft from "./ContentLeft";
import ContentRight from "./ContentRight";

interface Props {
    feature: string;
    visibleItems: ContentItem[];
    selectedItem: ContentItem | null;
    onSelectItem: (id: string) => void;
    onUpdateItem: (item: ContentItem, patch: Partial<ContentItem>) => Promise<void>;
}

export default function ContentPanel({
                                         feature,
                                         visibleItems,
                                         selectedItem,
                                         onSelectItem,
                                         onUpdateItem,
                                     }: Props) {
    const [body, setBody] = useState<string>(selectedItem?.body ?? '');

    useEffect(() => {
        setBody(selectedItem?.body ?? '');
    }, [selectedItem?.id]);

    // —— 新增：如果当前模块还没有任何内容，显示默认介绍 ——
    if (visibleItems.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-6 text-gray-600">
                <div className="max-w-md">
                    <h2 className="text-2xl font-semibold mb-4">{feature} 模块简介</h2>
                    <p className="mb-2">
                        欢迎使用 <span className="font-medium">{feature}</span> 模块。
                        这里是该模块的默认介绍区域，你可以在此创建并管理属于此模块的内容。
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>创建新条目：点击“新建”按钮并填写表单</li>
                        <li>编辑条目：在列表中选中已有条目进行修改</li>
                        <li>删除条目：在条目操作菜单中选择“删除”</li>
                    </ul>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen">
            {selectedItem ? (
                <>
                    <ContentLeft
                        selectedItem={selectedItem}
                        body={body}
                        onChangeBody={setBody}
                        onUpdateItem={onUpdateItem}
                    />
                    <ContentRight
                        feature={feature}
                        formId={selectedItem.id}
                        selectedItem={selectedItem}
                        existingBody={body}
                        onChangeBody={setBody}
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