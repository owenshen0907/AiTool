// File: src/components/CreateContentModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface CreateContentModalProps {
    visible: boolean;
    title?: string;
    initialData: { title: string; summary?: string; body?: string };
    onCancel: () => void;
    onSubmit: (data: { title: string; summary?: string; body?: string }) => void;
}

export default function CreateContentModal({
                                               visible,
                                               title = '新建内容',
                                               initialData,
                                               onCancel,
                                               onSubmit,
                                           }: CreateContentModalProps) {
    const [form, setForm] = useState(initialData);
    const [error, setError] = useState('');

    /* 每次打开时重置表单 */
    useEffect(() => {
        if (visible) {
            setForm(initialData);
            setError('');
        }
    }, [visible, initialData]);

    /* ---------- render nothing if hidden ---------- */
    if (!visible) return null;

    /* ---------- handlers ---------- */
    const handleOk = () => {
        if (!form.title.trim()) {
            setError('标题不能为空');
            return;
        }
        onSubmit({
            title: form.title.trim(),
            summary: form.summary?.trim(),
            body: form.body?.trim(),
        });
    };

    /* ---------- modal JSX ---------- */
    const modalJSX = (
        <div
            className="fixed inset-0 flex items-center justify-center bg-black/40 z-[9999]"
            onClick={onCancel}          /* 点击蒙层关闭 */
        >
            <div
                className="bg-white w-full max-w-lg rounded shadow-lg p-6"
                onClick={e => e.stopPropagation()}   /* 阻止冒泡 */
            >
                <h2 className="text-lg font-semibold mb-4">{title}</h2>
                {error && <div className="text-red-600 mb-2">{error}</div>}

                {/* ---- 标题 ---- */}
                <div className="mb-3">
                    <label className="block text-sm mb-1">
                        标题 <span className="text-red-600">*</span>
                    </label>
                    <input
                        className="w-full border rounded px-2 py-1"
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                    />
                </div>

                {/* ---- 概要 ---- */}
                <div className="mb-3">
                    <label className="block text-sm mb-1">概述</label>
                    <input
                        className="w-full border rounded px-2 py-1"
                        value={form.summary ?? ''}
                        onChange={e => setForm({ ...form, summary: e.target.value })}
                    />
                </div>

                {/* ---- 正文 ---- */}
                <div className="mb-5">
                    <label className="block text-sm mb-1">内容</label>
                    <textarea
                        rows={4}
                        className="w-full border rounded px-2 py-1"
                        value={form.body ?? ''}
                        onChange={e => setForm({ ...form, body: e.target.value })}
                    />
                </div>

                {/* ---- 操作 ---- */}
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-1 rounded bg-gray-200 hover:bg-gray-300"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleOk}
                        className="px-4 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
    );

    /* ---------- portal into body ---------- */
    return createPortal(modalJSX, document.body);
}