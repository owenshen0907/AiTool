// File: src/app/components/common/DataImport/DataImportManager.tsx
'use client';

import React, { useState } from 'react';
import type { ColumnDef } from './ImportPreviewModal';
import { ImportPreviewModal } from './ImportPreviewModal';

export type { ColumnDef };

export interface DataImportManagerProps<T extends { id: string; selected?: boolean }> {
    /** 现有行数据，用于导出含数据模板 */
    existingRows: T[];
    /** 执行导出空模板 */
    exportTemplate: () => void;
    /** 执行导出含数据模板 */
    exportWithData: (rows: T[]) => void;
    /** 解析上传文件，返回待导入行 */
    parseImportFile: (file: File, existingCount: number) => Promise<T[]>;
    /** 列定义 */
    columns: ColumnDef<T>[];
    /** 确认导入后回调 */
    onImportConfirmed: (rows: T[]) => void;
}

export default function DataImportManager<T extends { id: string; selected?: boolean }>({
                                                                                            existingRows,
                                                                                            exportTemplate,
                                                                                            exportWithData,
                                                                                            parseImportFile,
                                                                                            columns,
                                                                                            onImportConfirmed,
                                                                                        }: DataImportManagerProps<T>) {
    const [parsedRows, setParsedRows] = useState<T[]>([]);
    const [showPreview, setShowPreview] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const rows = await parseImportFile(file, existingRows.length);
            setParsedRows(rows);
            setShowPreview(true);
        }
        e.target.value = '';
    };

    return (
        <div className="space-y-4">
            <div className="flex space-x-2">
                <button onClick={exportTemplate} className="px-3 py-1 bg-blue-600 text-white rounded">
                    导出模板
                </button>
                <button
                    onClick={() => exportWithData(existingRows)}
                    className="px-3 py-1 bg-green-600 text-white rounded"
                >
                    导出模板（含数据）
                </button>
                <label className="px-3 py-1 bg-gray-600 text-white rounded cursor-pointer relative overflow-hidden">
                    上传数据
                    <input
                        type="file"
                        accept=".csv,.xlsx"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                    />
                </label>
            </div>

            <ImportPreviewModal
                visible={showPreview}
                rows={parsedRows}
                columns={columns}
                onCancel={() => setShowPreview(false)}
                onConfirm={newRows => {
                    onImportConfirmed(newRows);
                    setShowPreview(false);
                }}
            />
        </div>
    );
}
