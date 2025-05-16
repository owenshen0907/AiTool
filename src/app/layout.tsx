// src/app/layout.tsx
import './globals.css';        // 引入全局样式
import Script from 'next/script';
import NavBar from './components/NavBar'; // 导航栏

import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'Aitool',
    description: 'A Ai Tool site',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <head>
            {/* 在 React 启动前打补丁 */}
            <Script
                src="/fetchPatch.js"
                strategy="beforeInteractive"
            />
        </head>
        <body className={inter.className}>
        {/* 导航栏放在这里，所有页面都会显示 */}
        <NavBar />
        {/* 页面主体 */}
        {children}
        </body>
        </html>
    );
}