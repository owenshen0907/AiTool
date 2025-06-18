
// File: src/app/components/info/SupplierSidebar.tsx
'use client';

import React from 'react';
import type { Supplier } from '@/lib/models/model';

interface SidebarProps {
    suppliers: Supplier[];
    selectedSupplier: Supplier | null;
    onSelect: (s: Supplier) => void;
    onAdd: () => void;
}

export default function SupplierSidebar({ suppliers, selectedSupplier, onSelect, onAdd }: SidebarProps) {
    return (
        <div className="w-1/4 bg-white p-6 overflow-auto">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-700">供应商列表</h4>
                <button
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                    onClick={onAdd}
                >新增</button>
            </div>
            <ul className="space-y-2">
                {suppliers.map(s => (
                    <li
                        key={s.id}
                        className={`px-4 py-2 rounded-lg cursor-pointer flex justify-between items-center transition ${
                            selectedSupplier?.id === s.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
                        }`}
                        onClick={() => onSelect(s)}
                    >
                        <span>{s.name}</span>
                        {s.isDefault && <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">默认</span>}
                    </li>
                ))}
            </ul>
        </div>
    );
}