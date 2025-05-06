// src/app/prompt/manage/PromptContent/Optimize/OptimizePanel.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CasesSetupPanel from './step1/CasesSetupPanel';
import PromptOptimizeStep from './step2/PromptOptimizeStep';
import PromptValidateStep, { TestCase } from './step3/PromptValidateStep';
import { parseSSEStream } from '@/lib/utils/sse';
import { updatePrompt } from '@/lib/api/prompt';
import type { GoodCaseItem, BadCaseItem } from '@/lib/models/prompt';

export interface OptimizePanelProps {
    promptId: string;
    initialPrompt: string;
    onPromptUpdated: () => void;
}

enum Step {
    Cases = 1,
    Optimize,
    Test,
}

export default function OptimizePanel({
                                          promptId,
                                          initialPrompt,
                                          onPromptUpdated
                                      }: OptimizePanelProps) {
    const router = useRouter();
    const [step, setStep] = useState<Step>(Step.Cases);

    // 用例数据由 CasesSetupPanel 通过 onLoadedGood/onLoadedBad 填充
    const [goodCases, setGoodCases] = useState<GoodCaseItem[]>([]);
    const [badCases, setBadCases] = useState<BadCaseItem[]>([]);

    // Step2 状态
    const [requirements, setRequirements] = useState('');
    const [optimizedPrompt, setOptimizedPrompt] = useState('');
    const [loadingOpt, setLoadingOpt] = useState(false);

    const handleOptimize = useCallback(async () => {
        if (
            goodCases.length === 0 &&
            badCases.length === 0 &&
            !requirements.trim() &&
            !initialPrompt.trim()
        ) {
            alert('请至少填写原始 Prompt、示例或优化要求');
            return;
        }
        setLoadingOpt(true);
        setOptimizedPrompt('');

        const blocks: string[] = [];

        if (initialPrompt.trim()) {
            blocks.push(
                `【原始 Prompt 开始】\n${initialPrompt.trim()}\n【原始 Prompt 结束】`
            );
        }

        if (goodCases.length > 0) {
            const goodText = goodCases
                .map(
                    (c, i) =>
                        `好例 ${i + 1}：\n  输入：${c.user_input}\n  期望：${c.expected}`
                )
                .join('\n\n');
            blocks.push(`【好例开始】\n${goodText}\n【好例结束】`);
        }

        if (badCases.length > 0) {
            const badText = badCases
                .map(
                    (c, i) =>
                        `坏例 ${i + 1}：\n  输入：${c.user_input}\n  模型不佳输出：${c.bad_output}\n  期望：${c.expected}`
                )
                .join('\n\n');
            blocks.push(`【坏例开始】\n${badText}\n【坏例结束】`);
        }

        if (requirements.trim()) {
            blocks.push(
                `【优化要求开始】\n${requirements.trim()}\n【优化要求结束】`
            );
        }

        const userContent = blocks.join('\n\n');

        const res = await fetch('/api/completions', {
            method: 'POST',                             // ← 一定要写 POST
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',                 // 如果你需要带 cookie
            body: JSON.stringify({
                scene: 'PROMPT_OPT',
                messages: [
                    { role: 'user', content: userContent }
                ]
            }),
        });
        if (res.body) {
            let acc = '';
            await parseSSEStream(res.body, ({ type, text }) => {
                if (type === 'content') {
                    acc += text;
                    setOptimizedPrompt(acc);
                }
            });
        } else {
            const data = await res.json();
            setOptimizedPrompt(data.choices?.[0]?.message?.content ?? '');
        }

        setLoadingOpt(false);
    }, [initialPrompt, goodCases, badCases, requirements]);

    // Step3: 验收测试
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
            } else {
                const actual = '模型新输出示例';
                results.push({ ...tc, newOutput: actual });
            }
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
        // 刷新数据而不是整页重载
        onPromptUpdated();
        setStep(Step.Cases);
        setOptimizedPrompt('');
    };

    return (
        <div className="flex flex-col h-full bg-white p-4 space-y-6">
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

            {/* Step1 */}
            {step === Step.Cases && (
                <CasesSetupPanel
                    promptId={promptId}
                    onLoadedGood={setGoodCases}
                    onLoadedBad={setBadCases}
                />
            )}

            {/* Step2 */}
            {step === Step.Optimize && (
                <PromptOptimizeStep
                    initialPrompt={initialPrompt}
                    goodCases={goodCases}
                    badCases={badCases}
                    requirements={requirements}
                    loading={loadingOpt}
                    optimizedPrompt={optimizedPrompt}
                    onRequirementsChange={setRequirements}
                    onOptimizedChange={setOptimizedPrompt}
                    onBack={() => setStep(Step.Cases)}
                    onOptimize={handleOptimize}
                    onNext={() => setStep(Step.Test)}
                    onAdopt={handleAdopt}
                />
            )}

            {/* Step3 */}
            {step === Step.Test && (
                <PromptValidateStep
                    testCases={testCases}
                    onBack={() => setStep(Step.Optimize)}
                    onRunTests={runTests}
                    onEvaluate={evaluate}
                    onAdopt={handleAdopt}
                    onToggleSelect={(i, sel) =>
                        setTestCases(prev =>
                            prev.map((x, idx) => (idx === i ? { ...x, selected: sel } : x))
                        )
                    }
                />
            )}
        </div>
    );
}
