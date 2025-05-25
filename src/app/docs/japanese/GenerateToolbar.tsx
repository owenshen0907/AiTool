// File: src/app/docs/japanese/GenerateToolbar.tsx
'use client';

import React from 'react';
import SupplierModelSelector from './SupplierModelSelector';
import { Send } from 'lucide-react';

interface Props {
    supplierId: string;
    onSupplierChange: (id: string) => void;
    model: string;
    onModelChange: (name: string) => void;
    onGenerate: () => void;
    loading: boolean;
}

export default function GenerateToolbar({
                                            supplierId,
                                            onSupplierChange,
                                            model,
                                            onModelChange,
                                            onGenerate,
                                            loading,
                                        }: Props) {
    return (
        <div className="flex items-center justify-between mb-4">
            {/* 左侧：供应商 & 模型 选择 */}
            <SupplierModelSelector
                supplierId={supplierId}
                onSupplierChange={onSupplierChange}
                model={model}
                onModelChange={onModelChange}
            />

            {/* 右侧：一键生成笔记 */}
            <button
                onClick={onGenerate}
                disabled={loading}
                className={`flex items-center px-4 py-2 rounded font-semibold transition-colors duration-200 ${
                    loading
                        ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
            >
                <Send size={16} className="mr-2" />
                {loading ? '生成中...' : '生成笔记'}
            </button>
        </div>
    );
}
