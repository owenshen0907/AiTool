
// src/app/components/NavBar.tsx
'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/app/providers/UserProvider';
import UserInfoModal from './info/UserInfoModal';
import SupplierModelManagement from './info/SupplierModelManagement';
import AgentManagement from './info/agentConfig/AgentManagement';
import { menuData, MenuItem } from './menuData';
import { CASDOOR_CONFIG } from '@/config';

function buildLoginHref(next: string = '/') {
    const url = new URL(
        `${process.env.NEXT_PUBLIC_LOGIN_URL}/login/oauth/authorize`
    );
    url.searchParams.set('client_id', CASDOOR_CONFIG.clientId);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('redirect_uri', CASDOOR_CONFIG.redirectUri);
    url.searchParams.set('scope', 'read');
    url.searchParams.set('state', 'casdoor');
    url.searchParams.set('next', next);
    return url.toString();
}

function HoverMenu({ item, level = 0 }: { item: MenuItem; level?: number }) {
    const [open, setOpen] = useState(false);
    const timer = useRef<number>();
    const enter = () => { clearTimeout(timer.current); setOpen(true); };
    const leave = () => { timer.current = window.setTimeout(() => setOpen(false), 50); };
    const isRoot = level === 0;
    const posClass = isRoot ? 'left-0 top-full mt-1 w-36' : 'left-full top-0 ml-1 w-48';
    return (
        <li className="relative" onMouseEnter={enter} onMouseLeave={leave}>
            {item.href ? (
                <Link
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-3 py-2 hover:bg-gray-100 rounded">
                    {item.title}
                </Link>
            ) : (
                <span className="block px-3 py-2 hover:bg-gray-100 rounded cursor-pointer">
          {item.title}
        </span>
            )}
            {item.children && open && (
                <ul
                    className={`absolute ${posClass} bg-white border shadow-lg rounded-md py-1`}
                    style={{ zIndex: 50 + level }}
                >
                    {item.children.map(child => (
                        <HoverMenu key={child.title} item={child} level={level+1} />
                    ))}
                </ul>
            )}
        </li>
    );
}

export default function NavBar() {
    const { user, setUser } = useUser();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const hoverTimer = useRef<number>();
    const router = useRouter();
    const pathname = usePathname() || '/';
    const loginHref = buildLoginHref(pathname);

    const handleLogout = async () => {
        // 本地清用户
        setUser(null);
        // 后端清 session
        await fetch('/api/auth/logout', { credentials: 'include' });
        router.push('/');
    };

    const displayName = user?.displayName || 'U';
    const firstChar = displayName.charAt(0).toUpperCase();
    const [showAgentModal, setShowAgentModal] = useState(false);

    return (
        <>
            <nav className="flex items-center justify-between px-8 h-14 bg-white shadow-md relative z-50">
                <div className="text-2xl font-semibold text-blue-600 cursor-pointer" onClick={() => router.push('/')}>AiTool</div>
                <ul className="flex space-x-4">
                    {menuData.map(item => <HoverMenu key={item.title} item={item}/>)}
                </ul>
                <div className="flex items-center space-x-4">
                    <a href="https://github.com/owenshen0907/AiTool" target="_blank" rel="noopener noreferrer" className="hover:opacity-80">
                        <Image src="/icons/github.svg" alt="GitHub" width={24} height={24}/>
                    </a>
                    {user ? (
                        <div
                            className="relative flex items-center"
                            onMouseEnter={() => { clearTimeout(hoverTimer.current); setDropdownOpen(true); }}
                            onMouseLeave={() => { hoverTimer.current = window.setTimeout(() => setDropdownOpen(false), 150); }}
                        >
                            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                {firstChar}
                            </div>
                            {dropdownOpen && (
                                <div className="absolute right-0 top-full mt-1 w-44 bg-white border rounded-md shadow-lg">
                                    <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setShowUserModal(true); setDropdownOpen(false); }}>个人信息</div>
                                    <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setShowSupplierModal(true); setDropdownOpen(false); }}>供应商＆模型管理</div>
                                    <div
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"   // NEW
                                        onClick={() => { setShowAgentModal(true); setDropdownOpen(false); }}
                                    >Agent管理</div>
                                    <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={handleLogout}>注销登录</div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <a href={loginHref} className="px-3 py-2 hover:bg-gray-100 rounded">登录</a>
                    )}
                </div>
            </nav>
            {showUserModal && user && <UserInfoModal data={user} onClose={() => setShowUserModal(false)}/>}
            {showSupplierModal && <SupplierModelManagement onClose={() => setShowSupplierModal(false)}/>}
            {showAgentModal && <AgentManagement onClose={() => setShowAgentModal(false)} />} {/* NEW */}
        </>
    );
}
