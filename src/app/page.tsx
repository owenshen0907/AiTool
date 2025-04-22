// app/page.tsx
import React from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function HomePage() {
    const features = [
        {
            title: 'Prompt',
            desc: ['管理', '生成', '调试'],
            href: '/prompt/manage'
        },
        {
            title: '知识库',
            desc: ['知识库管理', '文件管理'],
            href: '/kb/manage'
        },
        {
            title: '模型微调',
            desc: ['微调管理', '数据集管理'],
            href: '/fine-tune/manage'
        },
        {
            title: '语音',
            desc: ['ASR', 'TTS', 'Real‑Time'],
            href: '/speech/asr'
        },
        {
            title: '图片',
            desc: ['图片生成'],
            href: '/image/generate'
        },
        {
            title: '实用Agent',
            desc: ['视频', '图片', '文件', '代码', '其它'],
            href: '/agent/video/summary'
        }
    ];

    return (
        <main className={styles.main}>
            {/* 英雄区 */}
            <section className={styles.hero}>
                <h1 className={styles.title}>一站式 AI 能力平台</h1>
                <p className={styles.subtitle}>从 Prompt 到微调，从知识库到多模态 Agent，全面提升你的开发效率。</p>
                <Link href="/prompt/manage" className={styles.cta}>
                    立即体验
                </Link>
            </section>

            {/* 功能区 */}
            <section className={styles.features}>
                {features.map(f => (
                    <Link key={f.title} href={f.href} className={styles.card}>
                        <h3 className={styles.cardTitle}>{f.title}</h3>
                        <ul className={styles.cardDesc}>
                            {f.desc.map(item => <li key={item}>{item}</li>)}
                        </ul>
                    </Link>
                ))}
            </section>

            {/* 平台介绍 */}
            <section className={styles.intro}>
                <h2>关于本平台</h2>
                <p>
                    本平台集成了 AI 场景下常用的六大模块：
                    <strong>Prompt 管理、知识库管理、模型微调、语音处理、图片生成</strong>及
                    <strong>实用 Agent</strong>，支持多级子功能一键访问，帮助你快速搭建智能应用、优化工作流程。
                </p>
            </section>
        </main>
    );
}