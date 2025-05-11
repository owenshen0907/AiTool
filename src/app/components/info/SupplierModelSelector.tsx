'use client';

import React from 'react';
import type { Supplier, Model } from '@/lib/models/model';

export interface SupplierModelSelectorProps {
    suppliers: Supplier[];
    selectedSupplierId: string;
    onSupplierChange: (id: string) => void;
    models: Model[];
    selectedModel: string;
    onModelChange: (name: string) => void;
}

export default function SupplierModelSelector({
                                                  suppliers,
                                                  selectedSupplierId,
                                                  onSupplierChange,
                                                  models,
                                                  selectedModel,
                                                  onModelChange,
                                              }: SupplierModelSelectorProps) {
    return (
        <div className="flex items-center space-x-2">
            <select
                value={selectedSupplierId}
                onChange={e => onSupplierChange(e.target.value)}
                className="border rounded px-3 py-1"
            >
                <option value="">选择供应商</option>
                {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                        {s.name}
                    </option>
                ))}
            </select>

            <select
                value={selectedModel}
                onChange={e => onModelChange(e.target.value)}
                disabled={!selectedSupplierId}
                className="border rounded px-3 py-1 disabled:opacity-50"
            >
                <option value="">选择模型</option>
                {models.map(m => (
                    <option key={m.id} value={m.name}>
                        {m.name}
                    </option>
                ))}
            </select>
        </div>
    );
}