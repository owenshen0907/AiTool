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

            {/* 页脚 */}
            <footer className="bg-gray-100 text-center text-sm text-gray-500 py-4">
                <p className="mb-2">
                    本站致力于提供一站式 AI 工具平台，所有 AI 生成内容请谨慎甄别与使用。
                </p>
                <p>
                    友情链接：<a href="https://everything.cafe" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Everything Café</a>
                </p>
            </footer>
        </main>
    );
}