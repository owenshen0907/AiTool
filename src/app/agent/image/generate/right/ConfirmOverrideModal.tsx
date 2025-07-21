// File: src/app/agent/image/right/ConfirmOverrideModal.tsx
'use client';

import React from 'react';

interface Props {
    open: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    extraNote: string;
    onChangeExtraNote: (v: string) => void;
    intentTitle?: string;
}

export default function ConfirmOverrideModal({
                                                 open,
                                                 onCancel,
                                                 onConfirm,
                                                 extraNote,
                                                 onChangeExtraNote,
                                                 intentTitle
                                             }: Props) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded shadow-lg w-full max-w-md p-5 space-y-4">
                <h3 className="text-lg font-semibold">覆盖已有内容？</h3>
                <p className="text-sm text-gray-600">
                    当前正文已由意图
                    <span className="font-semibold">
            {intentTitle ? `「${intentTitle}」` : ''}
          </span>
                    生成。再次生成将覆盖现有内容。可填写补充说明对本次生成进行微调。
                </p>
                <textarea
                    className="w-full border rounded p-2 h-28 text-sm resize-none"
                    placeholder="可选：补充说明（例：增加对比、添加更多例句、突出敬语层级差异）"
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
                        覆盖生成
                    </button>
                </div>
            </div>
        </div>
    );
}