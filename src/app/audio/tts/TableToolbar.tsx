// File: src/app/audio/tts/TableToolbar.tsx
'use client';

import React, { FC, useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import SupplierModelSelector from '@/app/components/info/SupplierModelSelector';
import type { Supplier, Model } from '@/lib/models/model';

export interface TableToolbarProps {
    onAddCase: () => void;
    /** 可能是 supplierId 或 wssUrl，根据 connectViaWSS */
    supplierId: string;
    onSupplierChange: (value: string) => void;
    model: string;
    onModelChange: (name: string) => void;
    concurrency: number;
    onConcurrencyChange: (n: number) => void;
    onStartTest: () => void;
    testing: boolean;
}

const TableToolbar: FC<TableToolbarProps> = ({
                                                 onAddCase,
                                                 supplierId,
                                                 onSupplierChange,
                                                 model,
                                                 onModelChange,
                                                 concurrency,
                                                 onConcurrencyChange,
                                                 onStartTest,
                                                 testing,
                                             }) => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [models, setModels] = useState<Model[]>([]);

    // 拉供应商列表
    useEffect(() => {
        fetch('/api/suppliers')
            .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
            .then((data: Supplier[]) => {
                data.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
                setSuppliers(data);
                // 默认选择
                if (!supplierId && data.length) {
                    const def = data.find(s => s.isDefault) || data[0];
                    onSupplierChange(def.id);
                }
            })
            .catch(console.error);
    }, [supplierId]);

    // 拉模型列表
    useEffect(() => {
        if (!supplierId) return;
        // 如果是 wssUrl，则需反查对应 supplierId
        const sup = suppliers.find(s => s.id === supplierId || s.wssUrl === supplierId);
        const idParam = sup ? sup.id : supplierId;
        fetch(`/api/models?supplier_id=${idParam}`)
            .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
            .then((data: Model[]) => {
                data.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
                setModels(data);
                // 默认选中 audio 类型下的默认模型
                if (!data.some(m => m.name === model) && data.length) {
                    const defM = data.find(m => m.isDefault) || data[0];
                    onModelChange(defM.name);
                }
            })
            .catch(console.error);
    }, [supplierId, suppliers]);

    return (
        <div className="flex space-x-4 mb-4">
            <button
                onClick={onAddCase}
                className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded"
            >
                <Plus size={16} /> 添加 Case
            </button>

            <SupplierModelSelector
                suppliers={suppliers}
                selectedSupplierId={supplierId}
                onSupplierChange={onSupplierChange}
                models={models}
                selectedModelName={model}
                onModelChange={onModelChange}
                filterModelType="audio"
                connectViaWSS={true}
            />

            <div className="flex items-center">
                <label className="text-sm mr-1">并发</label>
                <input
                    type="number"
                    min={1}
                    max={50}
                    value={concurrency}
                    onChange={e => onConcurrencyChange(+e.target.value)}
                    className="w-16 border rounded p-1"
                />
            </div>

            <button
                onClick={onStartTest}
                disabled={testing}
                className="px-3 py-1 bg-green-500 text-white rounded disabled:opacity-50"
            >
                {testing ? '测试中…' : '开始测试'}
            </button>
        </div>
    );
};

export default TableToolbar;
