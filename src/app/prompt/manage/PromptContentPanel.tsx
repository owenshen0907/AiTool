// app/prompt/manage/PromptContentPanel.tsx
'use client';
import React, { useState, useEffect } from 'react';
import InputBox from '@/app/components/InputBox';

export interface PromptContentPanelProps {
    initialPrompt: string;
    tags: string[];
    description: string;
    onSave: (content: string) => void;
    onSmartSave: (content: string, suggestion?: string) => void;
    onAdopt: (optimized: string) => void;
    onExperienceRun: (input: string) => void;
}

export default function PromptContentPanel({
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
    const [mode, setMode] = useState<'exp' | 'opt'>('exp');

    useEffect(() => {
        setOriginal(initialPrompt);
        setOptimized('');
        setSuggestion('');
        setExperienceInput('');
        setExperienceOutput('');
        setMode('exp');
    }, [initialPrompt]);

    const handleCopy = (text: string) => navigator.clipboard.writeText(text);
    const handleSmartSave = () => {
        onSmartSave(original, suggestion);
        setOptimized(original);
    };
    const handleAdoptClick = () => {
        if (confirm('确认采纳优化后的 Prompt？')) {
            onAdopt(optimized);
            setOriginal(optimized);
        }
    };
    const handleExperienceRun = () => {
        onExperienceRun(experienceInput);
        setExperienceOutput(`体验结果：${experienceInput}`);
    };

    return (
        <div className="flex flex-1 flex-col h-full">
            {/* 上方两栏 */}
            <div className="flex flex-1 gap-2 p-2">
                {/* 左侧：原始 Prompt */}
                <div className="relative flex-1">
                    {/* 复制按钮 */}
                    <button
                        className="absolute top-2 left-2 p-2 bg-white shadow rounded z-10"
                        onClick={() => handleCopy(original)}
                    >复制</button>
                    {/* 优化模式下按钮 */}
                    {mode === 'opt' && (
                        <div className="absolute top-2 right-2 flex space-x-1 z-10">
                            <button
                                className="h-10 px-3 bg-green-600 text-white rounded shadow hover:bg-green-700"
                                onClick={() => onSave(original)}
                            >保存</button>
                            <button
                                className="h-10 px-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
                                onClick={handleSmartSave}
                            >智能保存</button>
                        </div>
                    )}
                    <InputBox
                        value={original}
                        onChange={setOriginal}
                        className="h-full w-full pt-12"
                    />
                </div>

                {/* 右侧：输出区域 */}
                <div className="relative flex-1">
                    {/* 复制按钮 */}
                    <button
                        className="absolute top-2 left-2 p-2 bg-white shadow rounded z-10"
                        onClick={() => handleCopy(mode === 'opt' ? optimized : experienceOutput)}
                    >复制</button>
                    {/* 优化模式下采纳 */}
                    {mode === 'opt' && (
                        <button
                            className="absolute top-2 right-2 h-10 px-3 bg-purple-600 text-white rounded shadow hover:bg-purple-700 z-10"
                            onClick={handleAdoptClick}
                        >采纳</button>
                    )}
                    <InputBox
                        value={mode === 'opt' ? optimized : experienceOutput}
                        onChange={() => {}}
                        readOnly
                        className="h-full w-full pt-12"
                    />
                </div>
            </div>

            {/* 下方：输入框 & 模式切换 */}
            <div className="flex items-start gap-2 p-2">
                <InputBox
                    value={mode === 'opt' ? suggestion : experienceInput}
                    onChange={mode === 'opt' ? setSuggestion : setExperienceInput}
                    className="flex-1 h-28"
                    placeholder={mode === 'opt' ? '优化建议...' : '测试输入...'}
                />
                <div className="flex flex-col gap-2">
                    <button
                        className={`h-12 px-4 rounded text-sm font-medium ${mode === 'exp' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => setMode('exp')}
                    >体验模式</button>
                    <button
                        className={`h-12 px-4 rounded text-sm font-medium ${mode === 'opt' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => setMode('opt')}
                    >优化模式</button>
                </div>
            </div>
        </div>
    );
}