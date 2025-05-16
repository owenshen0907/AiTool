// src/app/components/NavBar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import UserInfoModal from './info/UserInfoModal';
import SupplierModelManagement from './info/SupplierModelManagement';
import { menuData, MenuItem } from './menuData';
import { CASDOOR_CONFIG } from '@/config';

/* ──────────────────────────────────────────────────────────── */
/* buildLoginHref：根据当前路径拼登录 URL（返回 string）              */
/* ──────────────────────────────────────────────────────────── */
function buildLoginHref(next: string = '/') {
    const u = new URL(`${process.env.NEXT_PUBLIC_LOGIN_URL}/login/oauth/authorize`);
    u.searchParams.set('client_id', CASDOOR_CONFIG.clientId);
    u.searchParams.set('response_type', 'code');
    u.searchParams.set('redirect_uri', CASDOOR_CONFIG.redirectUri);
    u.searchParams.set('scope', 'read');
    u.searchParams.set('state', 'casdoor');
    u.searchParams.set('next', next);
    return u.toString();
}

/* ──────────────────────────────────────────────────────────── */
/* Hover 子菜单（递归）                                           */
/* ──────────────────────────────────────────────────────────── */
function HoverMenu({ item, level = 0 }: { item: MenuItem; level?: number }) {
    const [open, setOpen] = useState(false);
    const closeTimer = useRef<number>();

    return (
        <li
            className="relative"
            onMouseEnter={() => {
                window.clearTimeout(closeTimer.current);
                setOpen(true);
            }}
            onMouseLeave={() => {
                closeTimer.current = window.setTimeout(() => setOpen(false), 50);
            }}
        >
            {item.href ? (
                <Link
                    href={item.href}
                    className="block px-3 py-2 text-gray-800 hover:bg-gray-100 whitespace-nowrap rounded"
                >
                    {item.title}
                </Link>
            ) : (
                <span className="block px-3 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer whitespace-nowrap rounded">
          {item.title}
        </span>
            )}

            {item.children && open && (
                <ul
                    className={`absolute ${level === 0 ? 'left-0 top-full mt-1' : 'left-full top-0 ml-1'} ${level === 0 ? 'w-36' : 'w-48'} bg-white border border-gray-200 shadow-lg rounded-md py-1 z-[${50 + level}]`}
                >
                    {item.children.map(child => (
                        <HoverMenu key={child.title} item={child} level={level + 1} />
                    ))}
                </ul>
            )}
        </li>
    );
}

/* ──────────────────────────────────────────────────────────── */
/* 类型                                                         */
/* ──────────────────────────────────────────────────────────── */
interface UserType {
    id: string;
    data: { name: string; displayName?: string; avatar?: string };
    models: any[];
}

/* ──────────────────────────────────────────────────────────── */
/* 主导航组件                                                   */
/* ──────────────────────────────────────────────────────────── */
export default function NavBar(): JSX.Element {
    const [userData, setUserData] = useState<UserType | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const userTimer = useRef<number>();

    const pathname  = usePathname() ?? '/';
    const loginHref = buildLoginHref(pathname);
    const router    = useRouter();

    /* ---------------- 获取用户信息 ---------------- */
    useEffect(() => {
        const abort = new AbortController();

        async function fetchUser() {
            try {
                const res  = await fetch('/api/user/get', { credentials: 'include', signal: abort.signal });
                const data = await res.json();
                if (data.loggedIn) {
                    const { user } = data;
                    setUserData({ id: user.data.name, data: user.data, models: user.model_list || [] });
                    sessionStorage.setItem('userData', JSON.stringify(user));
                } else {
                    setUserData(null);
                }
            } catch {}
        }

        const cached = sessionStorage.getItem('userData');
        cached ? setUserData(JSON.parse(cached)) : fetchUser();
        return () => abort.abort();
    }, []);

    /* 交互 */
    const onUserEnter = () => {
        window.clearTimeout(userTimer.current);
        setDropdownOpen(true);
    };
    const onUserLeave = () => {
        userTimer.current = window.setTimeout(() => setDropdownOpen(false), 150);
    };
    const handleLogout = () => {
        sessionStorage.removeItem('userData');
        setUserData(null);              // ← 立刻让 NavBar 进入「未登录」状态
        window.location.href = '/api/auth/logout';
    };

    const nickname  = userData?.data.displayName ?? userData?.data.name ?? '';
    const firstChar = nickname ? Array.from(nickname)[0] : '';

    return (
        <>
            <nav className="flex items-center justify-between px-8 h-14 bg-white shadow-md relative z-50">
                <div className="text-2xl font-semibold text-blue-600 cursor-pointer" onClick={() => router.push('/')}>AiTool</div>

                {/* 主菜单 */}
                <ul className="flex space-x-4">
                    {menuData.map(item => <HoverMenu key={item.title} item={item} />)}
                </ul>

                {/* 右侧：GitHub + 用户 / 登录 */}
                <div className="flex items-center space-x-4">
                    <a href="https://github.com/owenshen0907/AiTool" target="_blank" rel="noopener noreferrer" className="hover:opacity-80">
                        <Image src="/icons/github.svg" alt="GitHub" width={24} height={24} />
                    </a>

                    {userData ? (
                        <div className="relative flex items-center" onMouseEnter={onUserEnter} onMouseLeave={onUserLeave}>
                            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold cursor-pointer">
                                {firstChar}
                            </div>
                            {dropdownOpen && (
                                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-md shadow-lg">
                                    <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setShowUserModal(true); setDropdownOpen(false); }}>个人信息</div>
                                    <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setShowSupplierModal(true); setDropdownOpen(false); }}>供应商＆模型管理</div>
                                    <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={handleLogout}>注销登录</div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <a href={loginHref} className="px-3 py-2 text-gray-800 hover:bg-gray-100 rounded">登录</a>
                    )}
                </div>
            </nav>

            {showUserModal && userData && (<UserInfoModal data={userData.data} onClose={() => setShowUserModal(false)} />)}
            {showSupplierModal && (<SupplierModelManagement onClose={() => setShowSupplierModal(false)} />)}
        </>
    );
}
