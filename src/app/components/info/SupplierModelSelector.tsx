// File: src/app/components/info/SupplierModelSelector.tsx
'use client';

import React, { useEffect, useState } from 'react';
import type { Supplier, Model } from '@/lib/models/model';

export interface SupplierModelSelectorProps {
    suppliers: Supplier[];
    /** 父组件中的 当前供应商 ID 或 WSS URL */
    selectedSupplierId: string;
    onSupplierChange: (value: string) => void;
    models: Model[];
    /** 父组件中的 当前模型名称 */
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
    // 本地 state，用于下拉选中
    const [localSupplier, setLocalSupplier] = useState(selectedSupplierId);
    const [localModel, setLocalModel] = useState(selectedModelName);

    // 过滤模型
    const filteredModels = models.filter(m => m.modelType === filterModelType);

    // 第一次或 suppliers 变化：选默认供应商
    useEffect(() => {
        if (suppliers.length) {
            const def = suppliers.find(s => s.isDefault) || suppliers[0];
            const val = connectViaWSS ? (def.wssUrl || def.id) : def.id;
            setLocalSupplier(val);
            onSupplierChange(val);
        }
    }, [suppliers, connectViaWSS, onSupplierChange]);

    // 第一次或 filteredModels 变化：选默认模型
    useEffect(() => {
        if (filteredModels.length) {
            const def = filteredModels.find(m => m.isDefault) || filteredModels[0];
            setLocalModel(def.name);
            onModelChange(def.name);
        }
    }, [filteredModels, onModelChange]);

    return (
        <div className="flex items-center space-x-2">
            {/* 供应商下拉 */}
            <select
                value={localSupplier}
                onChange={e => {
                    const sup = suppliers.find(s => s.id === e.target.value);
                    if (sup) {
                        const val = connectViaWSS ? (sup.wssUrl || sup.id) : sup.id;
                        setLocalSupplier(val);
                        onSupplierChange(val);
                    }
                }}
                className="border rounded px-3 py-1"
            >
                {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                        {s.name}
                        {connectViaWSS && s.wssUrl ? ' (WSS)' : ''}
                    </option>
                ))}
            </select>

            {/* 模型下拉 */}
            <select
                value={localModel}
                onChange={e => {
                    setLocalModel(e.target.value);
                    onModelChange(e.target.value);
                }}
                disabled={!localSupplier}
                className="border rounded px-3 py-1 disabled:opacity-50"
            >
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