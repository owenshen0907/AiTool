'use client';
import React, { useEffect } from 'react';
import type { Supplier, Model } from '@/lib/models/model';

interface Props {
    supplierId: string | null;
    modelName: string | null;
    suppliers: Supplier[];
    supplierLoading: boolean;
    supplierError: string | null;
    models: Model[] | undefined;
    modelLoading: boolean;
    modelError: string | null;
    onSupplierChange: (supplierId: string) => void;
    onModelChange: (modelName: string, modelId?: string) => void;
    requestModels: (supplierId: string) => void;
}

export default function SceneModelPicker({
                                             supplierId,
                                             modelName,
                                             suppliers,
                                             supplierLoading,
                                             supplierError,
                                             models,
                                             modelLoading,
                                             modelError,
                                             onSupplierChange,
                                             onModelChange,
                                             requestModels
                                         }: Props) {

    useEffect(() => {
        if (supplierId && !models && !modelLoading) {
            requestModels(supplierId);
        }
    }, [supplierId, models, modelLoading, requestModels]);

    const modelExists = !!models?.some(m => m.name === modelName);

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <select
                    className="border rounded px-2 py-1 text-sm w-40"
                    value={supplierId || ''}
                    disabled={supplierLoading}
                    onChange={e => {
                        const sid = e.target.value;
                        onSupplierChange(sid);
                    }}
                >
                    <option value="">{supplierLoading ? '加载中...' : '选择供应商'}</option>
                    {suppliers.map(s => (
                        <option key={s.id} value={s.id}>
                            {s.name}{s.isDefault ? ' *' : ''}
                        </option>
                    ))}
                </select>

                <select
                    className="border rounded px-2 py-1 text-sm w-48"
                    value={modelExists ? (modelName || '') : ''}
                    disabled={!supplierId || modelLoading}
                    onChange={e => {
                        const name = e.target.value;
                        const m = models?.find(x => x.name === name);
                        onModelChange(name || '', m?.id);
                    }}
                >
                    <option value="">
                        {!supplierId
                            ? '先选供应商'
                            : modelLoading
                                ? '模型加载中...'
                                : '选择模型'}
                    </option>
                    {models?.map(m => (
                        <option key={m.id} value={m.name}>
                            {m.name}{m.isDefault ? ' *' : ''}
                        </option>
                    ))}
                </select>
            </div>
            <div className="min-h-[14px] text-[11px] text-gray-400">
                {supplierError && <span className="text-red-500">供应商加载失败</span>}
                {modelError && <span className="text-red-500">模型加载失败</span>}
            </div>
        </div>
    );
}