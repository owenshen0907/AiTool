'use client';

import React, { FC, useState, useEffect } from 'react';
import { Plus, MoreVertical } from 'lucide-react';
import { Menu } from '@headlessui/react';
import SupplierModelSelector from '@/components/info/SupplierModelSelector';
import type { Supplier, Model } from '@/lib/models/model';

export interface TableToolbarProps {
    onAddCase:               () => void;
    onBulkSave:              () => void;
    onExportTemplate:        () => void;
    onExportTemplateWithData:() => void;
    onUploadData:            () => void;
    supplierId:              string;
    onSupplierChange:        (id: string) => void;
    model:                   string;
    onModelChange:           (m: string) => void;
    onStartTest:             () => void;
    onAutoEvaluate:          () => void;
    onSaveTests:             () => void;
    onExportTestResults:     () => void;
    concurrency:             number;
    onConcurrencyChange:     (n: number) => void;
    testing: boolean;
}

const TableToolbar: FC<TableToolbarProps> = ({
                                                 onAddCase,
                                                 onBulkSave,
                                                 onExportTemplate,
                                                 onExportTemplateWithData,
                                                 onUploadData,
                                                 supplierId,
                                                 onSupplierChange,
                                                 model,
                                                 onModelChange,
                                                 onStartTest,
                                                 onAutoEvaluate,
                                                 onSaveTests,
                                                 onExportTestResults,
                                                 concurrency,
                                                 onConcurrencyChange,
                                                 testing,
                                             }) => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [models, setModels]       = useState<Model[]>([]);

    // 拉供应商列表
    useEffect(() => {
        fetch('/api/suppliers')
            .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
            .then((data: Supplier[]) => {
                data.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
                setSuppliers(data);
                if (!supplierId && data.length) {
                    const def = data.find(s => s.isDefault) || data[0];
                    onSupplierChange(def.id);
                }
            })
            .catch(console.error);
    }, []);

    // 拉模型列表
    useEffect(() => {
        if (!supplierId) {
            setModels([]);
            return;
        }
        fetch(`/api/models?supplier_id=${supplierId}`)
            .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
            .then((data: Model[]) => {
                data.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
                setModels(data);
                if (!data.find(m => m.name === model) && data.length) {
                    const defM = data.find(m => m.isDefault) || data[0];
                    onModelChange(defM.name);
                }
            })
            .catch(console.error);
    }, [supplierId]);

    return (
        <thead>
        <tr>
            {/* Case 操作区 */}
            <th colSpan={4} className="border px-2 py-1 bg-gray-50">
                <div className="flex justify-end items-center gap-2">
                    <button
                        onClick={onAddCase}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded"
                    >
                        <Plus size={16} /> 新增 Case
                    </button>
                    <button
                        onClick={onBulkSave}
                        className="px-2 py-1 bg-green-600 text-white rounded"
                    >
                        批量保存
                    </button>
                    <Menu as="div" className="relative inline-block text-left">
                        <Menu.Button className="p-1 hover:bg-gray-200 rounded">
                            <MoreVertical size={16} />
                        </Menu.Button>
                        <Menu.Items className="absolute right-0 mt-2 w-44 bg-white border shadow rounded">
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={onExportTemplate}
                                        className={`${active ? 'bg-gray-100' : ''} w-full text-left px-4 py-2`}
                                    >
                                        导出模版
                                    </button>
                                )}
                            </Menu.Item>
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={onExportTemplateWithData}
                                        className={`${active ? 'bg-gray-100' : ''} w-full text-left px-4 py-2`}
                                    >
                                        导出模版（含数据）
                                    </button>
                                )}
                            </Menu.Item>
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={onUploadData}
                                        className={`${active ? 'bg-gray-100' : ''} w-full text-left px-4 py-2`}
                                    >
                                        上传数据
                                    </button>
                                )}
                            </Menu.Item>
                        </Menu.Items>
                    </Menu>
                </div>
            </th>

            {/* 测试操作区 */}
            <th colSpan={4} className="border px-2 py-1 bg-gray-50">
                <div className="flex justify-end items-center gap-2">
                    <SupplierModelSelector
                        suppliers={suppliers}
                        selectedSupplierId={supplierId}
                        onSupplierChange={onSupplierChange}
                        models={models}
                        selectedModel={model}
                        onModelChange={onModelChange}
                    />
                    {/* 并发设置 */}
                    <div className="flex items-center">
                        <label className="text-sm mr-1">并发</label>
                        <input
                            type="number"
                            min={1}
                            max={50}
                            value={concurrency}
                            onChange={e => onConcurrencyChange(Number(e.target.value))}
                            className="w-16 border rounded px-1 py-1 text-sm"
                        />
                    </div>
                    {/* 开始测试 */}
                    <button
                        onClick={onStartTest}
                        disabled={testing}
                        className={`px-2 py-1 bg-blue-600 text-white rounded disabled:opacity-50 ${testing ? '' : ''}`}
                    >
                        {testing ? '测试中…' : '开始测试'}
                        {testing && <span className="ml-2 animate-spin">⏳</span>}
                    </button>
                    ｜
                    {/* 自动评估结果 */}
                    <button
                        onClick={onAutoEvaluate}
                        className="px-2 py-1 bg-indigo-600 text-white rounded"
                    >
                        自动评估结果
                    </button>
                    <button
                        onClick={onSaveTests}
                        className="px-2 py-1 bg-green-600 text-white rounded"
                    >
                        保存测试结果
                    </button>
                    <button
                        onClick={onExportTestResults}
                        className="px-2 py-1 bg-gray-200 rounded"
                    >
                        导出测试结果
                    </button>
                </div>
            </th>
        </tr>
        </thead>
    );
};

export default TableToolbar;