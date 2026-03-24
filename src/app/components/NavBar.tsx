'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronDown, Github, Sparkles } from 'lucide-react';
import { useUser } from '@/app/providers/UserProvider';
import UserInfoModal from './info/UserInfoModal';
import SupplierModelManagement from './info/SupplierModelManagement';
import AgentManagement from './info/agentConfig/AgentManagement';
import { menuData, MenuItem } from './menuData';
import { buildLoginModalPath } from '@/lib/auth/loginModal';

function isMenuItemActive(item: MenuItem, pathname: string): boolean {
    if (item.href) {
        if (item.href === '/') return pathname === '/';
        if (pathname === item.href) return true;
        return pathname.startsWith(`${item.href}/`);
    }

    return item.children?.some((child) => isMenuItemActive(child, pathname)) ?? false;
}

function HoverMenu({
    item,
    pathname,
    level = 0,
}: {
    item: MenuItem;
    pathname: string;
    level?: number;
}) {
    const [open, setOpen] = useState(false);
    const timer = useRef<number>();
    const active = isMenuItemActive(item, pathname);
    const isRoot = level === 0;

    const enter = () => {
        clearTimeout(timer.current);
        setOpen(true);
    };

    const leave = () => {
        timer.current = window.setTimeout(() => setOpen(false), 180);
    };

    const panelClass = isRoot
        ? 'left-1/2 top-full mt-3 w-64 -translate-x-1/2'
        : 'left-full top-0 ml-1 w-60';

    const triggerClass = isRoot
        ? `relative inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
              active || open
                  ? 'bg-white/80 text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.10)]'
                  : 'text-slate-600 hover:bg-white/65 hover:text-slate-900'
          }`
        : `flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-sm transition-all duration-200 ${
              active
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
          }`;

    return (
        <li className="relative shrink-0" onMouseEnter={enter} onMouseLeave={leave}>
            {item.href ? (
                <Link href={item.href} className={triggerClass}>
                    <span>{item.title}</span>
                    {item.children ? <ChevronDown size={15} className={open ? 'rotate-180 transition' : 'transition'} /> : null}
                </Link>
            ) : (
                <button type="button" className={triggerClass}>
                    <span>{item.title}</span>
                    {item.children ? <ChevronDown size={15} className={open ? 'rotate-180 transition' : 'transition'} /> : null}
                </button>
            )}

            {item.children ? (
                <ul
                    className={`absolute ${panelClass} rounded-[28px] border border-white/70 bg-white/78 p-2 shadow-[0_22px_70px_rgba(15,23,42,0.14)] backdrop-blur-2xl transition-all duration-200 origin-top ${open ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none'}`}
                    style={{ zIndex: 80 + level }}
                >
                    {item.children.map((child) => (
                        <HoverMenu
                            key={`${item.title}-${child.title}`}
                            item={child}
                            pathname={pathname}
                            level={level + 1}
                        />
                    ))}
                </ul>
            ) : null}
        </li>
    );
}

