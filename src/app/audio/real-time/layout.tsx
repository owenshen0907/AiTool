// File: src/app/audio/real-time/layout.tsx
import React from 'react';
import Head from 'next/head';
// 如果你有额外 CSS，比如 app.css，可以在全局布局里引入，或者在这里单独引入。
// 假设你的全局 CSS 已经在 src/app/globals.css 中被引入，这里就不用再重复。
// import '@/app/css/app.css';

export const metadata = {
    title: '阶跃星辰 Realtime API 接口前端使用样例',
};

export default function RealTimeLayout({
                                           children,
                                       }: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Head>
                <title>{metadata.title}</title>
                {/* 你可以根据需要添加其他 <meta> */}
            </Head>
            <main className="min-h-screen bg-base-100">
                {/* 子路由页面会渲染在这里 */}
                {children}
            </main>
        </>
    );
}