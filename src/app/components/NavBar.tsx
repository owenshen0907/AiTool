'use client';

import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import UserInfoModal from './UserInfoModal';          // 保持不变
import SupplierModelManagement from './SupplierModelManagement'; // 新的管理组件

interface MenuItem {
    title: string;
    href?: string;
    children?: MenuItem[];
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
                    {item.children.map((child) => (
                        <HoverMenu key={child.title} item={child} level={level + 1} />
                    ))}
                </ul>
            )}
        </li>
    );
}

interface User {
    id: string;
    data: { displayName?: string; name: string; avatar?: string };
    models: any[];
}

export default function NavBar() {
    const [userData, setUserData] = useState<User | null>(null);
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
                    models: user.model_list ?? [],
                });
                sessionStorage.setItem('userData', JSON.stringify(user));
            } catch (err) {
                if (abort.signal.aborted) return;
                console.error(err);
            }
        }
        const cached = sessionStorage.getItem('userData');
        cached ? setUserData(JSON.parse(cached)) : fetchUser();
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

    const menuData: MenuItem[] = [
        { title: '首页', href: '/' },
        {
            title: 'Prompt',
            children: [
                { title: 'Prompt管理', href: '/prompt/manage' },
                { title: 'Prompt生成', href: '/prompt/create' },
                { title: 'Prompt调试', href: '/prompt/debug' },
            ],
        },
        {
            title: '知识库',
            children: [
                { title: '知识库管理', href: '/kb/manage' },
                { title: '文件管理', href: '/kb/files' },
            ],
        },
        {
            title: '模型微调',
            children: [
                { title: '微调管理', href: '/fine-tune/manage' },
                { title: '数据集管理', href: '/fine-tune/datasets' },
            ],
        },
        {
            title: '语音',
            children: [
                { title: 'ASR', href: '/speech/asr' },
                { title: 'TTS', href: '/speech/tts' },
                { title: 'Real-Time', href: '/speech/real-time' },
            ],
        },
        { title: '图片', children: [{ title: '图片生成', href: '/image/generate' }] },
        {
            title: '实用Agent',
            children: [
                {
                    title: '视频',
                    children: [
                        { title: '视频总结', href: '/agent/video/summary' },
                        { title: '生成剪辑脚本', href: '/agent/video/script' },
                        { title: '生成文案', href: '/agent/video/copy' },
                    ],
                },
                {
                    title: '图片',
                    children: [
                        { title: '批量分析', href: '/agent/image/batch-analysis' },
                        { title: '批量标注', href: '/agent/image/batch-annotate' },
                    ],
                },
                {
                    title: '文件',
                    children: [
                        { title: '文本总结', href: '/agent/file/text-summary' },
                        { title: '图片总结', href: '/agent/file/image-summary' },
                    ],
                },
                {
                    title: '代码',
                    children: [
                        { title: '生成README', href: '/agent/code/readme' },
                        { title: '生成接口文档', href: '/agent/code/docs' },
                    ],
                },
                { title: '其它', children: [{ title: '自定义测试', href: '/agent/other/custom-test' }] },
            ],
        },
    ];

    return (
        <>
            <nav className="flex items-center justify-between px-8 h-14 bg-white shadow-md relative z-50">
                <div className="text-2xl font-semibold text-blue-600">AiTool</div>

                <ul className="flex space-x-4">
                    {menuData.map((item) => (
                        <HoverMenu key={item.title} item={item} />
                    ))}
                </ul>
                {/* GitHub 图标链接 */}
                <a
                    href="https://github.com/owenshen0907/AiTool"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-80"
                >
                    <Image
                        src="/icons/github.svg"
                        alt="GitHub"
                        width={24}
                        height={24}
                    />
                </a>

                {/* 用户头像与下拉 */}
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
            </nav>

            {/* 个人信息弹框 */}
            {showUserModal && (
                <UserInfoModal
                    data={userData?.data || {}}
                    onClose={() => setShowUserModal(false)}
                />
            )}

            {/* 新的供应商 & 模型管理弹框 */}
            {showSupplierModal && (
                <SupplierModelManagement onClose={() => setShowSupplierModal(false)} />
            )}
        </>
    );
}