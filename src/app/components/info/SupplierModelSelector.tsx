// File: src/app/components/info/SupplierModelSelector.tsx
'use client';

import React from 'react';
import type { Supplier, Model } from '@/lib/models/model';

export interface SupplierModelSelectorProps {
    suppliers: Supplier[];
    /** 当前供应商 ID 或 WSS URL */
    selectedSupplierId: string;
    onSupplierChange: (value: string) => void;
    models: Model[];
    /** 当前模型名称 */
    selectedModelName: string;
    onModelChange: (name: string) => void;
    /** 只展示此类型模型 */
    filterModelType?: Model['modelType'];
    /** 切换供应商时是否传 wssUrl */
    connectViaWSS?: boolean;
}

export default function SupplierModelSelector({
                                                  suppliers,
                                                  selectedSupplierId,
                                                  onSupplierChange,
                                                  models,
                                                  selectedModelName,
                                                  onModelChange,
                                                  filterModelType = 'chat',
                                                  connectViaWSS = false,
                                              }: SupplierModelSelectorProps) {
    // 根据 filterModelType 做一次过滤
    const filteredModels = models.filter(m => m.modelType === filterModelType);

    return (
        <div className="flex items-center space-x-2">
            {/* 供应商下拉，value 由父组件的 selectedSupplierId 决定 */}
            <select
                value={selectedSupplierId}
                // onChange={e => {
                //     const sup = suppliers.find(s => s.id === e.target.value);
                //     if (!sup) return;
                //     const val = connectViaWSS
                //         ? (sup.wssUrl || sup.id)
                //         : sup.id;
                //     onSupplierChange(val);
                // }}
                onChange={e => onSupplierChange(e.target.value)}
                className="border rounded px-3 py-1"
            >
                <option value="" disabled>
                    选择供应商
                </option>
                {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                        {s.name}{s.wssUrl ? ' (WSS)' : ''}
                    </option>
                ))}
            </select>

            {/* 模型下拉，value 由父组件的 selectedModelName 决定 */}
            <select
                value={selectedModelName}
                onChange={e => onModelChange(e.target.value)}
                disabled={!selectedSupplierId || filteredModels.length === 0}
                className="border rounded px-3 py-1 disabled:opacity-50"
            >
                <option value="" disabled>
                    选择模型
                </option>
                {filteredModels.map(m => (
                    <option key={m.id} value={m.name}>
                        {m.name}
                        {m.isDefault ? ' (默认)' : ''}
                    </option>
                ))}
            </select>
        </div>
    );
}