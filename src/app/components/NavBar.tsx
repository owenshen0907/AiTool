// src/app/components/NavBar.tsx
'use client';

import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import UserInfoModal from './info/UserInfoModal';
import SupplierModelManagement from './info/SupplierModelManagement';
import { menuData, MenuItem } from './menuData';

interface UserType {
    id: string;
    data: {
        displayName?: string;
        name: string;
        avatar?: string;
    };
    models: any[];
}

function HoverMenu({
                       item,
                       level = 0,
                   }: {
    item: MenuItem;
    level?: number;
}) {
    const [open, setOpen] = useState(false);
    const closeTimer = useRef<number>();

    const handleMouseEnter = () => {
        window.clearTimeout(closeTimer.current);
        setOpen(true);
    };
    const handleMouseLeave = () => {
        closeTimer.current = window.setTimeout(() => setOpen(false), 50);
    };

    const isRoot = level === 0;
    const ulPosition = isRoot ? 'left-0 top-full mt-1' : 'left-full top-0 ml-1';
    const ulWidth = isRoot ? 'w-36' : 'w-48';
    const zIndex = 50 + level;

    return (
        <li
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
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
                    className={`
            absolute ${ulPosition} ${ulWidth}
            bg-white border border-gray-200 shadow-lg rounded-md
            py-1 z-[${zIndex}]
          `}
                >
                    {item.children.map(child => (
                        <HoverMenu key={child.title} item={child} level={level + 1} />
                    ))}
                </ul>
            )}
        </li>
    );
}

export default function NavBar(): JSX.Element {
    const [userData, setUserData] = useState<UserType | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const userTimer = useRef<number>();

    useEffect(() => {
        const abort = new AbortController();

        async function fetchUser() {
            try {
                const res = await fetch('/api/user/get', {
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    signal: abort.signal,
                });
                if (!res.ok) throw new Error(`请求失败：${res.status}`);
                const { user } = await res.json();
                setUserData({
                    id: user.data.name,
                    data: user.data,
                    models: user.model_list || [],
                });
                sessionStorage.setItem('userData', JSON.stringify(user));
            } catch (err) {
                if (abort.signal.aborted) return;
                console.error(err);
            }
        }

        const cached = sessionStorage.getItem('userData');
        if (cached) {
            setUserData(JSON.parse(cached));
        } else {
            fetchUser();
        }

        return () => abort.abort();
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem('userData');
        window.location.href = '/api/auth/logout';
    };

    const nickname = userData?.data.displayName ?? userData?.data.name ?? '未登录';
    const firstChar = Array.from(nickname)[0];

    const onUserEnter = () => {
        window.clearTimeout(userTimer.current);
        setDropdownOpen(true);
    };
    const onUserLeave = () => {
        userTimer.current = window.setTimeout(() => setDropdownOpen(false), 150);
    };

    return (
        <>
            <nav className="flex items-center justify-between px-8 h-14 bg-white shadow-md relative z-50">
                {/* Logo */}
                <div className="text-2xl font-semibold text-blue-600">AiTool</div>

                {/* 主菜单 */}
                <ul className="flex space-x-4">
                    {menuData.map(item => (
                        <HoverMenu key={item.title} item={item} />
                    ))}
                </ul>

                {/* 右侧：GitHub + 用户 */}
                <div className="flex items-center space-x-4">
                    {/* GitHub 图标 */}
                    <a
                        href="https://github.com/owenshen0907/AiTool"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:opacity-80"
                    >
                        <Image src="/icons/github.svg" alt="GitHub" width={24} height={24} />
                    </a>

                    {/* 用户头像 & 下拉 */}
                    <div
                        className="relative flex items-center"
                        onMouseEnter={onUserEnter}
                        onMouseLeave={onUserLeave}
                    >
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold cursor-pointer">
                            {firstChar}
                        </div>

                        {dropdownOpen && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-md shadow-lg">
                                <div
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => {
                                        setShowUserModal(true);
                                        setDropdownOpen(false);
                                    }}
                                >
                                    个人信息
                                </div>
                                <div
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => {
                                        setShowSupplierModal(true);
                                        setDropdownOpen(false);
                                    }}
                                >
                                    供应商＆模型管理
                                </div>
                                <div
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={handleLogout}
                                >
                                    注销登录
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* 个人信息弹窗 */}
            {showUserModal && userData && (
                <UserInfoModal data={userData.data} onClose={() => setShowUserModal(false)} />
            )}

            {/* 供应商 & 模型管理弹窗 */}
            {showSupplierModal && (
                <SupplierModelManagement onClose={() => setShowSupplierModal(false)} />
            )}
        </>
    );
}