// File: app/prompt/case/content/ImportPreviewModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import type { CaseRow } from './CaseTable';

interface Props {
    visible: boolean;
    rows: CaseRow[];
    onCancel: () => void;
    onConfirm: (selectedRows: CaseRow[]) => void;
}

export default function ImportPreviewModal({ visible, rows, onCancel, onConfirm }: Props) {
    // 内部预览数据
    const [preview, setPreview] = useState<CaseRow[]>([]);

    // 每次打开或 rows 改变，同步到 preview
    useEffect(() => {
        if (visible) {
            // 拷贝一份，确保 selected 字段存在
            setPreview(rows.map(r => ({ ...r })));
        }
    }, [visible, rows]);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white w-[90vw] max-w-3xl p-4 rounded shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">预览并选择要导入的 Case</h2>
                    <button onClick={onCancel} title="关闭"><X size={20} /></button>
                </div>
                <div className="max-h-[60vh] overflow-auto border mb-4">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 sticky top-0">
                        <tr>
                            <th className="border px-2 py-1 w-8">选</th>
                            <th className="border px-2 py-1 w-12">序号</th>
                            <th className="border px-2 py-1">Case</th>
                            <th className="border px-2 py-1">Ground Truth</th>
                        </tr>
                        </thead>
                        <tbody>
                        {preview.map((r, i) => (
                            <tr key={r.id} className="hover:bg-gray-50">
                                {/* 复选框 */}
                                <td className="border px-2 py-1 text-center">
                                    <input
                                        type="checkbox"
                                        checked={!!r.selected}
                                        onChange={() =>
                                            setPreview(prev => {
                                                const copy = prev.slice();
                                                copy[i] = { ...copy[i], selected: !copy[i].selected };
                                                return copy;
                                            })
                                        }
                                    />
                                </td>
                                {/* 序号 */}
                                <td className="border px-2 py-1 text-center">{i + 1}</td>
                                {/* Case 可编辑 */}
                                <td className="border px-2 py-1">
                                    <input
                                        value={r.caseText ?? ''}
                                        onChange={e =>
                                            setPreview(prev => {
                                                const copy = prev.slice();
                                                copy[i] = { ...copy[i], caseText: e.target.value };
                                                return copy;
                                            })
                                        }
                                        className="w-full border p-1 rounded"
                                    />
                                </td>
                                {/* Ground Truth 可编辑 */}
                                <td className="border px-2 py-1">
                                    <input
                                        value={r.groundTruth ?? ''}
                                        onChange={e =>
                                            setPreview(prev => {
                                                const copy = prev.slice();
                                                copy[i] = { ...copy[i], groundTruth: e.target.value };
                                                return copy;
                                            })
                                        }
                                        className="w-full border p-1 rounded"
                                    />
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={onCancel}
                        className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                    >
                        取消
                    </button>
                    <button
                        onClick={() => onConfirm(preview.filter(r => r.selected))}
                        className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 flex items-center gap-1"
                    >
                        <Check size={16} /> 确认导入
                    </button>
                </div>
            </div>
        </div>
    );
}