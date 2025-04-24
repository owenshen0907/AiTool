'use client';
import React, { useState, useEffect } from 'react';
import InputBox from '@/app/components/InputBox';
import type { PromptItem, AttributeItem } from '@/lib/models/prompt';

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
    const [experienceInput, setExperienceInput] = useState('');
    const [experienceOutput, setExperienceOutput] = useState('');
    const [mode, setMode] = useState<'exp'|'opt'>('exp');

    useEffect(() => {
        setOriginal(initialPrompt);
        setOptimized('');
        setSuggestion('');
        setExperienceInput('');
        setExperienceOutput('');
        setMode('exp');
    }, [initialPrompt]);

    const handleCopy = (txt: string) => {
        navigator.clipboard.writeText(txt);
    };

    return (
        <div className="flex flex-col h-full p-2">
            <div className="flex-1 flex gap-2">
                {/* 左侧 */}
                <div className="relative flex-1">
                    <button
                        className="absolute top-2 left-2 p-2 bg-white rounded shadow"
                        onClick={() => handleCopy(original)}
                    >
                        复制
                    </button>
                    {mode === 'opt' && (
                        <div className="absolute top-2 right-2 flex gap-1">
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
                    <InputBox
                        className="h-full w-full pt-10"
                        value={original}
                        onChange={mode === 'opt' ? setOriginal : () => {}}
                        readOnly={mode === 'exp'}
                    />
                </div>
                {/* 右侧 */}
                <div className="relative flex-1">
                    <button
                        className="absolute top-2 left-2 p-2 bg-white rounded shadow"
                        onClick={() =>
                            handleCopy(mode === 'opt' ? optimized : experienceOutput)
                        }
                    >
                        复制
                    </button>
                    {mode === 'opt' && (
                        <button
                            className="absolute top-2 right-2 px-3 py-1 bg-purple-600 text-white rounded"
                            onClick={() => onAdopt(optimized)}
                        >
                            采纳
                        </button>
                    )}
                    <InputBox
                        className="h-full w-full pt-10"
                        value={mode === 'opt' ? optimized : experienceOutput}
                        readOnly
                        onChange={() => {}}
                    />
                </div>
            </div>

            <div className="flex gap-2 mt-2">
                <InputBox
                    className="flex-1 h-24"
                    placeholder={mode === 'opt' ? '优化建议...' : '测试输入...'}
                    value={mode === 'opt' ? suggestion : experienceInput}
                    onChange={mode === 'opt' ? setSuggestion : setExperienceInput}
                />
                <div className="flex flex-col gap-2">
                    <button
                        className={mode === 'exp'
                            ? 'px-3 py-1 bg-indigo-600 text-white rounded'
                            : 'px-3 py-1 bg-gray-200 text-gray-700 rounded'}
                        onClick={() => setMode('exp')}
                    >
                        体验模式
                    </button>
                    <button
                        className={mode === 'opt'
                            ? 'px-3 py-1 bg-indigo-600 text-white rounded'
                            : 'px-3 py-1 bg-gray-200 text-gray-700 rounded'}
                        onClick={() => setMode('opt')}
                    >
                        优化模式
                    </button>
                </div>
            </div>
        </div>
    );
}