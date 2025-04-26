
// src/app/prompt/manage/PromptContentPanel.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ChatInput from '@/app/components/ChatInput';
import type { PromptItem } from '@/lib/models/prompt';

export interface PromptContentPanelProps {
    promptId: string;
    parentId: string | null;
    promptTitle: string;
    initialPrompt: string;
    tags: string[];
    description: string;
    onSave: (content: string) => void;
    onSmartSave: (content: string, suggestion?: string) => void;
    onAdopt: (optimized: string) => void;
    onExperienceRun: (input: string) => void;
}

export default function PromptContentPanel({
                                               promptId,
                                               promptTitle,
                                               initialPrompt,
                                               tags,
                                               description,
                                               onSave,
                                               onSmartSave,
                                               onAdopt,
                                               onExperienceRun,
                                           }: PromptContentPanelProps) {
    const [original, setOriginal] = useState(initialPrompt);
    const [optimized, setOptimized] = useState('');
    const [suggestion, setSuggestion] = useState('');
    const [mode, setMode] = useState<'exp' | 'opt'>('exp');

    useEffect(() => {
        setOriginal(initialPrompt);
        setOptimized('');
        setSuggestion('');
        setMode('exp');
    }, [initialPrompt]);

    const handleChatSend = useCallback(
        ({ text }: { text: string }) => {
            if (mode === 'exp') {
                onExperienceRun(text);
            } else {
                setSuggestion(text);
            }
        },
        [mode, onExperienceRun]
    );

    const handleCopy = useCallback((txt: string) => {
        navigator.clipboard.writeText(txt).catch(console.error);
    }, []);

    return (
        <div className="flex flex-col h-full p-4 bg-white rounded-lg shadow">
            {/* 标题 */}
            <h2 className="text-xl font-semibold mb-4">{promptTitle}</h2>
            {/* 模式切换 */}
            <div className="flex gap-2 mb-4">
                {( ['exp', 'opt'] as const ).map(m => (
                    <button
                        key={m}
                        className={`px-4 py-1 rounded ${
                            mode === m
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-200 text-gray-700'
                        }`}
                        onClick={() => setMode(m)}
                    >
                        {m === 'exp' ? '体验模式' : '优化模式'}
                    </button>
                ))}
            </div>
            {/* 主区域 */}
            <div className="flex-1 flex gap-4 overflow-hidden mb-4">
                {/* 原始 */}
                <div className="relative flex-1">
                    <button
                        className="absolute top-2 left-2 p-2 bg-white rounded shadow"
                        onClick={() => handleCopy(original)}
                    >
                        复制
                    </button>
                    <textarea
                        value={original}
                        onChange={e => setOriginal(e.target.value)}
                        readOnly={mode === 'exp'}
                        className="w-full h-full p-4 border border-gray-300 rounded resize-none focus:outline-none focus:ring"
                    />
                    {mode === 'opt' && (
                        <div className="absolute top-2 right-2 flex flex-col gap-2">
                            <button
                                className="px-3 py-1 bg-green-600 text-white rounded"
                                onClick={() => onSave(original)}
                            >
                                保存
                            </button>
                            <button
                                className="px-3 py-1 bg-blue-600 text-white rounded"
                                onClick={() => onSmartSave(original, suggestion)}
                            >
                                智能保存
                            </button>
                        </div>
                    )}
                </div>
                {/* 优化/体验 输出 */}
                <div className="relative flex-1">
                    <button
                        className="absolute top-2 left-2 p-2 bg-white rounded shadow"
                        onClick={() => handleCopy(optimized)}
                    >
                        复制
                    </button>
                    <textarea
                        value={optimized}
                        onChange={e => setOptimized(e.target.value)}
                        readOnly={mode === 'exp'}
                        className="w-full h-full p-4 border border-gray-300 rounded bg-gray-50 resize-none focus:outline-none focus:ring"
                    />
                    {mode === 'opt' && (
                        <button
                            className="absolute top-2 right-2 px-3 py-1 bg-purple-600 text-white rounded"
                            onClick={() => onAdopt(optimized)}
                        >
                            采纳
                        </button>
                    )}
                </div>
            </div>
            {/* 输入 */}
            <ChatInput
                context={{ promptId }}
                models={['gpt-4o', 'step-2-16k']}
                placeholder={mode === 'exp' ? '测试输入...' : '请输入优化建议...'}
                enableImage
                enableVoice
                onSend={handleChatSend}
            />
        </div>
    );
}
