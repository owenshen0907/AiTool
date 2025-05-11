// File: app/prompt/case/content/DetailModal.tsx
'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import DiffViewer from 'react-diff-viewer-continued';
import type { CaseRow } from './CaseTable';

export interface DetailModalProps {
    visible: boolean;
    row: CaseRow;
    onClose: () => void;
    /** 保存评估后的是否通过 & 原因 */
    onSave: (updated: Partial<CaseRow>) => void;
}

export default function DetailModal({
                                        visible,
                                        row,
                                        onClose,
                                        onSave,
                                    }: DetailModalProps) {
    const [passed, setPassed] = useState<boolean | null>(row.passed ?? null);
    const [reason, setReason] = useState(row.reason ?? '');

    if (!visible) return null;

    const handleSave = () => {
        onSave({ id: row.id, passed: passed ?? false, reason });
        onClose();
    };

    return createPortal(
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="
          bg-white
          rounded-lg
          resize-both overflow-auto
          w-4/5 max-w-[95vw]
          h-4/5 max-h-[95vh]
          shadow-lg
        "
                onClick={e => e.stopPropagation()}
            >
                {/* header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold">Case 详情</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 flex flex-col gap-6 h-full overflow-auto">
                    {/* 可折叠 Case */}
                    <details className="border rounded">
                        <summary className="cursor-pointer px-4 py-2 bg-gray-100 font-medium">
                            Case
                        </summary>
                        <pre className="p-4 whitespace-pre-wrap">{row.caseText}</pre>
                    </details>

                    {/* Ground Truth vs 测试结果 对比 */}
                    <div className="flex-1">
                        <div className="font-medium mb-2">Ground Truth vs 测试结果 对比</div>
                        <div className="h-full overflow-auto border rounded">
                            <DiffViewer
                                oldValue={row.groundTruth}
                                newValue={row.testResult ?? ''}
                                splitView={true}
                                onlyHighlightChanges={true}
                                styles={{
                                    variables: {
                                        light: {
                                            diffViewerBackground: '#f7f9fc',
                                            addedBackground: '#e6ffed',
                                            removedBackground: '#ffeef0',
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div>

                    {/* 编辑 & 保存 */}
                    <div className="flex items-start space-x-8">
                        <div>
                            <div className="font-medium mb-1">是否通过</div>
                            <select
                                value={passed == null ? '' : passed ? '1' : '0'}
                                onChange={e => setPassed(e.target.value === '1')}
                                className="border p-2 rounded"
                            >
                                <option value="" disabled>
                                    请选择
                                </option>
                                <option value="1">✅ 合格</option>
                                <option value="0">❌ 不合格</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <div className="font-medium mb-1">原因</div>
                            <textarea
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                rows={3}
                                className="w-full border p-2 rounded resize-none"
                                placeholder="请输入评估原因"
                            />
                        </div>
                    </div>

                    {/* 按钮 */}
                    <div className="flex justify-end space-x-2 pt-2 border-t">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            保存
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}