// File: src/app/agent/image/right/IntentList.tsx
'use client';

import React from 'react';
import { ListChecks } from 'lucide-react';
import type { IntentItem } from '@/app/agent/image/generate/right/hooks/useIntentExtraction';

interface Props {
    intents: IntentItem[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    generatedIntentMap: Record<
        string,
        { lastContent: string; updatedAt: string; count: number }
    >;
}

export default function IntentList({
                                       intents,
                                       selectedId,
                                       onSelect,
                                       generatedIntentMap
                                   }: Props) {
    if (!intents.length) return null;
    return (
        <div className="border rounded p-2 max-h-48 overflow-auto space-y-2">
            <div className="flex items-center text-xs text-gray-500 mb-1">
                <ListChecks size={14} className="mr-1" /> 选择一个意图生成插画提示
            </div>
            {intents.map(intent => {
                const generated = generatedIntentMap[intent.id];
                return (
                    <div
                        key={intent.id}
                        className={`p-2 rounded cursor-pointer border text-xs transition ${
                            intent.id === selectedId
                                ? 'bg-blue-50 border-blue-400'
                                : 'hover:bg-gray-50 border-gray-300'
                        }`}
                        onClick={() => onSelect(intent.id)}
                    >
                        <div className="flex items-center flex-wrap gap-1">
                            <span className="font-medium">{intent.title}</span>
                            {intent.jlpt_level && (
                                <span className="ml-1 text-[10px] px-1 py-0.5 bg-gray-200 rounded">
                  {intent.jlpt_level}
                </span>
                            )}
                            {generated && (
                                <span className="text-[10px] px-1 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                  已生成×{generated.count}
                </span>
                            )}
                        </div>
                        {intent.core_explanation && (
                            <div className="text-gray-600 mt-1 line-clamp-2">
                                {intent.core_explanation}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}