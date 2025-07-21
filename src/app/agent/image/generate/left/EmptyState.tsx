// File: src/app/agent/image/left/EmptyState.tsx
'use client';

import React, { useState } from 'react';
import LoadingIndicator from '@/components/LoadingIndicator/LoadingIndicator';

export default function EmptyState() {
    const [loading, setLoading] = useState(false);

    const handleGenerate = () => {
        setLoading(true);
        // 这里可接入真实的生成逻辑，或在外部监听状态，将loading设回false
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <LoadingIndicator scene="img_prompt_generate" />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full p-6 space-y-6 text-center">
            <h2 className="text-2xl font-semibold">欢迎使用 图片生成 模块</h2>
            <p className="text-gray-600">
                本模块可自动提取输入内容的学习意图，并为每个意图生成高质量插画提示词，
                便于调用 AI 绘图接口制作配图。
            </p>
            <ol className="list-decimal list-inside text-left text-gray-700 space-y-2 max-w-md">
                <li>在右侧面板输入文本或上传示例图片，点击“抽取意图”。</li>
                <li>从列表中选择您要生成插画的意图。</li>
                <li>点击下方“生成插画提示”按钮，查看进度与提示词。</li>
            </ol>
            <button
                onClick={handleGenerate}
                className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
                生成插画提示
            </button>
        </div>
    );
}