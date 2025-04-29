// src/app/prompt/manage/PromptContentPanel.tsx
'use client';

import React, { useState } from 'react';
import ExperiencePanel from './ExperiencePanel';
import OptimizePanel from './OptimizePanel';

export interface PromptContentPanelProps {
    promptId: string;
    promptTitle: string;
    initialPrompt: string;
}

export default function PromptContentPanel({
                                               promptId,
                                               promptTitle,
                                               initialPrompt,
                                           }: PromptContentPanelProps) {
    const [mode, setMode] = useState<'exp' | 'opt'>('exp');

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center mb-4 space-x-2">
                <button
                    className={`px-4 py-1 rounded ${
                        mode === 'exp' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
                    }`}
                    onClick={() => setMode('exp')}
                >
                    体验模式
                </button>
                <button
                    className={`px-4 py-1 rounded ${
                        mode === 'opt' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
                    }`}
                    onClick={() => setMode('opt')}
                >
                    优化模式
                </button>
            </div>

            <div className="flex-1 overflow-auto">
                {mode === 'exp' ? (
                    <ExperiencePanel promptId={promptId} initialPrompt={initialPrompt} />
                ) : (
                    <OptimizePanel promptId={promptId} initialPrompt={initialPrompt} />
                )}
            </div>
        </div>
    );
}