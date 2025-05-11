// app/components/ChatImageInput.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ImageIcon, Link } from 'lucide-react';

export interface ChatImageInputProps {
    enableImage?: boolean;
    onFilesSelected: (files: File[]) => void;
    onUrlEntered: (url: string) => void;
}

export default function ChatImageInput({
                                           enableImage = true,
                                           onFilesSelected,
                                           onUrlEntered,
                                       }: ChatImageInputProps) {
    const [showMenu, setShowMenu] = useState(false);
    const hideTimeoutRef = useRef<number>();
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!enableImage) return null;

    const handleMouseEnter = () => {
        // 进入时取消隐藏延迟
        window.clearTimeout(hideTimeoutRef.current);
        setShowMenu(true);
    };

    const handleMouseLeave = () => {
        // 移出后 200ms 再隐藏
        hideTimeoutRef.current = window.setTimeout(() => {
            setShowMenu(false);
        }, 200);
    };

    // 组件卸载时清除定时器
    useEffect(() => {
        return () => {
            window.clearTimeout(hideTimeoutRef.current);
        };
    }, []);

    return (
        <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button
                className="p-1 hover:bg-gray-100 rounded"
                title="上传或链接图片"
            >
                <ImageIcon size={20} />
            </button>

            {/* 悬浮菜单 */}
            <div
                className={`
          absolute bottom-full left-0 mb-2 w-40 bg-white border border-gray-200 
          rounded-lg shadow-lg z-10 transition-opacity duration-200
          ${showMenu ? 'opacity-100 visible' : 'opacity-0 invisible'}
        `}
            >
                <button
                    onClick={() => {
                        fileInputRef.current?.click();
                        setShowMenu(false);
                    }}
                    className="flex items-center px-4 py-2 hover:bg-gray-100 w-full text-sm text-gray-700"
                >
                    <ImageIcon size={16} className="mr-2" />
                    上传图片
                </button>
                <button
                    onClick={() => {
                        const url = prompt('请输入图片 URL');
                        if (url) onUrlEntered(url);
                        setShowMenu(false);
                    }}
                    className="flex items-center px-4 py-2 hover:bg-gray-100 w-full text-sm text-gray-700"
                >
                    <Link size={16} className="mr-2" />
                    图片链接
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={e => {
                        if (e.target.files) onFilesSelected(Array.from(e.target.files));
                    }}
                />
            </div>
        </div>
    );
}