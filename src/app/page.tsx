// app/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import FeaturesSection from './components/FeaturesSection';

export default function HomePage() {
    return (
        <main className="w-full min-h-screen flex flex-col bg-gray-50 font-sans">
            {/* 英雄区 */}
            <section className="flex-1 bg-gradient-to-br from-indigo-500 to-purple-700 text-white flex flex-col items-center justify-center text-center py-12 px-4">
                <h1 className="text-[2.75rem] font-bold mb-4">一站式 AI 能力平台</h1>
                <p className="text-[1.25rem] mb-8 max-w-lg leading-relaxed">
                    从 Prompt 到微调，从知识库到多模态 Agent，全面提升你的开发效率。
                </p>
                <Link
                    href="/prompt/manage"
                    className="bg-white text-indigo-500 px-8 py-3 rounded-full font-semibold transition hover:bg-gray-100"
                >
                    立即体验
                </Link>
            </section>

            {/* 功能区 */}
            <FeaturesSection />

            {/* 平台介绍 */}
            <section className="bg-white p-8 text-center">
                <h2 className="text-2xl text-gray-800 mb-4">关于本平台</h2>
                <p className="text-base text-gray-600 leading-relaxed max-w-2xl mx-auto">
                    本平台集成了 AI 场景下常用的六大模块：
                    <strong> Prompt 管理、知识库管理、模型微调、语音处理、图片生成</strong>及
                    <strong> 实用 Agent</strong>，支持多级子功能一键访问，帮助你快速搭建智能应用、优化工作流程。
                </p>
            </section>
        </main>
    );
}
