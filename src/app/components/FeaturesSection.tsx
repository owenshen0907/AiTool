// app/components/FeaturesSection.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Feature {
    title: string;
    desc: string[];
    href: string;
}

export default function FeaturesSection() {
    // 第一块：个人 AI 工具集
    const tools: Feature[] = [
        { title: 'Prompt 管理', desc: ['管理用例', '生成 Prompt', '调试'], href: '/prompt/manage' },
        { title: '知识库', desc: ['库管理', '文件管理'], href: '/kb/manage' },
        { title: '模型微调', desc: ['管理微调', '数据集管理'], href: '/fine-tune/manage' },
        { title: '语音处理', desc: ['ASR', 'TTS', 'Real-Time'], href: '/speech/asr' },
        { title: '图片生成', desc: ['单张', '批量'], href: '/image/generate' },
    ];

    // 第二块：AI 场景演示 渐变背景
    const gradients = [
        'from-purple-400 via-pink-500 to-red-500',
        'from-green-400 via-blue-500 to-purple-600',
        'from-yellow-300 via-orange-400 to-red-500',
    ];
    const [current, setCurrent] = useState(0);
    useEffect(() => {
        const id = setInterval(() => {
            setCurrent(prev => (prev + 1) % gradients.length);
        }, 5000);
        return () => clearInterval(id);
    }, [gradients.length]);

    // 第三块：我的小天地
    const personal: Feature[] = [
        { title: '学习笔记', desc: ['日语', '编程', 'AI'], href: '/my/notes' },
        { title: '游记', desc: ['旅行见闻', '美食推荐'], href: '/my/travel' },
        { title: '照片', desc: ['生活点滴', '风景'], href: '/my/photos' },
        { title: 'Vlog', desc: ['视频日志'], href: '/my/vlog' },
    ];

    return (
        <div className="space-y-16 px-6 py-8">
            {/* 工具集 */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">AI 工具集</h2>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-6">
                    {tools.map(tool => (
                        <Link
                            key={tool.title}
                            href={tool.href}
                            className="bg-white rounded-lg shadow p-6 text-gray-800 hover:shadow-lg transition"
                        >
                            <h3 className="text-lg font-semibold mb-2">{tool.title}</h3>
                            <ul className="list-inside list-disc text-sm text-gray-600">
                                {tool.desc.map(d => (<li key={d}>{d}</li>))}
                            </ul>
                        </Link>
                    ))}
                </div>
            </div>

            {/* 场景演示 Banner 渐变 */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">AI 场景演示</h2>
                <div className="relative w-full h-56 rounded-lg overflow-hidden">
                    {gradients.map((gr, idx) => (
                        <div
                            key={idx}
                            className={`absolute inset-0 bg-gradient-to-r ${gr} transition-opacity duration-1000 ${idx === current ? 'opacity-100' : 'opacity-0'}`}
                        />
                    ))}
                </div>
            </div>

            {/* 我的小天地 */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">我的小天地</h2>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-6">
                    {personal.map(p => (
                        <Link
                            key={p.title}
                            href={p.href}
                            className="bg-white rounded-lg shadow p-6 text-gray-800 hover:shadow-lg transition"
                        >
                            <h3 className="text-lg font-semibold mb-2">{p.title}</h3>
                            <ul className="list-inside list-disc text-sm text-gray-600">
                                {p.desc.map(d => (<li key={d}>{d}</li>))}
                            </ul>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}