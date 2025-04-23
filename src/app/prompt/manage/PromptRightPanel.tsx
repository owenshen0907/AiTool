// app/prompt/manage/PromptRightPanel.tsx
'use client';
import React from 'react';
import { RefreshCw, Lock, Unlock } from 'lucide-react';

export interface AttributeItem {
    name: string;
    value: boolean;
    suggestion?: string;
    locked: boolean;
}

interface PromptRightPanelProps {
    tags: string[];
    description: string;
    attributes: AttributeItem[];
    onEvaluate: () => void;
    onToggleLock: (idx: number) => void;
}

export default function PromptRightPanel({
                                             tags,
                                             description,
                                             attributes,
                                             onEvaluate,
                                             onToggleLock,
                                         }: PromptRightPanelProps) {
    return (
        <div className="flex flex-col h-full bg-white shadow-sm border-l border-gray-200 p-4">
            {/* 标签与简介 */}
            <div className="mb-4">
                <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag, i) => (
                        <span key={i} className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs">
              {tag}
            </span>
                    ))}
                </div>
                <p className="text-gray-600 text-sm truncate">{description}</p>
            </div>

            {/* 评估维度列表 */}
            <div className="flex-1 overflow-auto mb-4">
                <ul className="space-y-3">
                    {attributes.map((attr, idx) => (
                        <li key={idx} className="flex justify-between items-start">
                            <div className="text-sm">
                                <span className="font-medium text-gray-800">{attr.name}</span>
                                <span className={attr.value ? 'ml-2 text-green-600' : 'ml-2 text-red-600'}>
                  {attr.value ? '通过' : '未通过'}
                </span>
                                {attr.suggestion && (
                                    <p className="text-xs text-gray-500 mt-1">{attr.suggestion}</p>
                                )}
                            </div>
                            <button
                                className="p-1 text-gray-500 hover:text-gray-800"
                                onClick={() => onToggleLock(idx)}
                            >
                                {attr.locked ? <Unlock size={16} /> : <Lock size={16} />}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* 一键评估按钮 */}
            <button
                onClick={onEvaluate}
                className="mt-auto w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 flex items-center justify-center text-sm"
            >
                <RefreshCw size={16} className="mr-2" /> 一键评估
            </button>
        </div>
    );
}