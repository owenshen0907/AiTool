'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Globe, Database, Cpu, Mic, FileText } from 'lucide-react';

interface Slide {
    gradient: string;
    headline: string;
    subheadline: string;
    ctaHref: string;
    ctaLabel: string;
}

const slides: Slide[] = [
    {
        gradient: 'from-indigo-500 to-purple-700',
        headline: '一站式 AI 能力平台',
        subheadline: '从 Prompt 到微调，从知识库到多模态 Agent，全面提升开发效率',
        ctaHref: '/prompt/manage', ctaLabel: '立即体验',
    },
    {
        gradient: 'from-green-400 to-blue-500',
        headline: '多模态 Agent 支持',
        subheadline: '自动生成视频脚本、图像标注与文档总结，一键完成',
        ctaHref: '/agent/video/summary', ctaLabel: '场景演示',
    },
    {
        gradient: 'from-yellow-300 to-red-500',
        headline: '智能微调 & 知识库',
        subheadline: '定制模型训练，知识库管理，一站式数据驱动',
        ctaHref: '/kb/manage', ctaLabel: '查看详情',
    },
];

const features = [
    {
        icon: Globe,
        title: '项目愿景',
        desc: '记录与实践大模型应用：文本、视觉、音频、多模态',
    },
    {
        icon: Database,
        title: '可控性技术',
        desc: '知识库 & 微调，避免模型幻想',
    },
    {
        icon: Cpu,
        title: '实用 Agent',
        desc: '基于模型基础能力的场景应用',
    },
    {
        icon: Mic,
        title: '交互方式',
        desc: '语音与文本的流畅自然互动',
    },
    {
        icon: FileText,
        title: '笔记与工作台',
        desc: '统一文字、图片、语音记录，模型为您保管',
    },
];

export default function HomePage(): JSX.Element {
    const [active, setActive] = useState(0);
    const count = slides.length;

    useEffect(() => {
        const iv = setInterval(() => setActive(i => (i + 1) % count), 6000);
        return () => clearInterval(iv);
    }, [count]);

    return (
        <main className="flex flex-col min-h-screen font-sans bg-gray-100">
            {/* 上：幻灯片 */}
            <section className="relative h-72 overflow-hidden">
                {slides.map((s, idx) => (
                    <div
                        key={idx}
                        className={`absolute inset-0 bg-gradient-to-r ${s.gradient} transition-opacity duration-1000 ${idx === active ? 'opacity-100' : 'opacity-0'}`}
                    >
                        <div className="h-full flex flex-col items-center justify-center text-center text-white px-4 space-y-3">
                            <h1 className="text-3xl md:text-4xl font-bold drop-shadow-lg">{s.headline}</h1>
                            <p className="text-base md:text-lg drop-shadow-md max-w-2xl">{s.subheadline}</p>
                            <Link
                                href={s.ctaHref}
                                className="mt-1 inline-block bg-white text-black px-5 py-2 rounded-full font-medium hover:shadow-md"
                            >
                                {s.ctaLabel}
                            </Link>
                        </div>
                    </div>
                ))}
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setActive(i)}
                            className={`w-2 h-2 rounded-full ${i === active ? 'bg-white' : 'bg-gray-500'} hover:scale-125 transition-transform`}
                            type="button"
                        />
                    ))}
                </div>
            </section>

            {/* 中：图文介绍与进度 */}
            <section className="py-12 px-4 bg-white">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                    {/* 左：图文介绍，占4/5 */}
                    <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-3 gap-6">
                        {features.map((f, idx) => (
                            <div
                                key={idx}
                                className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg shadow-sm"
                            >
                                <f.icon size={40} className="text-indigo-500 mb-2" />
                                <h3 className="font-semibold text-gray-800 mb-1">{f.title}</h3>
                                <p className="text-sm text-gray-600">{f.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* 右：开发进度，占1/5 */}
                    <div className="lg:col-span-1 bg-gray-50 p-4 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">开发进度</h3>
                        <ul className="space-y-2 text-gray-700 text-sm">
                            <li><span className="text-green-500 mr-2">✓</span>Prompt 管理 完成</li>
                            <li><span className="text-yellow-500 mr-2">⟳</span>Prompt 调试 进行中</li>
                            <li><span className="text-gray-400 mr-2">○</span>知识库 模块</li>
                            <li><span className="text-gray-400 mr-2">○</span>微调 模块</li>
                            <li><span className="text-gray-400 mr-2">○</span>智能 Agent</li>
                            <li><span className="text-gray-400 mr-2">○</span>语音 交互</li>
                            <li><span className="text-gray-400 mr-2">○</span>笔记 & 工作台</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* 页脚 */}
            <footer className="bg-black text-gray-400 py-12 px-6 mt-auto">
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                    {/* 快速入口 */}
                    <div>
                        <h4 className="font-semibold text-white mb-2">快速入口</h4>
                        <ul className="space-y-1">
                            <li><Link href="/prompt/manage" className="hover:text-white">Prompt 管理</Link></li>
                            <li><Link href="/prompt/case" className="hover:text-white">Prompt 调试</Link></li>
                            <li><Link href="/kb/manage" className="hover:text-white">知识库管理</Link></li>
                            <li><Link href="/fine-tune/manage" className="hover:text-white">模型微调</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-2">Agent 场景</h4>
                        <ul className="space-y-1">
                            <li><Link href="/agent/video/summary" className="hover:text-white">视频总结</Link></li>
                            <li><Link href="/agent/image/batch-analysis" className="hover:text-white">图像分析</Link></li>
                            <li><Link href="/agent/file/text-summary" className="hover:text-white">文件总结</Link></li>
                            <li><Link href="/agent/code/docs" className="hover:text-white">代码文档</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-2">欧文的个人中心</h4>
                        <ul className="space-y-1">
                            <li><Link href="/docs/study" className="hover:text-white">学习笔记</Link></li>
                            <li><Link href="/docs/travel" className="hover:text-white">游记攻略</Link></li>
                            <li><Link href="/docs/japanese" className="hover:text-white">日语学习</Link></li>
                            <li><Link href="/docs/photos" className="hover:text-white">照片集</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-2">友情链接</h4>
                        <ul className="space-y-1">
                            <li><a href="https://everything.cafe" target="_blank" rel="noopener noreferrer" className="hover:text-white">Everything Café</a></li>
                        </ul>
                    </div>
                </div>
                <p className="text-center text-xs text-gray-500 mt-6">© 2025 AiTool · 欧文</p>
            </footer>
        </main>
    );
}
