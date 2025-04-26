'use client';

import React, { MouseEvent } from 'react';

interface UserInfoModalProps {
    data: {
        name?: string;
        displayName?: string;
        email?: string;
        phone?: string;
        wechat?: string;
    };
    onClose: () => void;
}

export default function UserInfoModal({ data, onClose }: UserInfoModalProps) {
    const stop = (e: MouseEvent) => e.stopPropagation();

    return (
        /* 遮罩层 */
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            {/* 内容卡片 */}
            <div
                className="w-full max-w-md bg-white rounded-lg shadow-xl p-6"
                onClick={stop}
            >
                <h3 className="text-lg font-semibold mb-4">用户信息</h3>

                <div className="space-y-3 text-gray-700">
                    <p>
                        <span className="font-medium">用户ID：</span>
                        {data.name || '未知'}
                    </p>
                    <p>
                        <span className="font-medium">昵称：</span>
                        {data.displayName || '未知'}
                    </p>
                    <p>
                        <span className="font-medium">邮箱：</span>
                        {data.email || '未提供'}
                    </p>
                    <p>
                        <span className="font-medium">电话：</span>
                        {data.phone || '未提供'}
                    </p>
                    <p>
                        <span className="font-medium">微信：</span>
                        {data.wechat || '未提供'}
                    </p>
                </div>

                <button
                    onClick={onClose}
                    className="mt-6 w-full py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                    关闭
                </button>
            </div>
        </div>
    );
}