export default function NavBar() {
    const { user, setUser } = useUser();
    const pathname = usePathname() || '/';
    const searchParams = useSearchParams();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [showAgentModal, setShowAgentModal] = useState(false);
    const hoverTimer = useRef<number>();

    if (
        pathname === '/login-confirm' ||
        pathname === '/api-lab' ||
        pathname?.startsWith('/api-lab/') ||
        pathname === '/trip' ||
        pathname?.startsWith('/trip/')
    ) {
        return null;
    }

    const search = searchParams?.toString() ? `?${searchParams.toString()}` : '';
    const loginHref = buildLoginModalPath(pathname, search);
    const displayName = user?.displayName || 'User';
    const firstChar = displayName.charAt(0).toUpperCase();

    const handleLogout = () => {
        setUser(null);
        window.location.href = '/api/auth/logout';
    };

    return (
        <>
            <div className="sticky top-0 z-[90] px-3 pt-3 md:px-5">
                <nav className="mx-auto flex max-w-7xl items-center gap-3 rounded-[30px] border border-white/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(244,247,251,0.70)_100%)] px-3 py-3 shadow-[0_18px_60px_rgba(15,23,42,0.10)] backdrop-blur-2xl md:px-4">
                    <Link
                        href="/"
                        className="flex shrink-0 items-center gap-3 rounded-[22px] px-2 py-1.5 transition hover:bg-white/70"
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#0f172a_0%,#334155_55%,#64748b_100%)] text-white shadow-[0_10px_30px_rgba(15,23,42,0.20)]">
                            <Sparkles size={18} />
                        </div>
                        <div className="hidden sm:block">
                            <div className="text-lg font-semibold tracking-tight text-slate-900">AiTool</div>
                            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                AI 工作台
                            </div>
                        </div>
                    </Link>

                    <div className="min-w-0 flex-1 overflow-x-auto md:overflow-visible">
                        <ul className="flex min-w-max items-center gap-2 px-1">
                            {menuData.map((item) => (
                                <HoverMenu key={item.title} item={item} pathname={pathname} />
                            ))}
                        </ul>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <a
                            href="https://github.com/owenshen0907/AiTool"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/60 text-slate-600 transition hover:bg-white hover:text-slate-900"
                            aria-label="GitHub"
                        >
                            <Github size={18} />
                        </a>

                        {user ? (
                            <div
                                className="relative"
                                onMouseEnter={() => {
                                    clearTimeout(hoverTimer.current);
                                    setDropdownOpen(true);
                                }}
                                onMouseLeave={() => {
                                    hoverTimer.current = window.setTimeout(() => setDropdownOpen(false), 140);
                                }}
                            >
                                <button
                                    type="button"
                                    className="flex items-center gap-3 rounded-full border border-white/65 bg-white/70 px-2 py-2 pr-3 shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition hover:bg-white"
                                >
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#2563eb_0%,#0f172a_100%)] text-sm font-semibold text-white">
                                        {firstChar}
                                    </div>
                                    <div className="hidden text-left md:block">
                                        <div className="max-w-[132px] truncate text-sm font-medium text-slate-900">
                                            {displayName}
                                        </div>
                                        <div className="text-xs text-slate-500">当前账号</div>
                                    </div>
                                    <ChevronDown
                                        size={16}
                                        className={dropdownOpen ? 'text-slate-500 transition rotate-180' : 'text-slate-500 transition'}
                                    />
                                </button>

                                {
                                    <div className={`absolute right-0 top-full mt-3 w-60 rounded-[28px] border border-white/70 bg-white/80 p-2 shadow-[0_22px_70px_rgba(15,23,42,0.16)] backdrop-blur-2xl transition-all duration-200 origin-top-right ${dropdownOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none'}`}>
                                        <button
                                            type="button"
                                            className="block w-full rounded-2xl px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-white hover:text-slate-900"
                                            onClick={() => {
                                                setShowUserModal(true);
                                                setDropdownOpen(false);
                                            }}
                                        >
                                            个人信息
                                        </button>
                                        <button
                                            type="button"
                                            className="block w-full rounded-2xl px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-white hover:text-slate-900"
                                            onClick={() => {
                                                setShowSupplierModal(true);
                                                setDropdownOpen(false);
                                            }}
                                        >
                                            供应商＆模型管理
                                        </button>
                                        <button
                                            type="button"
                                            className="block w-full rounded-2xl px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-white hover:text-slate-900"
                                            onClick={() => {
                                                setShowAgentModal(true);
                                                setDropdownOpen(false);
                                            }}
                                        >
                                            Agent 管理
                                        </button>
                                        <button
                                            type="button"
                                            className="block w-full rounded-2xl px-4 py-3 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                                            onClick={handleLogout}
                                        >
                                            注销登录
                                        </button>
                                    </div>
                                }
                            </div>
                        ) : (
                            <Link
                                href={loginHref}
                                scroll={false}
                                className="inline-flex h-11 items-center rounded-full border border-white/70 bg-[linear-gradient(135deg,#0f172a_0%,#334155_100%)] px-5 text-sm font-medium text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition hover:opacity-92"
                            >
                                登录
                            </Link>
                        )}
                    </div>
                </nav>
            </div>

            {showUserModal && user ? <UserInfoModal data={user} onClose={() => setShowUserModal(false)} /> : null}
            {showSupplierModal ? <SupplierModelManagement onClose={() => setShowSupplierModal(false)} /> : null}
            {showAgentModal ? <AgentManagement onClose={() => setShowAgentModal(false)} /> : null}
        </>
    );
}
