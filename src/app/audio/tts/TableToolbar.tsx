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
    /** 新增一条 Case 行 */
    onAddCase: () => void;

    /** 供应商（或 wssUrl，取决于 connectViaWSS） */
    supplierId: string;
    onSupplierChange: (value: string) => void;

    /** 模型 */
    model: string;
    onModelChange: (name: string) => void;

    /** 并发数 */
    concurrency: number;
    onConcurrencyChange: (n: number) => void;

    /** 开始测试 */
    onStartTest: () => void;
    testing: boolean;

    /** 导出结果（PDF / Excel 等） */
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
    /* ------------- 本地状态 ------------- */
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [models, setModels] = useState<Model[]>([]);

    /* ------------- 拉供应商列表 ------------- */
    useEffect(() => {
        fetch('/api/suppliers')
            .then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
            .then((data: Supplier[]) => {
                data.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
                setSuppliers(data);

                /* 默认选中 */
                if (!supplierId && data.length) {
                    const def = data.find((s) => s.isDefault) || data[0];
                    onSupplierChange(def.id);
                }
            })
            .catch(console.error);
    }, [supplierId]);

    /* ------------- 拉模型列表 ------------- */
    useEffect(() => {
        if (!supplierId) return;
        const sup = suppliers.find(
            (s) => s.id === supplierId || s.wssUrl === supplierId
        );
        const idParam = sup ? sup.id : supplierId;

        fetch(`/api/models?supplier_id=${idParam}`)
            .then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
            .then((data: Model[]) => {
                data.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
                setModels(data);

                /* 默认模型 */
                if (!data.some((m) => m.name === model) && data.length) {
                    const defM = data.find((m) => m.isDefault) || data[0];
                    onModelChange(defM.name);
                }
            })
            .catch(console.error);
    }, [supplierId, suppliers]);

    /* ---------------------------------------------------------------------- */
    /*                                 Render                                 */
    /* ---------------------------------------------------------------------- */
    return (
        <div className="flex flex-wrap items-center gap-4 mb-4">
            {/* -------- 添加 Case -------- */}
            <button
                onClick={onAddCase}
                className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded"
            >
                <Plus size={16} /> 添加 Case
            </button>

            {/* -------- 供应商 & 模型选择 -------- */}
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

            {/* -------- 并发输入 -------- */}
            <div className="flex items-center">
                <label className="text-sm mr-1">并发</label>
                <input
                    type="number"
                    min={1}
                    max={50}
                    value={concurrency}
                    onChange={(e) => onConcurrencyChange(+e.target.value)}
                    className="w-16 border rounded p-1"
                />
            </div>

            {/* -------- 开始测试 -------- */}
            <button
                onClick={onStartTest}
                disabled={testing}
                className="px-3 py-1 bg-green-500 text-white rounded disabled:opacity-50"
            >
                {testing ? '测试中…' : '开始测试'}
            </button>

            {/* -------- 导出结果 -------- */}
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