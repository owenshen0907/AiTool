// src/app/prompt/manage/ImportCasesModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import type { GoodCaseItem, BadCaseItem } from '@/lib/models/prompt/prompt';
import { X } from 'lucide-react';

export interface ImportCasesModalProps {
    /** 控制弹窗显示 */
    open: boolean;
    /** 导入的好例数据 */
    importGood: GoodCaseItem[];
    /** 导入的坏例数据 */
    importBad: BadCaseItem[];
    /** 关闭弹窗 */
    onCancel: () => void;
    /**
     * 确认导入
     * @param replace 是否替换（true 替换，false 新增）
     * @param selectedGood 选中的好例
     * @param selectedBad 选中的坏例
     */
    onConfirm: (
        replace: boolean,
        selectedGood: GoodCaseItem[],
        selectedBad: BadCaseItem[]
    ) => void;
}

export default function ImportCasesModal({
                                             open,
                                             importGood,
                                             importBad,
                                             onCancel,
                                             onConfirm,
                                         }: ImportCasesModalProps) {
    const [goodList, setGoodList] = useState<(GoodCaseItem & { selected: boolean })[]>(
        importGood.map(g => ({ ...g, selected: true }))
    );
    const [badList, setBadList] = useState<(BadCaseItem & { selected: boolean })[]>(
        importBad.map(b => ({ ...b, selected: true }))
    );
    const [replaceMode, setReplaceMode] = useState(false);

    useEffect(() => {
        setGoodList(importGood.map(g => ({ ...g, selected: true })));
        setBadList(importBad.map(b => ({ ...b, selected: true })));
    }, [importGood, importBad]);

    if (!open) return null;

    const toggleGood = (idx: number) => {
        setGoodList(prev => {
            const arr = [...prev];
            arr[idx].selected = !arr[idx].selected;
            return arr;
        });
    };
    const updateGood = (idx: number, key: keyof GoodCaseItem, value: any) => {
        setGoodList(prev => {
            const arr = [...prev];
            arr[idx] = { ...arr[idx], [key]: value };
            return arr;
        });
    };

    const toggleBad = (idx: number) => {
        setBadList(prev => {
            const arr = [...prev];
            arr[idx].selected = !arr[idx].selected;
            return arr;
        });
    };
    const updateBad = (idx: number, key: keyof BadCaseItem, value: any) => {
        setBadList(prev => {
            const arr = [...prev];
            arr[idx] = { ...arr[idx], [key]: value };
            return arr;
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black opacity-50" onClick={onCancel} />
            <div className="relative bg-white rounded-lg shadow-lg w-[90%] max-w-3xl p-6 space-y-4 z-10">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">预览导入数据</h2>
                    <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
                        <X />
                    </button>
                </div>

                {/* Imported Good Cases */}
                <div className="flex-1 overflow-auto max-h-64">
                    <h3 className="font-medium mb-2">好例 (Good Cases)</h3>
                    {goodList.map((g, i) => (
                        <div key={i} className="flex items-center space-x-2 mb-2">
                            <input
                                type="checkbox"
                                checked={g.selected}
                                onChange={() => toggleGood(i)}
                                className="form-checkbox"
                            />
                            <input
                                className="flex-1 border px-2 py-1 rounded"
                                value={g.user_input}
                                onChange={e => updateGood(i, 'user_input', e.target.value)}
                                placeholder="用户输入"
                            />
                            <input
                                className="flex-1 border px-2 py-1 rounded"
                                value={g.expected}
                                onChange={e => updateGood(i, 'expected', e.target.value)}
                                placeholder="期望输出"
                            />
                        </div>
                    ))}
                </div>

                {/* Imported Bad Cases */}
                <div className="flex-1 overflow-auto max-h-64">
                    <h3 className="font-medium mb-2">坏例 (Bad Cases)</h3>
                    {badList.map((b, i) => (
                        <div key={i} className="flex items-center space-x-2 mb-2">
                            <input
                                type="checkbox"
                                checked={b.selected}
                                onChange={() => toggleBad(i)}
                                className="form-checkbox"
                            />
                            <input
                                className="w-1/3 border px-2 py-1 rounded"
                                value={b.user_input}
                                onChange={e => updateBad(i, 'user_input', e.target.value)}
                                placeholder="用户输入"
                            />
                            <input
                                className="w-1/3 border px-2 py-1 rounded"
                                value={b.bad_output}
                                onChange={e => updateBad(i, 'bad_output', e.target.value)}
                                placeholder="模型不佳输出"
                            />
                            <input
                                className="w-1/3 border px-2 py-1 rounded"
                                value={b.expected}
                                onChange={e => updateBad(i, 'expected', e.target.value)}
                                placeholder="期望输出"
                            />
                        </div>
                    ))}
                </div>

                {/* Replace vs Append */}
                <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-1">
                        <input
                            type="radio"
                            name="mode"
                            checked={!replaceMode}
                            onChange={() => setReplaceMode(false)}
                        />
                        <span>新增</span>
                    </label>
                    <label className="flex items-center space-x-1">
                        <input
                            type="radio"
                            name="mode"
                            checked={replaceMode}
                            onChange={() => setReplaceMode(true)}
                        />
                        <span>替换</span>
                    </label>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    >
                        取消
                    </button>
                    <button
                        onClick={() =>
                            onConfirm(
                                replaceMode,
                                goodList.filter(g => g.selected),
                                badList.filter(b => b.selected)
                            )
                        }
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        确认导入
                    </button>
                </div>
            </div>
        </div>
    );
}