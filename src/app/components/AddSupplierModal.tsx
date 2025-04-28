// app/components/AddSupplierModal.tsx
'use client';

import React, { useState } from 'react';

interface Props {
    onClose: () => void;
}

export default function AddSupplierModal({ onClose }: Props) {
    const [name, setName] = useState('');
    const [abbreviation, setAbbreviation] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [apiUrl, setApiUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim() || !abbreviation.trim() || !apiKey.trim() || !apiUrl.trim()) {
            alert('请填写所有字段');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/suppliers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, abbreviation, api_key: apiKey, api_url: apiUrl }),
            });
            if (res.ok) onClose();
            else alert(`添加失败: ${await res.text()}`);
        } catch (err) {
            console.error(err);
            alert('添加失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            <div
                className="bg-white rounded shadow-lg p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold mb-4">添加模型供应商</h3>
                <div className="space-y-3">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="名称"
                        className="w-full border rounded px-3 py-2"
                    />
                    <input
                        value={abbreviation}
                        onChange={(e) => setAbbreviation(e.target.value)}
                        placeholder="简称"
                        className="w-full border rounded px-3 py-2"
                    />
                    <input
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="API Key"
                        className="w-full border rounded px-3 py-2"
                    />
                    <input
                        value={apiUrl}
                        onChange={(e) => setApiUrl(e.target.value)}
                        placeholder="API 地址"
                        className="w-full border rounded px-3 py-2"
                    />
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                    <button onClick={onClose} className="px-4 py-2 border rounded">取消</button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                    >
                        {loading ? '添加中...' : '保存'}
                    </button>
                </div>
            </div>
        </div>
    );
}