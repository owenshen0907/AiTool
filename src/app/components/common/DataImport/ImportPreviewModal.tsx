// File: src/app/components/common/DataImport/ImportPreviewModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, ChevronLeft, ChevronRight } from 'lucide-react';

export interface ColumnDef<T> {
    key: keyof T;
    label: string;
    editable?: boolean; // default false
}

interface ImportPreviewModalProps<T extends { id: string; selected?: boolean }> {
    visible: boolean;
    rows: T[];
    columns: ColumnDef<T>[];
    onCancel: () => void;
    onConfirm: (selected: T[]) => void;
}

export function ImportPreviewModal<T extends { id: string; selected?: boolean }>({
                                                                                     visible,
                                                                                     rows,
                                                                                     columns,
                                                                                     onCancel,
                                                                                     onConfirm,
                                                                                 }: ImportPreviewModalProps<T>) {
    const [preview, setPreview] = useState<T[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        if (visible) {
            setPreview(rows.map(r => ({ ...r, selected: !!r.selected })));
            setCurrentPage(1);
        }
    }, [visible, rows]);

    if (!visible) return null;

    const totalPages = Math.max(1, Math.ceil(preview.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const pageRows = preview.slice(startIndex, startIndex + itemsPerPage);
    const allSelected = pageRows.length > 0 && pageRows.every(r => r.selected);

    const toggleSelectAll = () => {
        setPreview(prev => prev.map((r, idx) => {
            if (idx >= startIndex && idx < startIndex + itemsPerPage) {
                return { ...r, selected: !allSelected };
            }
            return r;
        }));
    };

    const handleRowSelect = (idx: number) => {
        setPreview(prev => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], selected: !copy[idx].selected };
            return copy;
        });
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white w-[90vw] max-w-4xl p-4 rounded shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">预览并选择要导入的数据</h2>
                    <button onClick={onCancel} title="关闭"><X size={20} /></button>
                </div>
                <div className="max-h-[60vh] overflow-auto border mb-2">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 sticky top-0">
                        <tr>
                            <th className="border px-2 py-1 w-8 text-center">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th className="border px-2 py-1 w-12 text-center">序号</th>
                            {columns.map(col => (
                                <th key={String(col.key)} className="border px-2 py-1">
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {pageRows.map((row, idx) => {
                            const globalIdx = startIndex + idx;
                            return (
                                <tr key={row.id} className="hover:bg-gray-50">
                                    <td className="border px-2 py-1 text-center">
                                        <input
                                            type="checkbox"
                                            checked={!!row.selected}
                                            onChange={() => handleRowSelect(globalIdx)}
                                        />
                                    </td>
                                    <td className="border px-2 py-1 text-center">{globalIdx + 1}</td>
                                    {columns.map(col => (
                                        <td key={String(col.key)} className="border px-2 py-1">
                                            {col.editable ? (
                                                <input
                                                    className="w-full border p-1 rounded"
                                                    value={(row[col.key] as any) ?? ''}
                                                    onChange={e => {
                                                        setPreview(prev => {
                                                            const copy = [...prev];
                                                            (copy[globalIdx] as any)[col.key] = e.target.value;
                                                            return copy;
                                                        });
                                                    }}
                                                />
                                            ) : (
                                                String(row[col.key] ?? '')
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
                {/* 分页控件 */}
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50 flex items-center"
                    >
                        <ChevronLeft size={16} /> 上一页
                    </button>
                    <span>第 {currentPage} / {totalPages} 页</span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50 flex items-center"
                    >
                        下一页 <ChevronRight size={16} />
                    </button>
                </div>
                <div className="flex justify-end space-x-2">
                    <button onClick={onCancel} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300">取消</button>
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
