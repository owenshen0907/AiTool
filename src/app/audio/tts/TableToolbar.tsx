// File: src/app/audio/tts/TableToolbar.tsx
'use client';

import React, { FC, useState, useEffect } from 'react';
import { Plus, Download } from 'lucide-react';
import SupplierModelSelector from '@/app/components/info/SupplierModelSelector';
import type { Supplier, Model } from '@/lib/models/model';

/* -------------------------------------------------------------------------- */
/*                                    Props                                   */
/* -------------------------------------------------------------------------- */
export interface TableToolbarProps {
    onAddCase: () => void;
    supplierId: string;
    onSupplierChange: (value: string) => void;
    model: string;
    onModelChange: (name: string) => void;
    concurrency: number;
    onConcurrencyChange: (n: number) => void;
    onStartTest: () => void;
    testing: boolean;
    onExportResults: () => void;
}

/* -------------------------------------------------------------------------- */
/*                                Component                                   */
/* -------------------------------------------------------------------------- */
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
                                                 onExportResults,
                                             }) => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [models, setModels]       = useState<Model[]>([]);
    // 如果要通过 WSS URL 连接，就设为 true
    const connectViaWSS = true;

    /* 拉供应商列表（挂载时） */
    useEffect(() => {
        fetch('/api/suppliers')
            .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
            .then((data: Supplier[]) => {
                // 按 isDefault 排序，把默认放前面
                data.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
                setSuppliers(data);

                // 只在初次挂载时设默认
                if (!supplierId && data.length) {
                    const def = data.find(s => s.isDefault) || data[0];
                    // 优先用 wssUrl，否则用 id
                    const val = connectViaWSS
                        ? (def.wssUrl || def.id)
                        : def.id;
                    onSupplierChange(val);
                }
            })
            .catch(console.error);
    }, []);

    /* 拉模型列表（依赖 supplierId） */
    useEffect(() => {
        if (!supplierId) return;
        fetch(`/api/suppliers/models?supplier_id=${encodeURIComponent(supplierId)}`)
            .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
            .then((data: Model[]) => {
                data.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
                setModels(data);

                // 如果当前 model 不在新列表里，重置一个默认模型
                if (!data.some(m => m.name === model) && data.length) {
                    const defM = data.find(m => m.isDefault) || data[0];
                    onModelChange(defM.name);
                }
            })
            .catch(console.error);
    }, [supplierId]);

    return (
        <div className="flex flex-wrap items-center gap-4 mb-4">
            {/* 添加 Case */}
            <button
                onClick={onAddCase}
                className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded"
            >
                <Plus size={16} /> 添加 Case
            </button>

            {/* 供应商 & 模型 选择 */}
            <SupplierModelSelector
                // 只显示带 wssUrl 的供应商
                suppliers={connectViaWSS
                    ? suppliers.filter(s => !!s.wssUrl)
                    : suppliers}
                selectedSupplierId={supplierId}
                onSupplierChange={onSupplierChange}
                models={models}
                selectedModelName={model}
                onModelChange={onModelChange}
                filterModelType="audio"
                connectViaWSS={connectViaWSS}
            />

            {/* 并发数 */}
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

            {/* 开始测试 */}
            <button
                onClick={onStartTest}
                disabled={testing}
                className="px-3 py-1 bg-green-500 text-white rounded disabled:opacity-50"
            >
                {testing ? '测试中…' : '开始测试'}
            </button>

            {/* 导出结果 */}
            <div className="ml-auto">
                <button
                    onClick={onExportResults}
                    className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded"
                >
                    <Download size={16} /> 导出结果
                </button>
            </div>
        </div>
    );
};

export default TableToolbar;