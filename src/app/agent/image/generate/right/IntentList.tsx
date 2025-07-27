// File: src/app/agent/image/right/IntentList.tsx
'use client';

import React, { useMemo } from 'react';
import { ListChecks } from 'lucide-react';
import type { IntentPromptOutput } from '../types';

interface Props {
    intents: IntentPromptOutput['intents'];
    selectedId: string | null;
    onSelect: (id: string) => void;
    generatedIntentMap: Record<string, { lastContent: string; count: number }>;
}

export default function IntentList({ intents, selectedId, onSelect,generatedIntentMap }: Props) {
    if (intents.length === 0) return null;

    const sorted = useMemo(
        () => [...intents].sort((a, b) => b.confidence - a.confidence),
        [intents]
    );

    return (
        <div className="border rounded p-2 max-h-48 overflow-auto space-y-2">
            <div className="flex items-center text-xs text-gray-500 mb-1">
                <ListChecks size={14} className="mr-1" />
                选择一个意图生成插画提示
            </div>

            {sorted.map(intent => {
                const isSelected = intent.id === selectedId;
                const gen = generatedIntentMap[intent.id];

                return (
                    <div
                        key={intent.id}
                        onClick={() => onSelect(intent.id)}
                        className={`p-2 rounded cursor-pointer border text-xs transition ${
                            isSelected
                                ? 'bg-blue-50 border-blue-400'
                                : 'hover:bg-gray-50 border-gray-300'
                        }`}
                    >
                        {/* 标题、等级与分类同行 */}
                        <div className="flex items-center flex-wrap gap-2">
                            <span className="font-medium text-sm">{intent.title}</span>
                            {intent.level && (
                                <span className="text-[10px] px-1 py-0.5 bg-gray-200 rounded">
                                    {intent.level}
                                </span>
                            )}
                            {(intent.category || intent.subcategory) && (
                                <span className="text-[10px] text-gray-500">
                                    {intent.category}
                                    {intent.category && intent.subcategory ? ' / ' : ''}
                                    {intent.subcategory}
                                </span>
                            )}
                        </div>

                        {/* 描述 */}
                        <div className="text-gray-600 mt-1 line-clamp-2">
                            {intent.description}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}