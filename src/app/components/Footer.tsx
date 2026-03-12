'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Github, Sparkles } from 'lucide-react';

const footerLinks = [
    { title: '工作台', href: '/workspace' },
    { title: '提示词工作台', href: '/prompt/manage' },
    { title: '需求看板', href: '/requirements' },
    { title: '系统规划', href: '/roadmap' },
];

export default function Footer() {
    const pathname = usePathname();

    if (pathname === '/api-lab' || pathname?.startsWith('/api-lab/')) {
        return null;
    }

    return (
        <footer className="border-t border-slate-200 bg-white/60 backdrop-blur-sm">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-10 md:flex-row md:justify-between md:py-12">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#0f172a_0%,#334155_55%,#64748b_100%)] text-white">
                        <Sparkles size={14} />
                    </div>
                    <div>
                        <div className="text-sm font-semibold tracking-tight text-slate-900">AiTool</div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">AI 工作台</div>
                    </div>
                </div>

                <nav className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
                    {footerLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-sm text-slate-500 transition-colors duration-200 hover:text-slate-900"
                        >
                            {link.title}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-4">
                    <a
                        href="https://github.com/owenshen0907/AiTool"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 transition-colors duration-200 hover:text-slate-700"
                        aria-label="GitHub"
                    >
                        <Github size={18} />
                    </a>
                    <span className="text-xs text-slate-400">
                        &copy; {new Date().getFullYear()} AiTool
                    </span>
                </div>
            </div>
        </footer>
    );
}
