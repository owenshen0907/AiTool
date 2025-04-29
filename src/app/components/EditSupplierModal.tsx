// src/app/components/EditSupplierModal.tsx
'use client';

import React, { useState } from 'react';
import type { Supplier } from '@/lib/models/model';

interface EditSupplierModalProps {
    supplier: Supplier;
    onClose: () => void;
    onSaved: () => void;
}

export default function EditSupplierModal({ supplier, onClose, onSaved }: EditSupplierModalProps) {
    const [name, setName] = useState(supplier.name);
    const [abbreviation, setAbbreviation] = useState(supplier.abbreviation);
    const [apiKey, setApiKey] = useState(supplier.apiKey);
    const [apiUrl, setApiUrl] = useState(supplier.apiUrl);
    const [isDefault, setIsDefault] = useState(supplier.isDefault);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/suppliers', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: supplier.id,
                    name,
                    abbreviation,
                    api_key: apiKey,
                    api_url: apiUrl,
                    is_default: isDefault,
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            onSaved();
            onClose();
        } catch (e: any) {
            alert('更新失败: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white p-6 rounded shadow" onClick={e => e.stopPropagation()}>
                <h3 className="mb-4 text-lg">编辑供应商</h3>
                <input className="mb-2 w-full" value={name} onChange={e => setName(e.target.value)} />
                <input className="mb-2 w-full" value={abbreviation} onChange={e => setAbbreviation(e.target.value)} />
                <input className="mb-2 w-full" value={apiKey} onChange={e => setApiKey(e.target.value)} />
                <input className="mb-2 w-full" value={apiUrl} onChange={e => setApiUrl(e.target.value)} />
                <label className="flex items-center mb-4">
                    <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} />
                    <span className="ml-2">设为默认</span>
                </label>
                <div className="flex justify-end space-x-2">
                    <button onClick={onClose} className="px-4 py-1 border rounded">取消</button>
                    <button onClick={handleSubmit} disabled={loading} className="px-4 py-1 bg-blue-600 text-white rounded">
                        {loading ? '保存中…' : '保存'}
                    </button>
                </div>
            </div>
        </div>
    );
}