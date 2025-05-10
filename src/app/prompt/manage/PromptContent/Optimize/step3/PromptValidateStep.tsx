// File: src/app/prompt/manage/PromptContent/Optimize/step3/PromptValidateStep.tsx
'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import type { BadCaseItem } from '@/lib/models/prompt/prompt';

export interface TestCase {
    user: string;
    oldOutput: string;
    newOutput: string;
    expected: string;
    selected: boolean;
    pass?: boolean;
}

export interface PromptValidateStepProps {
    /** 测试用例列表 */
    testCases: TestCase[];
    onBack: () => void;
    onRunTests: () => void;
    onEvaluate: () => void;
    onAdopt: () => void;
    onToggleSelect: (index: number, selected: boolean) => void;
}

export default function PromptValidateStep({
                                               testCases,
                                               onBack,
                                               onRunTests,
                                               onEvaluate,
                                               onAdopt,
                                               onToggleSelect,
                                           }: PromptValidateStepProps) {
    return (
        <div className="space-y-4 overflow-auto">
            <div className="flex space-x-4">
                <button
                    onClick={onBack}
                    className="px-4 py-2 bg-gray-200 rounded flex items-center"
                >
                    <ArrowLeft className="mr-1" /> 返回优化
                </button>
                <button
                    onClick={onRunTests}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                    批量测试
                </button>
                <button
                    onClick={onEvaluate}
                    className="px-4 py-2 bg-indigo-600 text-white rounded"
                >
                    一键评估
                </button>
                <button
                    onClick={onAdopt}
                    className="px-4 py-2 bg-green-600 text-white rounded"
                >
                    采纳 Prompt
                </button>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                    <th className="w-12 p-2" />
                    <th className="p-2 text-left">输入</th>
                    <th className="p-2 text-left">旧输出</th>
                    <th className="p-2 text-left">新输出</th>
                    <th className="p-2 text-left">期望</th>
                    <th className="w-24 p-2 text-center">状态</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                {testCases.map((tc, i) => (
                    <tr key={i}>
                        <td className="p-2 text-center">
                            <input
                                type="checkbox"
                                checked={tc.selected}
                                onChange={e => onToggleSelect(i, e.target.checked)}
                            />
                        </td>
                        <td className="p-2 max-w-xs truncate">{tc.user}</td>
                        <td className="p-2">
                <textarea
                    readOnly
                    className="w-full resize-y border-none bg-transparent"
                    value={tc.oldOutput}
                />
                        </td>
                        <td className="p-2">
                <textarea
                    readOnly
                    className="w-full resize-y border-none bg-transparent"
                    value={tc.newOutput}
                />
                        </td>
                        <td className="p-2">
                <textarea
                    readOnly
                    className="w-full resize-y border-none bg-transparent"
                    value={tc.expected}
                />
                        </td>
                        <td className="p-2 text-center font-medium">
                            {tc.pass == null ? '—' : tc.pass ? '合格' : '不合格'}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}