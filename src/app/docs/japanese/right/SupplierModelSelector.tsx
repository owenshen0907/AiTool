// File: src/app/docs/japanese/SupplierModelSelector.tsx
'use client';

import React, { useState, useEffect } from 'react';

export interface Supplier { id: string; name: string; isDefault?: boolean; apiKey: string; apiUrl: string; }
export interface ModelItem { id: string; name: string; modelType: string; isDefault?: boolean; supportsImageInput: boolean; }

interface Props {
    supplierId: string;
    onSupplierChange: (id: string) => void;
    model: string;
    onModelChange: (name: string) => void;
    className?: string;
}

export default function SupplierModelSelector({ supplierId, onSupplierChange, model, onModelChange, className = '' }: Props) {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [models, setModels] = useState<ModelItem[]>([]);

    useEffect(() => {
        fetch('/api/suppliers')
            .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
            .then((data: Supplier[]) => {
                data.sort((a,b) => Number(b.isDefault) - Number(a.isDefault));
                setSuppliers(data);
                if (!supplierId && data.length) onSupplierChange(data.find(s=>s.isDefault)?.id||data[0].id);
            }).catch(console.error);
    }, []);

    useEffect(() => {
        if (!supplierId) return setModels([]);
        fetch(`/api/suppliers/models?supplier_id=${supplierId}`)
            .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
            .then((data: ModelItem[]) => {
                const filtered = data.filter(m => m.modelType==='chat' && m.supportsImageInput);
                filtered.sort((a,b) => Number(b.isDefault)-Number(a.isDefault));
                setModels(filtered);
                if (!filtered.find(m=>m.name===model) && filtered.length) onModelChange(filtered.find(m=>m.isDefault)?.name||filtered[0].name);
            }).catch(console.error);
    }, [supplierId]);

    return (
        <div className={`flex items-center space-x-2 ${className}`}>
            <select value={supplierId} onChange={e=>onSupplierChange(e.target.value)}
                    className="border rounded px-3 py-2 text-base truncate">
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={model} onChange={e=>onModelChange(e.target.value)}
                    className="border rounded px-3 py-2 text-base truncate">
                {models.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
        </div>
    );
}