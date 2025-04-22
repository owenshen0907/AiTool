// src/app/layout.tsx
import './globals.css';        // 引入全局样式
import NavBar from './components/NavBar'; // 导航栏

import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'NihonGO',
    description: 'A Japanese learning site',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body className={inter.className}>
        {/* 导航栏放在这里，所有页面都会显示 */}
        <NavBar />
        {/* 页面主体 */}
        {children}
        </body>
        </html>
    );
}