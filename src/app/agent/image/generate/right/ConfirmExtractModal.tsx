// File: src/app/agent/image/right/ConfirmExtractModal.tsx
'use client';

import React from 'react';

interface Props {
    open: boolean;
    extraNote: string;
    onChangeExtraNote: (v: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmExtractModal({
                                                open,
                                                extraNote,
                                                onChangeExtraNote,
                                                onConfirm,
                                                onCancel
                                            }: Props) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded shadow-lg w-full max-w-md p-5 space-y-4">
                <h3 className="text-lg font-semibold">重复抽取意图？</h3>
                <p className="text-sm text-gray-600">
                    检测到已有意图内容，确认后将使用新内容替换现有意图。<br/>
                    可填写补充说明以微调本次抽取：
                </p>
                <textarea
                    className="w-full border rounded p-2 h-28 text-sm resize-none"
                    placeholder="可选：补充说明（例如：突出语气变化、添加更多示例）"
                    value={extraNote}
                    onChange={e => onChangeExtraNote(e.target.value)}
                />
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 text-sm"
                    >
                        取消
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
                    >
                        确认抽取
                    </button>
                </div>
            </div>
        </div>
    );
}