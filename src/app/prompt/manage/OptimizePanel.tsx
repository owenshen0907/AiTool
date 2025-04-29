// src/app/prompt/manage/OptimizePanel.tsx
'use client';

import React, { useState } from 'react';

export interface OptimizePanelProps {
    /** 用于初始化的原始 Prompt */
    initialPrompt: string;
}

export default function OptimizePanel({ initialPrompt }: OptimizePanelProps) {
    // 原始 Prompt 文本
    const [prompt, setPrompt] = useState(initialPrompt);
    // 用户对当前 Prompt 的反馈
    const [feedback, setFeedback] = useState('');
    // 模型生成的优化后 Prompt
    const [optimizedPrompt, setOptimizedPrompt] = useState('');
    // 生成状态
    const [loading, setLoading] = useState(false);

    /** 占位：调用优化接口，暂时只模拟延迟 */
    const handleGenerate = async () => {
        setLoading(true);
        // TODO: 调用 /api/chat 或其他后端代理，传入 prompt + feedback 等信息
        await new Promise(resolve => setTimeout(resolve, 1000));
        // 模拟返回结果
        setOptimizedPrompt(prompt + '  // （这是优化后的示例）');
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-full p-4 bg-white rounded-lg shadow space-y-4">
            {/* 原始 Prompt 编辑区 */}
            <div>
                <label className="block mb-1 font-medium">原始 Prompt</label>
                <textarea
                    className="w-full h-24 p-2 border rounded resize-none"
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                />
            </div>

            {/* 用户反馈区 */}
            <div>
                <label className="block mb-1 font-medium">改进建议 / 反馈</label>
                <textarea
                    className="w-full h-20 p-2 border rounded resize-none"
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    placeholder="请简要描述当前 Prompt 的不足之处…"
                />
            </div>

            {/* 操作按钮 */}
            <div>
                <button
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    onClick={handleGenerate}
                    disabled={loading}
                >
                    {loading ? '优化中…' : '生成优化 Prompt'}
                </button>
            </div>

            {/* 优化结果展示区 */}
            {optimizedPrompt && (
                <div>
                    <label className="block mb-1 font-medium">优化后 Prompt</label>
                    <textarea
                        className="w-full h-24 p-2 border rounded bg-gray-50 resize-none"
                        value={optimizedPrompt}
                        readOnly
                    />
                    <button
                        className="mt-2 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        onClick={() => setPrompt(optimizedPrompt)}
                    >
                        采纳此 Prompt
                    </button>
                </div>
            )}
        </div>
    );
}