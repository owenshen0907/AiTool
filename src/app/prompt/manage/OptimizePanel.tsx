'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight, ArrowLeft, Check, RefreshCcw } from 'lucide-react';
import { parseSSEStream } from '@/lib/utils/sse';
import { updatePrompt } from '@/lib/api/prompt';
import CasesSetupPanel from '@/app/prompt/manage/CasesSetupPanel';
import type { GoodCaseItem, BadCaseItem } from '@/lib/models/prompt';

export interface OptimizePanelProps {
    promptId: string;
    initialPrompt: string;
}

interface TestCase {
    user: string;
    oldOutput: string;
    newOutput: string;
    expected: string;
    selected: boolean;
    pass?: boolean;
}

enum Step {
    Cases = 1,
    Optimize,
    Test,
}

export default function OptimizePanel({
                                          promptId,
                                          initialPrompt,
                                      }: OptimizePanelProps) {
    const [step, setStep] = useState<Step>(Step.Cases);

    // Use case data lifted from CasesSetupPanel
    const [goodCases, setGoodCases] = useState<GoodCaseItem[]>([]);
    const [badCases, setBadCases] = useState<BadCaseItem[]>([]);

    // Step 2: optimization state
    const [requirements, setRequirements] = useState('');
    const [optimizedPrompt, setOptimizedPrompt] = useState('');
    const [loadingOpt, setLoadingOpt] = useState(false);

    const handleOptimize = useCallback(async () => {
        if (
            !requirements.trim() &&
            goodCases.length === 0 &&
            badCases.length === 0
        ) {
            alert('请至少填写示例或优化要求');
            return;
        }
        setLoadingOpt(true);

        const goodText = goodCases
            .map(
                (c, i) =>
                    `好例${i + 1}:\n  输入: ${c.user_input}\n  期望: ${c.expected}`
            )
            .join('\n\n');
        const badText = badCases
            .map(
                (c, i) =>
                    `坏例${i + 1}:\n  输入: ${c.user_input}\n  模型不佳输出: ${c.bad_output}\n  期望: ${c.expected}`
            )
            .join('\n\n');
        const userContent = [
            `原始 Prompt：\n${initialPrompt}`,
            goodText && `=== 好例 ===\n${goodText}`,
            badText && `=== 坏例 ===\n${badText}`,
            requirements && `=== 优化要求 ===\n${requirements}`,
        ]
            .filter(Boolean)
            .join('\n\n');

        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                scene: 'PROMPT_OPT',
                messages: [{ role: 'user', content: userContent }],
            }),
        });

        if (res.body) {
            let reply = '';
            await parseSSEStream(res.body, (evt: any) => {
                const chunk = evt.choices?.[0]?.delta?.content;
                if (chunk) {
                    reply += chunk;
                    setOptimizedPrompt(reply);
                }
            });
        } else {
            const data = await res.json();
            setOptimizedPrompt(data.choices?.[0]?.message?.content ?? '');
        }

        setLoadingOpt(false);
    }, [initialPrompt, goodCases, badCases, requirements]);

    // Step 3: test/acceptance
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    useEffect(() => {
        if (step === Step.Test) {
            setTestCases(
                badCases.map(b => ({
                    user: b.user_input,
                    oldOutput: b.bad_output,
                    newOutput: '',
                    expected: b.expected,
                    selected: true,
                }))
            );
        }
    }, [step, badCases]);

    const runTests = async () => {
        const results: TestCase[] = [];
        for (const tc of testCases) {
            if (!tc.selected) {
                results.push(tc);
                continue;
            }
            // TODO: real model call
            const actual = '模型新输出示例';
            results.push({ ...tc, newOutput: actual });
        }
        setTestCases(results);
    };

    const evaluate = () => {
        setTestCases(prev =>
            prev.map(tc => ({
                ...tc,
                pass: tc.newOutput.trim() === tc.expected.trim(),
            }))
        );
    };

    const handleAdopt = async () => {
        await updatePrompt({ id: promptId, content: optimizedPrompt });
        alert('已采纳新 Prompt');
        setStep(Step.Cases);
        setOptimizedPrompt('');
    };

    return (
        <div className="flex flex-col h-full bg-white p-4 space-y-6">
            {/* Step Navigation */}
            <div className="flex justify-center space-x-4">
                {['1. 设置用例', '2. 执行优化', '3. 验收测试'].map((label, idx) => (
                    <button
                        key={idx}
                        onClick={() => setStep((idx + 1) as Step)}
                        className={`px-3 py-1 rounded-full ${
                            step === idx + 1
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-200 text-gray-600'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Step 1: Case setup */}
            {step === Step.Cases && (
                <div className="overflow-auto">
                    <CasesSetupPanel
                        promptId={promptId}
                        goodCases={goodCases}
                        badCases={badCases}
                        onChangeGood={setGoodCases}
                        onChangeBad={setBadCases}
                    />
                </div>
            )}

            {/* Step 2: Optimize */}
            {step === Step.Optimize && (
                <div className="space-y-6 overflow-auto">
                    <div>
                        <label className="block font-medium mb-1">
                            优化要求 (可选)
                        </label>
                        <textarea
                            className="w-full h-24 border p-2 rounded resize-none"
                            value={requirements}
                            onChange={e => setRequirements(e.target.value)}
                        />
                    </div>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setStep(Step.Cases)}
                            className="px-4 py-2 bg-gray-200 rounded flex items-center"
                        >
                            <ArrowLeft className="mr-1" /> 返回
                        </button>
                        <button
                            onClick={handleOptimize}
                            disabled={loadingOpt}
                            className="px-4 py-2 bg-green-600 text-white rounded flex items-center"
                        >
                            {loadingOpt ? (
                                <RefreshCcw className="animate-spin mr-1" />
                            ) : (
                                <Check className="mr-1" />
                            )}
                            开始优化
                        </button>
                        {optimizedPrompt && (
                            <button
                                onClick={() => setStep(Step.Test)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded flex items-center"
                            >
                                下一步 <ArrowRight className="ml-1" />
                            </button>
                        )}
                    </div>
                    <div className="flex space-x-4">
                        <div className="flex-1">
                            <h4 className="font-medium mb-1">原始 Prompt</h4>
                            <pre className="border p-2 rounded bg-gray-50 whitespace-pre-wrap">
                {initialPrompt}
              </pre>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium mb-1">优化后 Prompt</h4>
                            <pre className="border p-2 rounded bg-gray-50 whitespace-pre-wrap min-h-[120px]">
                {optimizedPrompt || (
                    <span className="text-gray-400">(尚无内容)</span>
                )}
              </pre>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Test & Accept */}
            {step === Step.Test && (
                <div className="space-y-4 overflow-auto">
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setStep(Step.Optimize)}
                            className="px-4 py-2 bg-gray-200 rounded flex items-center"
                        >
                            <ArrowLeft className="mr-1" /> 返回优化
                        </button>
                        <button
                            onClick={runTests}
                            className="px-4 py-2 bg-blue-600 text-white rounded"
                        >
                            批量测试
                        </button>
                        <button
                            onClick={evaluate}
                            className="px-4 py-2 bg-indigo-600 text-white rounded"
                        >
                            一键评估
                        </button>
                        <button
                            onClick={handleAdopt}
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
                                        onChange={e =>
                                            setTestCases(prev =>
                                                prev.map((x, idx) =>
                                                    idx === i
                                                        ? { ...x, selected: e.target.checked }
                                                        : x
                                                )
                                            )
                                        }
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
            )}
        </div>
    );
}