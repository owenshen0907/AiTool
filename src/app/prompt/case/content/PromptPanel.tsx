// File: app/prompt/case/content/PromptPanel.tsx
'use client';
import React from 'react';

interface Props {
    prompt: string;                        // 父组件传下来的 prompt
    onChange: (newPrompt: string) => void; // 编辑时通知父组件更新
    onSave?: () => void;                   // 如果你还想保留“保存”按钮
}

export default function PromptPanel({
                                        prompt,
                                        onChange,
                                        onSave
                                    }: Props) {
    return (
        <div className="h-full flex flex-col p-4 overflow-auto">
            <h3 className="font-semibold mb-2">Prompt 编辑</h3>
            <textarea
                value={prompt}
                onChange={e => onChange(e.target.value)}
                className="flex-1 border p-2 rounded font-mono text-sm whitespace-pre resize-none"
            />
            {onSave && (
                <button
                    onClick={onSave}
                    className="mt-2 self-end px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                    保存
                </button>
            )}
        </div>
    );
}