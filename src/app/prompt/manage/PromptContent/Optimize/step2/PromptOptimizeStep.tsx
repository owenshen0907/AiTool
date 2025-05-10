// File: src/app/prompt/manage/PromptContent/Optimize/step2/PromptOptimizeStep.tsx
'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, Check, RefreshCcw } from 'lucide-react';
import type { GoodCaseItem, BadCaseItem } from '@/lib/models/prompt/prompt';

export interface PromptOptimizeStepProps {
    /** 原始 Prompt 文本，只读 */
    initialPrompt: string;
    /** 好例列表 */
    goodCases: GoodCaseItem[];
    /** 坏例列表 */
    badCases: BadCaseItem[];
    /** 优化要求文本 */
    requirements: string;
    /** 是否正在优化 */
    loading: boolean;
    /** 优化后结果 */
    optimizedPrompt: string;
    /** 优化要求变更回调 */
    onRequirementsChange: (v: string) => void;
    /** 优化后 Prompt 变更回调 */
    onOptimizedChange: (v: string) => void;
    /** 点击“返回” */
    onBack: () => void;
    /** 点击“开始优化” */
    onOptimize: () => void;
    /** 点击“下一步” */
    onNext: () => void;
    /** 点击“立即采纳” */
    onAdopt: () => void;
}

export default function PromptOptimizeStep({
                                               initialPrompt,
                                               goodCases,
                                               badCases,
                                               requirements,
                                               loading,
                                               optimizedPrompt,
                                               onRequirementsChange,
                                               onOptimizedChange,
                                               onBack,
                                               onOptimize,
                                               onNext,
                                               onAdopt,
                                           }: PromptOptimizeStepProps) {
    return (
        <div className="space-y-6 overflow-auto">
            {/* 优化要求 */}
            <div>
                <label className="block font-medium mb-1">优化要求 (可选)</label>
                <textarea
                    className="w-full h-24 border p-2 rounded resize-none"
                    value={requirements}
                    onChange={e => onRequirementsChange(e.target.value)}
                />
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-4">
                <button
                    onClick={onBack}
                    className="px-4 py-2 bg-gray-200 rounded flex items-center"
                >
                    <ArrowLeft className="mr-1" /> 返回
                </button>
                <button
                    type="button"
                    onClick={onOptimize}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded flex items-center"
                >
                    {loading ? (
                        <RefreshCcw className="animate-spin mr-1" />
                    ) : (
                        <Check className="mr-1" />
                    )}
                    开始优化
                </button>
                {optimizedPrompt && (
                    <button
                        onClick={onNext}
                        className="px-4 py-2 bg-indigo-600 text-white rounded flex items-center"
                    >
                        下一步 <ArrowRight className="ml-1" />
                    </button>
                )}
            </div>

            {/* Prompt 对比 */}
            <div className="flex space-x-4">
                {/* 原始 Prompt */}
                <div className="flex-1">
                    <h4 className="font-medium mb-1">原始 Prompt</h4>
                    <pre className="border p-2 rounded bg-gray-50 whitespace-pre-wrap">
            {initialPrompt}
          </pre>
                </div>

                {/* 优化后 Prompt */}
                <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">优化后 Prompt</h4>
                        <button
                            onClick={onAdopt}
                            disabled={!optimizedPrompt.trim()}
                            className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                        >
                            立即采纳
                        </button>
                    </div>
                    <textarea
                        className="w-full h-40 border p-2 rounded resize-y bg-gray-50 focus:bg-white whitespace-pre-wrap"
                        value={optimizedPrompt}
                        onChange={e => onOptimizedChange(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
}