// src/app/components/info/AddSupplierModal.tsx
'use client';

import React, { useState } from 'react';
import type { Supplier } from '@/lib/models/model';

interface AddSupplierModalProps {
    onClose: () => void;
    onSaved: () => void;
}

export default function AddSupplierModal({ onClose, onSaved }: AddSupplierModalProps) {
    const [name, setName] = useState('');
    const [abbreviation, setAbbreviation] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [apiUrl, setApiUrl] = useState('');
    const [wssUrl, setWssUrl] = useState('');          // 新增
    const [isDefault, setIsDefault] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim() || !abbreviation.trim() || !apiKey.trim() || !apiUrl.trim()) {
            alert('请填写所有必填字段');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/suppliers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    abbreviation,
                    api_key: apiKey,
                    api_url: apiUrl,
                    wssurl: wssUrl,                  // 传递 wssUrl
                    is_default: isDefault,
                }),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
            }
            onSaved();
            onClose();
        } catch (err: any) {
            console.error('添加供应商失败', err);
            alert('添加失败：' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-xl font-semibold mb-4">新增 AI 供应商</h3>
                <div className="space-y-4">
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="名称 *"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <input
                        value={abbreviation}
                        onChange={e => setAbbreviation(e.target.value)}
                        placeholder="简称 *"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <input
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        placeholder="API Key *"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <input
                        value={apiUrl}
                        onChange={e => setApiUrl(e.target.value)}
                        placeholder="API 地址 *"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <input
                        value={wssUrl}
                        onChange={e => setWssUrl(e.target.value)}
                        placeholder="WebSocket URL (可选)"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={isDefault}
                            onChange={e => setIsDefault(e.target.checked)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                        <span className="text-gray-700">设为默认</span>
                    </label>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                        disabled={loading}
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? '添加中…' : '保存'}
                    </button>
                </div>
            </div>
        </div>
    );
}