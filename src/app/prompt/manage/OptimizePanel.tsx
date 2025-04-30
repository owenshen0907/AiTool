'use client';

import React, { useState } from 'react';
import { Plus, Trash2, ArrowRightCircle, RefreshCcw, Check } from 'lucide-react';
import { updatePrompt } from '@/lib/api/prompt';

export interface OptimizePanelProps {
    promptId: string;
    initialPrompt: string;
}

interface Example {
    user: string;
    bad: string;
    good: string;
}

interface TestResult {
    user: string;
    bad: string;
    actual: string;
    expected: string;
}

export default function OptimizePanel({ promptId, initialPrompt }: OptimizePanelProps) {
    const [tab, setTab] = useState<'examples' | 'generate'>('examples');

    // 示例对照
    const [examples, setExamples] = useState<Example[]>([{ user: '', bad: '', good: '' }]);
    const addExample = () => setExamples(prev => [...prev, { user: '', bad: '', good: '' }]);
    const removeExample = (idx: number) => setExamples(prev => prev.filter((_, i) => i !== idx));
    const updateExample = (idx: number, key: keyof Example, val: string) =>
        setExamples(prev => prev.map((ex, i) => (i === idx ? { ...ex, [key]: val } : ex)));

    // 批量测试结果（示例）
    const [testResults, setTestResults] = useState<TestResult[]>(
        examples.map(ex => ({ user: ex.user, bad: ex.bad, actual: ex.bad, expected: ex.good }))
    );

    // 生成与对比
    const [prompt, setPrompt] = useState(initialPrompt);
    const [requirements, setRequirements] = useState('');
    const [optimizedPrompt, setOptimizedPrompt] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        // TODO: 调用优化 API 传参
        await new Promise(r => setTimeout(r, 1000));
        setOptimizedPrompt(`${prompt}\n\n// 要求：${requirements}\n\n// （优化后示例）`);
        setLoading(false);
    };

    const handleAdopt = async () => {
        if (!optimizedPrompt) return;
        await updatePrompt({ id: promptId, content: optimizedPrompt });
        alert('已采纳并保存');
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow">
            {/* Tabs */}
            <div className="flex border-b">
                <button
                    className={`flex-1 py-2 text-center ${tab === 'examples' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}
                    onClick={() => setTab('examples')}
                >
                    示例对照 / 测试
                </button>
                <button
                    className={`flex-1 py-2 text-center ${tab === 'generate' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}
                    onClick={() => setTab('generate')}
                >
                    生成优化
                </button>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-6">
                {tab === 'examples' ? (
                    <>
                        {/* 示例对照 */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">示例对照（三列）</span>
                                <button onClick={addExample} className="flex items-center text-blue-600">
                                    <Plus size={16} /> <span className="ml-1">添加示例</span>
                                </button>
                            </div>
                            {examples.map((ex, i) => (
                                <div key={i} className="grid grid-cols-3 gap-4 mb-2 relative">
                  <textarea
                      className="w-full h-16 p-2 border rounded resize-none"
                      placeholder="用户输入"
                      value={ex.user}
                      onChange={e => updateExample(i, 'user', e.target.value)}
                  />
                                    <textarea
                                        className="w-full h-16 p-2 border rounded resize-none"
                                        placeholder="模型不佳输出"
                                        value={ex.bad}
                                        onChange={e => updateExample(i, 'bad', e.target.value)}
                                    />
                                    <textarea
                                        className="w-full h-16 p-2 border rounded resize-none"
                                        placeholder="期望输出"
                                        value={ex.good}
                                        onChange={e => updateExample(i, 'good', e.target.value)}
                                    />
                                    <button
                                        className="absolute top-0 right-0 text-red-600"
                                        onClick={() => removeExample(i)}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* 测试结果 */}
                        <div className="space-y-2">
                            <h4 className="font-medium">测试结果</h4>
                            <div className="space-y-2">
                                {testResults.map((res, i) => (
                                    <div key={i} className="border rounded p-2 space-y-1">
                                        <div className="text-sm">输入：<span className="font-medium">{res.user}</span></div>
                                        <div className="text-sm text-red-600">旧输出：{res.bad}</div>
                                        <div className="text-sm text-gray-800">实际输出：{res.actual}</div>
                                        <div className="text-sm text-green-600">期望输出：{res.expected}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* 生成优化 */}
                        <div>
                            <label className="block mb-1 font-medium">原始 Prompt</label>
                            <textarea
                                className="w-full h-32 p-2 border rounded resize-none"
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block mb-1 font-medium">额外要求</label>
                            <textarea
                                className="w-full h-16 p-2 border rounded resize-none"
                                value={requirements}
                                onChange={e => setRequirements(e.target.value)}
                                placeholder="补充对优化的额外要求"
                            />
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                onClick={handleGenerate}
                                disabled={loading}
                            >
                                {loading ? <RefreshCcw className="animate-spin" size={16} /> : <ArrowRightCircle size={16} />}<span className="ml-1">生成优化 Prompt</span>
                            </button>
                            {optimizedPrompt && (
                                <button
                                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    onClick={handleAdopt}
                                >
                                    <Check size={16} /> <span className="ml-1">采纳并保存</span>
                                </button>
                            )}
                        </div>

                        {optimizedPrompt && (
                            <div className="mt-4 space-y-2">
                                <h4 className="font-medium">优化前后对比</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-2 border rounded bg-gray-50 whitespace-pre-wrap">{prompt}</div>
                                    <div className="p-2 border rounded bg-gray-50 whitespace-pre-wrap">{optimizedPrompt}</div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}