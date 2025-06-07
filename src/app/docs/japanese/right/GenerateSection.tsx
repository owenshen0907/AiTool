// File: src/app/docs/japanese/GenerateSection.tsx
'use client';

import React, { useEffect } from 'react';
import TemplateSelectorModal, { Template } from './TemplateSelectorModal';
import SupplierModelSelector from './SupplierModelSelector';
import { Send } from 'lucide-react';

interface Props {
    feature: string;
    selectedTemplate: Template | null;
    setSelectedTemplate: (tpl: Template) => void;
    noteRequest: string;
    setNoteRequest: (val: string) => void;
    includeExisting: boolean;
    setIncludeExisting: (flag: boolean) => void;
    forceBase64: boolean;
    setForceBase64: (flag: boolean) => void;
    supplierId: string;
    handleSupplierChange: (id: string) => void;
    model: string;
    handleModelChange: (name: string) => void;
    loading: boolean;
    onGenerate: () => void;
    /** 是否已有生成内容 */
    hasContent: boolean;
    /** 是否覆盖已有内容 */
    overwriteExisting: boolean;
    setOverwriteExisting: (flag: boolean) => void;
}

export default function GenerateSection({
                                            feature,
                                            selectedTemplate,
                                            setSelectedTemplate,
                                            noteRequest,
                                            setNoteRequest,
                                            includeExisting,
                                            setIncludeExisting,
                                            forceBase64,
                                            setForceBase64,
                                            supplierId,
                                            handleSupplierChange,
                                            model,
                                            handleModelChange,
                                            loading,
                                            onGenerate,
                                            hasContent,
                                            overwriteExisting,
                                            setOverwriteExisting,
                                        }: Props) {
    const lastSupKey = `lastSupplier_${feature}`;
    const lastModelKey = `lastModel_${feature}`;

    /* ---- 初始化 ---- */
    useEffect(() => {
        // 强制勾选“包含已有笔记”
        if (!includeExisting) setIncludeExisting(true);

        const sup = localStorage.getItem(lastSupKey);
        if (sup) handleSupplierChange(sup);
        const mdl = localStorage.getItem(lastModelKey);
        if (mdl) handleModelChange(mdl);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const actionLabel = hasContent ? '一键优化笔记' : '一键生成笔记';

    return (
        <div className="flex flex-col space-y-4">
            {/* 模板选择 */}
            <div className="flex items-center space-x-2">
                <TemplateSelectorModal feature={feature} onSelect={setSelectedTemplate} />
                {selectedTemplate && (
                    <span className="text-gray-700 truncate" title={selectedTemplate.name}>
            已选模板：{selectedTemplate.name}
          </span>
                )}
            </div>

            {/* 供应商 & 模型 */}
            <SupplierModelSelector
                className="w-full"
                supplierId={supplierId}
                onSupplierChange={handleSupplierChange}
                model={model}
                onModelChange={handleModelChange}
            />

            {/* 强制 Base64 */}
            <label className="inline-flex items-center space-x-2">
                <input
                    type="checkbox"
                    checked={forceBase64}
                    onChange={e => setForceBase64(e.target.checked)}
                    className="h-4 w-4"
                />
                <span>强制使用 Base64</span>
            </label>

            {/* 覆盖已有内容（仅当已有正文时显示） */}
            {hasContent && (
                <label className="inline-flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={overwriteExisting}
                        onChange={e => setOverwriteExisting(e.target.checked)}
                        className="h-4 w-4"
                    />
                    <span>覆盖已有内容</span>
                </label>
            )}

            {/* 笔记要求 */}
            <textarea
                value={noteRequest}
                onChange={e => setNoteRequest(e.target.value)}
                placeholder="输入笔记要求（可选）"
                className="w-full border rounded p-2 h-24 resize-none"
            />

            {/* 动作按钮 */}
            <button
                onClick={onGenerate}
                disabled={loading}
                className={`w-full flex items-center justify-center px-4 py-2 rounded font-semibold transition ${
                    loading
                        ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
            >
                <Send size={16} className="mr-2 flex-shrink-0" />
                {loading ? (hasContent ? '优化中...' : '生成中...') : actionLabel}
            </button>
        </div>
    );
}