// File: app/prompt/case/content/hooks/useCaseTester.ts
'use client';

import { useState, useCallback } from 'react';
import type { CaseRow } from '../CaseTable';
import type { Supplier } from '@/lib/models/model';

/**
 * Hook that handles single and batch LLM testing logic
 */
export function useCaseTester(
    suppliers: Supplier[],
    supplierId: string,
    testModel: string,
    prompt: string,
    concurrency: number
) {
    const [testing, setTesting] = useState(false);

    const executeSingle = useCallback(
        async (row: CaseRow, onUpdate: (r: CaseRow) => void) => {
            if (!supplierId || !testModel) return;
            const sup = suppliers.find((s) => s.id === supplierId);
            if (!sup) return;
            setTesting(true);
            let accum = '';

            try {
                const res = await fetch(`${sup.apiUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${sup.apiKey}`,
                    },
                    body: JSON.stringify({
                        model: testModel,
                        stream: true,
                        messages: [
                            { role: 'system', content: prompt },
                            { role: 'user', content: row.caseText },
                        ],
                    }),
                });
                if (!res.body) throw new Error('No response stream');

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let done = false;

                while (!done) {
                    const { value, done: doneReading } = await reader.read();
                    done = doneReading;
                    const chunk = decoder.decode(value, { stream: true });
                    chunk.split('\n').forEach((line) => {
                        if (!line.startsWith('data: ')) return;
                        const jsonStr = line.slice(6).trim();
                        if (jsonStr === '[DONE]') return;
                        try {
                            const pkg = JSON.parse(jsonStr);
                            const delta = pkg.choices[0].delta.content;
                            if (delta) {
                                accum += delta;
                                onUpdate({ ...row, testResult: accum });
                            }
                        } catch {}
                    });
                }

                // final pass/fail
                onUpdate({
                    ...row,
                    testResult: accum,
                    passed: accum.trim() === row.groundTruth.trim(),
                });
            } catch (e) {
                console.error(e);
            } finally {
                setTesting(false);
            }
        },
        [suppliers, supplierId, testModel, prompt]
    );

    const executeBatch = useCallback(
        async (rows: CaseRow[], onUpdate: (r: CaseRow) => void) => {
            const toTest = rows.filter((r) => r.selected);
            if (!toTest.length) return;

            setTesting(true);
            let idx = 0;

            // 递归取下一个任务，直到跑完
            const runNext = async () => {
                if (idx >= toTest.length) return;
                const row = toTest[idx++];
                await executeSingle(row, onUpdate);
                await runNext();
            };

            // 启动 concurrency 个并发 worker
            const workers = Array.from(
                { length: Math.min(concurrency, toTest.length) },
                () => runNext()
            );

            // 等所有 worker 结束
            await Promise.all(workers);
            setTesting(false);
        },
        [executeSingle, concurrency]
    );

    return { testing, executeSingle, executeBatch };
}