'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Check, RefreshCcw } from 'lucide-react';
import { updatePrompt } from '@/lib/api/prompt';

export interface OptimizePanelProps {
    promptId: string;
    initialPrompt: string;
}

interface GoodCase {
    user: string;
    expected: string;
}
interface BadCase {
    user: string;
    bad: string;
    expected: string;
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

export default function OptimizePanel({ promptId, initialPrompt }: OptimizePanelProps) {
    const [step, setStep] = useState<Step>(Step.Cases);

    // Step 1: 设置用例
    const [goodCases, setGoodCases] = useState<GoodCase[]>([]);
    const [badCases, setBadCases] = useState<BadCase[]>([]);

    const addGood = () =>
        setGoodCases(prev => [...prev, { user: '', expected: '' }]);
    const updateGood = (i: number, key: keyof GoodCase, val: string) =>
        setGoodCases(prev =>
            prev.map((c, idx) => (idx === i ? { ...c, [key]: val } : c))
        );
    const removeGood = (i: number) =>
        setGoodCases(prev => prev.filter((_, idx) => idx !== i));

    const addBad = () =>
        setBadCases(prev => [...prev, { user: '', bad: '', expected: '' }]);
    const updateBad = (i: number, key: keyof BadCase, val: string) =>
        setBadCases(prev =>
            prev.map((c, idx) => (idx === i ? { ...c, [key]: val } : c))
        );
    const removeBad = (i: number) =>
        setBadCases(prev => prev.filter((_, idx) => idx !== i));

    // Step 2: 执行优化
    const [requirements, setRequirements] = useState('');
    const [optimizedPrompt, setOptimizedPrompt] = useState('');
    const [loadingOpt, setLoadingOpt] = useState(false);

    const handleOptimize = async () => {
        if (
            !requirements.trim() &&
            goodCases.length === 0 &&
            badCases.length === 0
        ) {
            alert('请至少填写示例或优化要求');
            return;
        }
        setLoadingOpt(true);
        // TODO: 调用后端优化 API
        await new Promise(r => setTimeout(r, 1000));
        setOptimizedPrompt(`// 要求：${requirements}\n\n（优化后 Prompt 示例）`);
        setLoadingOpt(false);
    };

    // Step 3: 验收测试
    const [testCases, setTestCases] = useState<TestCase[]>([]);

    useEffect(() => {
        if (step === Step.Test) {
            setTestCases(
                badCases.map(b => ({
                    user: b.user,
                    oldOutput: b.bad,
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
            // TODO: 调用模型接口，传入 optimizedPrompt
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
        setGoodCases([]);
        setBadCases([]);
    };

    return (
        <div className="flex flex-col h-full bg-white p-4 space-y-6">
            {/* 步骤导航 */}
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

            {/* Step 1: 设置用例 */}
            {step === Step.Cases && (
                <div className="overflow-auto space-y-6">
                    {/* Good Cases */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">好例 (Good Cases)</h4>
                            <button onClick={addGood} className="text-blue-600">
                                + 添加
                            </button>
                        </div>
                        {goodCases.map((c, i) => (
                            <div key={i} className="flex items-center space-x-2 mb-2">
                                <input
                                    className="flex-1 border p-2 rounded resize-x"
                                    placeholder="用户输入"
                                    value={c.user}
                                    onChange={e => updateGood(i, 'user', e.target.value)}
                                />
                                <input
                                    className="flex-1 border p-2 rounded resize-x"
                                    placeholder="期望输出"
                                    value={c.expected}
                                    onChange={e => updateGood(i, 'expected', e.target.value)}
                                />
                                <button
                                    onClick={() => removeGood(i)}
                                    className="text-red-600 px-2"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                    {/* Bad Cases */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">坏例 (Bad Cases)</h4>
                            <button onClick={addBad} className="text-blue-600">
                                + 添加
                            </button>
                        </div>
                        {badCases.map((c, i) => (
                            <div key={i} className="flex items-center space-x-2 mb-2">
                                <input
                                    className="flex-1 border p-2 rounded resize-x"
                                    placeholder="用户输入"
                                    value={c.user}
                                    onChange={e => updateBad(i, 'user', e.target.value)}
                                />
                                <input
                                    className="flex-1 border p-2 rounded resize-x"
                                    placeholder="模型不佳输出"
                                    value={c.bad}
                                    onChange={e => updateBad(i, 'bad', e.target.value)}
                                />
                                <input
                                    className="flex-1 border p-2 rounded resize-x"
                                    placeholder="期望输出"
                                    value={c.expected}
                                    onChange={e => updateBad(i, 'expected', e.target.value)}
                                />
                                <button
                                    onClick={() => removeBad(i)}
                                    className="text-red-600 px-2"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={() => setStep(Step.Optimize)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded flex items-center"
                        >
                            下一步 <ArrowRight className="ml-1" />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: 执行优化 */}
            {step === Step.Optimize && (
                <div className="overflow-auto space-y-6">
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
                                <RefreshCcw className="animate-spin mr-1" size={16} />
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
                {optimizedPrompt || <span className="text-gray-400">(尚无内容)</span>}
              </pre>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: 验收测试 */}
            {step === Step.Test && (
                <div className="overflow-auto space-y-4">
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
                            采纳Prompt
                        </button>
                    </div>
                    {/* 表头 */}
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
                                                    idx === i ? { ...x, selected: e.target.checked } : x
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
                                    {tc.pass === undefined ? '—' : tc.pass ? '合格' : '不合格'}
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